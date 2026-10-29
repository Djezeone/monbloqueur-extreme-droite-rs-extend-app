import { ConnectorError, connectorImplementation, cooldownTime } from "./internal.js";
import { createOrchestrator } from "./orchestration.js";

const authFailures = new Set(["unauthorized", "forbidden", "identity-mismatch"]);
const definiteRefusals = new Set(["unauthorized", "forbidden", "provider-rejected", "record-conflict", "rate-limited"]);
const clone = value => structuredClone(value);
const terminal = (status, reason, extra = {}) => ({status,reason,accepted:false,changed:false,confirmed:false,evidence:null,...extra});

// Deliberately not imported by the PWA shell. Journal and transport dependencies
// are trusted application capabilities, never restored from a personal backup.
export function createDurableOrchestrator({ connector, journal, now = Date.now } = {}) {
  const implementation = connectorImplementation(connector);
  if (!journal || typeof journal.read !== "function" || typeof journal.compareAndSet !== "function") throw new ConnectorError("durable-journal-required");
  if (typeof now !== "function") throw new ConnectorError("invalid-clock");
  const lane = Object.freeze({provider:connector.provider,accountId:connector.accountId,origin:connector.origin});
  const tickets = new WeakMap();
  let active = null;
  let stopped = false;
  function clock() {
    const value = now();
    if (!Number.isSafeInteger(value) || value < 0) throw new ConnectorError("invalid-clock");
    return value;
  }
  function next(record, patch) {
    const {revision,...previous} = record;
    return {...previous,...patch,updatedAt:Math.max(clock(),record.updatedAt)};
  }
  async function checkpoint(context, patch) {
    const committed = await journal.compareAndSet(lane,context.record.revision,next(context.record,patch));
    if (!committed) throw new ConnectorError("journal-conflict");
    context.record = committed;
    return committed;
  }
  const engine = createOrchestrator({connector,now:clock,beforeSend:async () => {
    const context = active;
    if (!context?.record || context.kind !== "execute" || context.controller.signal.aborted) throw new ConnectorError("cancelled");
    if (context.record.attempts >= 100) throw new ConnectorError("send-budget-exhausted");
    await checkpoint(context,{phase:"sending",attempts:context.record.attempts+1,reason:null,observation:null});
  }});

  function grantConsent(options = {}) {
    if (stopped) throw new ConnectorError("session-stopped");
    const ticket = engine.grantConsent(options);
    tickets.set(ticket,{target:JSON.stringify(ticket.target),action:ticket.action,expiresAt:ticket.expiresAt,used:false});
    return ticket;
  }
  function storageFailure(context, known = {}) {
    const possible = (context.record?.attempts ?? 0) > 0;
    return terminal(possible ? "unknown" : "rejected","journal-write-failed",{
      operationId:context.record?.operationId ?? null,
      accepted:known.accepted === true ? true : possible ? null : false,
      changed:known.changed === true
    });
  }
  async function finish(context, result) {
    if (authFailures.has(result.reason)) stopped = true;
    const attempted = context.record.attempts > 0;
    const refused = (result.status === "rejected" || result.status === "cooldown") && result.accepted === false && definiteRefusals.has(result.reason);
    const uncertain = attempted && result.status !== "confirmed" && !refused;
    const reason = stopped ? "session-stopped" : uncertain ? "uncertain" : result.status === "confirmed" ? "completed" : result.status === "cooldown" ? "rate-limited" : attempted ? "provider-refusal" : "no-write";
    try {
      await checkpoint(context,{phase:uncertain ? "quarantined" : "closed",reason,retryAt:result.retryAt ?? 0});
      return {...result,operationId:context.record.operationId};
    } catch { return storageFailure(context,result); }
  }
  async function execute({consent,target:input,action,signal} = {}) {
    let target;
    try {
      if (action !== "block" && action !== "unblock") throw new ConnectorError("invalid-action");
      target = implementation.normalizeTarget(input);
    } catch { return terminal("rejected","invalid-target-or-action"); }
    const ticket = consent && tickets.get(consent);
    if (!ticket || ticket.used || ticket.action !== action || ticket.target !== JSON.stringify(target) || clock() >= ticket.expiresAt) return terminal("rejected","consent-invalid");
    ticket.used = true;
    if (stopped) return terminal("rejected","session-stopped");
    if (active) return terminal("rejected","operation-active");
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort",abort,{once:true});
    const context = {kind:"execute",controller,record:null};
    active = context;
    try {
      if (controller.signal.aborted) return terminal("cancelled","cancelled");
      const previous = await journal.read(lane);
      if (previous?.phase === "quarantined" || previous?.phase === "sending") return terminal("rejected","needs-reconciliation");
      if (previous?.phase === "prepared") return terminal("rejected","operation-active");
      if (previous?.reason === "session-stopped") {stopped=true;return terminal("rejected","session-stopped");}
      if ((previous?.retryAt ?? 0) > clock()) return terminal("cooldown","rate-limited",{retryAt:previous.retryAt});
      const at = clock();
      context.record = await journal.compareAndSet(lane,previous?.revision ?? null,{
        version:1,operationId:globalThis.crypto.randomUUID(),target:clone(target),targetKey:implementation.targetKey(target),action,
        phase:"prepared",attempts:0,createdAt:at,updatedAt:at,retryAt:0,reason:null,observation:null
      });
      if (!context.record) return terminal("rejected","journal-conflict");
      if (controller.signal.aborted) return await finish(context,terminal("cancelled","cancelled"));
      const result = await engine.execute({consent,target,action,signal:controller.signal});
      return await finish(context,result);
    } catch { return storageFailure(context); }
    finally {active=null;signal?.removeEventListener("abort",abort);}
  }

  async function getCheckpoint() {
    // A checkpoint is local execution metadata, never current provider evidence.
    return {checkpoint:await journal.read(lane),confirmed:false,evidence:null};
  }
  async function recover() {
    if (stopped) return terminal("rejected","session-stopped");
    if (active) return terminal("rejected","operation-active");
    const context = {kind:"recover",controller:new AbortController(),record:null};
    active=context;
    try {
      context.record=await journal.read(lane);
      if (context.record?.reason === "session-stopped") {stopped=true;return terminal("rejected","session-stopped");}
      if ((context.record?.retryAt ?? 0) > clock()) return terminal("cooldown","rate-limited",{retryAt:context.record.retryAt});
      if (!context.record || context.record.phase === "closed") return terminal("rejected","no-unresolved-operation");
      if (context.record.phase === "prepared") {
        await checkpoint(context,{phase:"closed",reason:"interrupted-before-send"});
        return terminal("cancelled","interrupted-before-send",{operationId:context.record.operationId});
      }
      await checkpoint(context,{phase:"quarantined",reason:"interrupted-after-send"});
      const state=await connector.inspect(context.record.target,{signal:context.controller.signal});
      if (context.controller.signal.aborted) throw new ConnectorError("cancelled");
      const observation={blocked:state.blocked,observedAt:clock()};
      const matches=state.blocked === (context.record.action === "block");
      await checkpoint(context,{phase:"quarantined",reason:matches ? "observed-match" : "observed-differs",observation});
      // Even matching GETs cannot prove that an older POST will not apply later.
      return terminal("unknown",matches ? "observed-match" : "observed-differs",{operationId:context.record.operationId,accepted:null,observation:{...observation,source:"provider-readback"}});
    } catch (error) {
      if (typeof error?.code === "string" && error.code.startsWith("journal-")) return storageFailure(context);
      if (authFailures.has(error?.code)) stopped=true;
      const limited=error?.code === "rate-limited";
      const reason=stopped ? "session-stopped" : limited ? "rate-limited" : "read-failed";
      const retryAt=limited ? Math.max(context.record?.retryAt ?? 0,cooldownTime(error.headers,clock())) : context.record?.retryAt ?? 0;
      if ((context.record?.attempts ?? 0) > 0) {
        try {await checkpoint(context,{phase:"quarantined",reason,retryAt});}
        catch {return storageFailure(context);}
      }
      return terminal(limited ? "cooldown" : "unknown",reason,{operationId:context.record?.operationId ?? null,accepted:null,...(limited ? {retryAt} : {})});
    } finally {active=null;}
  }
  return Object.freeze({grantConsent,execute,recover,getCheckpoint,cancel(operationId=active?.record?.operationId){
    if (!active || operationId !== active.record?.operationId) return false;
    active.controller.abort();return true;
  }});
}
