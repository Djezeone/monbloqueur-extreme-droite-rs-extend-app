import { connectorImplementation, ConnectorError, cooldownTime } from "./internal.js";

// Memory only. There is deliberately no import/restore path for consent or evidence.
export function createOrchestrator({ connector, now = Date.now, beforeSend = () => {} } = {}) {
  const implementation = connectorImplementation(connector);
  if (typeof now !== "function") throw new ConnectorError("invalid-clock");
  if (typeof beforeSend !== "function") throw new ConnectorError("invalid-send-gate");
  const tickets = new WeakMap();
  const operations = new Map();
  const unresolved = new Map();
  let active = null;
  let sequence = 0;
  let latest = null;
  let retryAt = 0;
  let stopped = false;
  const clone = value => structuredClone(value);
  function normalize(input, action) {
    if (action !== "block" && action !== "unblock") throw new ConnectorError("invalid-action");
    return implementation.normalizeTarget(input);
  }
  function transition(operation, status, reason = null) {
    operation.status = status;
    operation.reason = reason;
    operation.steps.push({ status, at:now() });
    return clone(operation);
  }
  function terminal(status, reason, extra = {}) {
    return { status, reason, accepted:false, confirmed:false, evidence:null, ...extra };
  }
  function guard(record, signal) {
    if (signal.aborted) throw new ConnectorError("cancelled", { sent:false });
    if (now() >= record.expiresAt) throw new ConnectorError("consent-expired");
    if (stopped) throw new ConnectorError("session-stopped");
    if (now() < retryAt) throw new ConnectorError("rate-limited");
  }
  function evidence(target, state) {
    return { source:"provider-readback", provider:connector.provider, accountId:connector.accountId, origin:connector.origin, target:clone(target), blocked:state.blocked, observedAt:now(), ...(state.records ? { records:clone(state.records) } : {}) };
  }
  function recordFailure(operation, error) {
    const safe = error instanceof ConnectorError ? error : new ConnectorError("connector-error");
    if (["unauthorized", "forbidden", "identity-mismatch"].includes(safe.code)) stopped = true;
    if (safe.code === "rate-limited") retryAt = Math.max(retryAt, cooldownTime(safe.headers, now()));
    if (safe.partialAccepted) {
      operation.accepted = true;
      operation.changed = true;
      if (operation.steps.at(-1).status !== "accepted") transition(operation, "accepted");
    }
    if (operation.accepted === true || safe.uncertain) {
      if (operation.accepted !== true) operation.accepted = null;
      unresolved.set(operation.targetKey, operation.operationId);
      if (retryAt > now()) operation.retryAt = retryAt;
      return transition(operation, "unknown", safe.code === "cancelled" ? "cancelled-after-send" : safe.code);
    }
    if (safe.code === "rate-limited") {
      operation.retryAt = retryAt;
      return transition(operation, "cooldown", "rate-limited");
    }
    return transition(operation, safe.code === "cancelled" ? "cancelled" : "rejected", safe.code);
  }
  function grantConsent({ accountId, target:input, action, explicit, ttlMs = 60_000 } = {}) {
    if (explicit !== true || accountId !== connector.accountId || !Number.isInteger(ttlMs) || ttlMs < 1 || ttlMs > 300_000) throw new ConnectorError("invalid-consent");
    const target = normalize(input, action);
    const ticket = Object.freeze({ provider:connector.provider, accountId, origin:connector.origin, target:typeof target === "object" ? Object.freeze(clone(target)) : target, action, expiresAt:now() + ttlMs });
    tickets.set(ticket, { fingerprint:JSON.stringify(target), action, expiresAt:ticket.expiresAt, used:false });
    return ticket;
  }
  async function execute({ consent, target:input, action, signal } = {}) {
    const record = consent && tickets.get(consent);
    let target;
    try { target = normalize(input, action); } catch { return terminal("rejected", "invalid-target-or-action"); }
    if (!record || record.used || record.action !== action || record.fingerprint !== JSON.stringify(target) || now() >= record.expiresAt) return terminal("rejected", "consent-invalid");
    record.used = true;
    if (stopped) return terminal("rejected", "session-stopped");
    if (active) return terminal("rejected", "operation-active");
    if (now() < retryAt) return terminal("cooldown", "rate-limited", { retryAt });
    const targetKey = implementation.targetKey(target);
    if (unresolved.has(targetKey)) return terminal("rejected", "needs-reconciliation");
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", onAbort, { once:true });
    const operation = {
      operationId:`operation-${++sequence}`, provider:connector.provider, accountId:connector.accountId, origin:connector.origin,
      target:clone(target), targetKey, action, status:"declared", reason:null, accepted:false, confirmed:false, changed:false, evidence:null, steps:[{ status:"declared", at:now() }]
    };
    operations.set(operation.operationId, operation);
    latest = operation.operationId;
    active = { id:operation.operationId, controller };
    try {
      guard(record, controller.signal);
      await implementation.readIdentity({ signal:controller.signal });
      const before = await implementation.readState(target, { signal:controller.signal });
      guard(record, controller.signal);
      const desired = action === "block";
      if (before.blocked === desired) {
        operation.confirmed = true;
        operation.evidence = evidence(target, before);
        return transition(operation, "confirmed", "already-observed");
      }
      // Verify identity again after the potentially long, paginated pre-read.
      await implementation.readIdentity({ signal:controller.signal });
      guard(record, controller.signal);
      const result = await implementation.write(target, action, before, { signal:controller.signal, now, beforeWrite:async () => {
        guard(record, controller.signal);
        await beforeSend();
        // Consent or cancellation can change while the durable gate commits.
        guard(record, controller.signal);
      } });
      operation.accepted = result.accepted;
      operation.changed = result.accepted;
      transition(operation, "accepted");
      if (controller.signal.aborted) throw new ConnectorError("cancelled");
      await implementation.readIdentity({ signal:controller.signal });
      const after = await implementation.readState(target, { signal:controller.signal });
      if (controller.signal.aborted) throw new ConnectorError("cancelled");
      if (after.blocked !== desired) {
        unresolved.set(targetKey, operation.operationId);
        operation.reason = "readback-differs";
        return clone(operation);
      }
      operation.confirmed = true;
      operation.evidence = evidence(target, after);
      return transition(operation, "confirmed");
    } catch (error) {
      return recordFailure(operation, error);
    } finally {
      active = null;
      signal?.removeEventListener("abort", onAbort);
    }
  }
  async function reconcile(operationId = latest) {
    const operation = operations.get(operationId);
    if (!operation || unresolved.get(operation.targetKey) !== operation.operationId) return terminal("rejected", "no-unresolved-operation");
    if (stopped) return terminal("rejected", "session-stopped");
    if (active) return terminal("rejected", "operation-active");
    if (now() < retryAt) return terminal("cooldown", "rate-limited", { retryAt });
    const controller = new AbortController();
    active = { id:operationId, controller };
    try {
      await implementation.readIdentity({ signal:controller.signal });
      const state = await implementation.readState(operation.target, { signal:controller.signal });
      if (controller.signal.aborted) throw new ConnectorError("cancelled");
      if (state.blocked === (operation.action === "block")) {
        operation.reconciled = true;
        unresolved.delete(operation.targetKey);
        operation.confirmed = true;
        operation.evidence = evidence(operation.target, state);
        return transition(operation, "confirmed", "reconciled-by-read");
      }
      // A different state cannot prove an old in-flight write will not apply later.
      // Keep the target blocked for further writes, even with another consent ticket.
      operation.observation = evidence(operation.target, state);
      return transition(operation, "unknown", "reconciled-state-differs");
    } catch (error) {
      return recordFailure(operation, error);
    } finally { active = null; }
  }
  return Object.freeze({
    grantConsent, execute, reconcile,
    cancel(operationId = active?.id) {
      if (!active || operationId !== active.id) return false;
      active.controller.abort();
      return true;
    },
    getOperation(operationId = latest) { return operations.has(operationId) ? clone(operations.get(operationId)) : null; }
  });
}
