import test from "node:test";
import assert from "node:assert/strict";
import { createMastodonConnector } from "../pwa/connectors/mastodon.js";
import { createBlueskyConnector } from "../pwa/connectors/bluesky.js";
import { createOrchestrator } from "../pwa/connectors/orchestration.js";
import { ConnectorError } from "../pwa/connectors/internal.js";

globalThis.fetch = () => { throw Error("No live network in durable tests"); };
const durable = await import("../pwa/connectors/durable-orchestration.js").catch(error => {
  if (error.code === "ERR_MODULE_NOT_FOUND") return {};
  throw error;
});
const origin = "https://social.example";
const wait = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const reply = (r, body, status = 200, headers = {}) => ({url:r.url,body,status,headers});
// Only the storage/HTTP boundaries are doubled here. Real transaction/abort/reload
// behavior is separately exercised by the browser suites with IndexedDB itself.
function memoryJournal() {
  let row = null;
  const j = {
    fail:null,
    async read() { if(j.fail) throw new ConnectorError(j.fail); return structuredClone(row); },
    async compareAndSet(lane, revision, next) {
      if(j.fail) throw new ConnectorError(j.fail);
      if((row?.revision ?? null) !== revision) return null;
      row = {...structuredClone(next),revision:(revision ?? 0)+1};
      return structuredClone(row);
    }
  };
  return j;
}
function fixture(options = {}) {
  const f = {now:1000,blocked:false,writes:[],reads:[],journal:memoryJournal(),...options};
  f.transport = async r => {
    if(r.method === "POST") f.writes.push(structuredClone({...r,signal:undefined}));
    else f.reads.push(r.url);
    const custom = await f.handle?.(r, f);
    if(custom !== undefined) return custom;
    if(r.url.includes("verify_credentials")) return reply(r,{id:"7"});
    if(r.url.includes("relationships")) return reply(r,[{id:"42",blocking:f.blocked}]);
    if(r.method === "POST") {f.blocked=r.url.endsWith("/block");return reply(r,{id:"42",blocking:f.blocked});}
    throw Error("Unexpected simulated route");
  };
  f.connector = createMastodonConnector({session:{type:"official-oauth",provider:"mastodon",accountId:"7",origin,scopes:["profile","write:blocks","read:follows"]},transport:f.transport,allowedOrigins:[origin],timeoutMs:options.timeoutMs ?? 1000});
  f.create = () => {
    assert.equal(typeof durable.createDurableOrchestrator,"function","durable runner must exist");
    return durable.createDurableOrchestrator({connector:f.connector,journal:f.journal,now:()=>f.now});
  };
  f.run = (runner, action="block", extra={}) => runner.execute({consent:runner.grantConsent({accountId:"7",target:"42",action,explicit:true}),target:"42",action,...extra});
  return f;
}

function partialFixture() {
  const actor="did:plc:aaaaaaaaaaaaaaaaaaaaaaaa",did="did:plc:bbbbbbbbbbbbbbbbbbbbbbbb",rkey="3lfilclair222";
  const records=new Map([rkey,"3lfilclair223"].map(key=>[key,{uri:`at://${actor}/app.bsky.graph.block/${key}`,cid:`cid-${key}`,value:{$type:"app.bsky.graph.block",subject:did,createdAt:"2026-10-29T00:00:00Z"}}]));
  const f={now:1000,records,journal:memoryJournal(),writes:0,reads:0};
  f.connector=createBlueskyConnector({session:{type:"official-oauth",provider:"bluesky",accountId:actor,origin:"https://pds.example",scopes:["atproto","repo:app.bsky.graph.block?action=create&action=delete"]},allowedOrigins:["https://pds.example"],transport:async r=>{
    if(r.method==="POST")f.writes++;else f.reads++;
    const custom=await f.handle?.(r,f);if(custom!==undefined)return custom;
    if(r.url.includes("getSession"))return reply(r,{did:actor});
    if(r.url.includes("listRecords"))return reply(r,{records:[...records.values()]});
    if(r.url.includes("deleteRecord")){records.delete(r.body.rkey);return reply(r,{});}
    throw Error("Unexpected simulated route");
  }});
  f.create=()=>durable.createDurableOrchestrator({connector:f.connector,journal:f.journal,now:()=>f.now});
  const target={did,rkey};
  f.run=runner=>runner.execute({consent:runner.grantConsent({accountId:actor,target,action:"unblock",explicit:true}),target,action:"unblock"});
  return f;
}

test("the private gate is awaited before a Mastodon POST starts",async()=>{
  const f=fixture();const entered=wait();const release=wait();
  const runner=createOrchestrator({connector:f.connector,now:()=>f.now,beforeSend:()=>{entered.resolve();return release.promise;}});
  const consent=runner.grantConsent({accountId:"7",target:"42",action:"block",explicit:true});
  const pending=runner.execute({consent,target:"42",action:"block"});
  const result=await Promise.race([entered.promise.then(()=>"gated"),pending.then(()=>"ungated")]);
  assert.equal(result,"gated");assert.equal(f.writes.length,0);
  release.resolve();assert.equal((await pending).status,"confirmed");assert.equal(f.writes.length,1);
});

test("durable execution closes only after fresh readback and does not restore its proof",async()=>{
  const f=fixture();const runner=f.create();const result=await f.run(runner);
  assert.equal(result.status,"confirmed");assert.equal(result.evidence.source,"provider-readback");
  assert.equal(f.writes.length,1);
  const checkpoint=await f.create().getCheckpoint();
  assert.equal(checkpoint.checkpoint.phase,"closed");assert.equal(checkpoint.confirmed,false);assert.equal(checkpoint.evidence,null);
  assert.equal(checkpoint.checkpoint.attempts,1);
  assert.ok(!JSON.stringify(checkpoint).includes("expiresAt"));
});

test("two runners competing for one account send at most one mutation",async()=>{
  const gate=wait(),entered=wait();const f=fixture({handle:async r=>{if(r.url.includes("verify_credentials")){entered.resolve();await gate.promise;}}});
  const first=f.create(),second=f.create();const pending=f.run(first);await entered.promise;
  const other=await f.run(second);assert.equal(other.confirmed,false);assert.equal(f.writes.length,0);
  assert.ok(["operation-active","journal-conflict","needs-reconciliation"].includes(other.reason));
  gate.resolve();assert.equal((await pending).status,"confirmed");assert.equal(f.writes.length,1);
});

test("old, cloned, consumed, and imported consent cannot authorize another execution",async()=>{
  const f=fixture();const first=f.create(),second=f.create();
  const consent=first.grantConsent({accountId:"7",target:"42",action:"block",explicit:true});
  for(const token of [consent,{...consent},{confirmed:true}]) {
    assert.equal((await second.execute({consent:token,target:"42",action:"block"})).reason,"consent-invalid");
  }
  assert.equal(f.writes.length,0);
  assert.equal((await first.execute({consent,target:"42",action:"block"})).status,"confirmed");
  assert.equal((await first.execute({consent,target:"42",action:"block"})).reason,"consent-invalid");
  assert.equal(f.writes.length,1);
});

test("prepared recovery fences the old pre-reading runner before its first POST",async()=>{
  const entered=wait(),release=wait();let paused=true;
  const f=fixture({handle:async r=>{if(paused && r.url.includes("relationships")){paused=false;entered.resolve();await release.promise;}}});
  const old=f.create();const pending=f.run(old);await entered.promise;
  const recovered=await f.create().recover();assert.equal(recovered.reason,"interrupted-before-send");
  assert.equal(f.writes.length,0);release.resolve();
  assert.equal((await pending).confirmed,false);assert.equal(f.writes.length,0);
});

test("a matching recovery observation cannot clear a send that may still be in flight",async()=>{
  const entered=wait(),release=wait();
  const f=fixture({handle:async(r,f)=>{if(r.method==="POST"){f.blocked=true;entered.resolve();await release.promise;return reply(r,{id:"42",blocking:true});}}});
  const first=f.create();const pending=f.run(first);await entered.promise;
  const reopened=f.create();const recovered=await reopened.recover();
  assert.equal(recovered.status,"unknown");assert.equal(recovered.confirmed,false);assert.equal(recovered.evidence,null);
  assert.equal(recovered.observation.blocked,true);
  assert.equal((await f.run(reopened,"unblock")).reason,"needs-reconciliation");
  release.resolve();assert.equal((await pending).confirmed,false);
  assert.equal((await reopened.getCheckpoint()).checkpoint.phase,"quarantined");
  assert.equal(f.writes.length,1);
});

test("a lost mutation reply is quarantined across restart and never retried",async()=>{
  const f=fixture({timeoutMs:10,handle:r=>r.method==="POST"?new Promise(()=>{}):undefined});
  const first=f.create();const result=await f.run(first);
  assert.equal(result.status,"unknown");assert.equal(result.confirmed,false);assert.equal(f.writes.length,1);
  const reopened=f.create();await reopened.recover();
  assert.equal((await f.run(reopened)).reason,"needs-reconciliation");assert.equal(f.writes.length,1);
});

test("storage denial before claim performs no authenticated request",async()=>{
  const f=fixture();f.journal.fail="journal-unavailable";
  const result=await f.run(f.create());assert.equal(result.confirmed,false);
  assert.equal(f.reads.length,0);assert.equal(f.writes.length,0);
});

test("a rejected send checkpoint performs no POST",async()=>{
  const f=fixture();const original=f.journal.compareAndSet;
  f.journal.compareAndSet=async(lane,revision,next)=>{if(next.phase==="sending")throw new ConnectorError("journal-storage-error");return original(lane,revision,next);};
  assert.equal((await f.run(f.create())).confirmed,false);assert.equal(f.writes.length,0);
});

test("failure to commit completion withholds provider confirmation and preserves sending",async()=>{
  const f=fixture();const original=f.journal.compareAndSet;
  f.journal.compareAndSet=async(lane,revision,next)=>{if(next.phase==="closed")throw new ConnectorError("journal-storage-error");return original(lane,revision,next);};
  const result=await f.run(f.create());assert.equal(result.status,"unknown");assert.equal(result.confirmed,false);assert.equal(result.evidence,null);
  assert.equal(result.accepted,true);assert.equal(result.changed,true);
  assert.equal((await f.create().getCheckpoint()).checkpoint.phase,"sending");assert.equal(f.writes.length,1);
});

test("consent expiring during checkpoint persistence prevents the POST",async()=>{
  const f=fixture();const original=f.journal.compareAndSet;
  f.journal.compareAndSet=async(lane,revision,next)=>{const result=await original(lane,revision,next);if(next.phase==="sending")f.now=61000;return result;};
  const result=await f.run(f.create());assert.equal(result.confirmed,false);assert.equal(f.writes.length,0);
});

test("cancel while waiting on a claim never enters the provider",async()=>{
  const f=fixture(),entered=wait(),release=wait();const original=f.journal.compareAndSet;
  f.journal.compareAndSet=async(...args)=>{entered.resolve();await release.promise;return original(...args);};
  const runner=f.create();const pending=f.run(runner);await entered.promise;assert.equal(runner.cancel(),true);
  release.resolve();assert.equal((await pending).confirmed,false);assert.equal(f.writes.length,0);assert.equal(f.reads.length,0);
});

test("429 cooldown survives a fresh runner and requires new consent after expiry",async()=>{
  let limited=true;const f=fixture({handle:r=>r.method==="POST"&&limited?reply(r,{},429,{"Retry-After":"2"}):undefined});
  assert.equal((await f.run(f.create())).status,"cooldown");assert.equal(f.writes.length,1);
  const reopened=f.create();assert.equal((await f.run(reopened)).status,"cooldown");assert.equal(f.writes.length,1);
  f.now=3001;limited=false;assert.equal((await f.run(f.create())).status,"confirmed");assert.equal(f.writes.length,2);
});

test("authentication refusal durably stops the lane without leaking provider messages",async()=>{
  const f=fixture({handle:r=>r.url.includes("verify_credentials")?reply(r,{error:"SECRET token should not be copied"},401):undefined});
  const result=await f.run(f.create());assert.equal(result.confirmed,false);
  const reopened=f.create();const reads=f.reads.length;assert.equal((await f.run(reopened)).reason,"session-stopped");
  assert.equal(f.reads.length,reads);assert.equal(f.writes.length,0);
  assert.ok(!JSON.stringify(await reopened.getCheckpoint()).includes("SECRET"));
});

test("Bluesky awaits each checkpoint and preserves partial effects if the second fails",async()=>{
  assert.equal(typeof durable.createDurableOrchestrator,"function");
  const actor="did:plc:aaaaaaaaaaaaaaaaaaaaaaaa",did="did:plc:bbbbbbbbbbbbbbbbbbbbbbbb",rkey="3lfilclair222";
  const records=new Map([rkey,"3lfilclair223"].map(key=>[key,{uri:`at://${actor}/app.bsky.graph.block/${key}`,cid:`cid-${key}`,value:{$type:"app.bsky.graph.block",subject:did,createdAt:"2026-10-29T00:00:00Z"}}]));
  const journal=memoryJournal();let checkpoints=0,writes=0;
  const original=journal.compareAndSet;
  journal.compareAndSet=async(lane,revision,next)=>{if(next.phase==="sending"&&++checkpoints===2)throw new ConnectorError("journal-storage-error");return original(lane,revision,next);};
  const connector=createBlueskyConnector({session:{type:"official-oauth",provider:"bluesky",accountId:actor,origin:"https://pds.example",scopes:["atproto","repo:app.bsky.graph.block?action=create&action=delete"]},allowedOrigins:["https://pds.example"],transport:async r=>{
    if(r.url.includes("getSession"))return reply(r,{did:actor});
    if(r.url.includes("listRecords"))return reply(r,{records:[...records.values()]});
    if(r.url.includes("deleteRecord")){writes++;assert.equal(r.body.swapRecord,`cid-${r.body.rkey}`);records.delete(r.body.rkey);return reply(r,{});}
    throw Error("Unexpected simulated Bluesky route");
  }});
  const runner=durable.createDurableOrchestrator({connector,journal,now:()=>1000});
  const target={did,rkey};const consent=runner.grantConsent({accountId:actor,target,action:"unblock",explicit:true});
  const result=await runner.execute({consent,target,action:"unblock"});
  assert.equal(result.status,"unknown");assert.equal(result.accepted,true);assert.equal(result.confirmed,false);
  assert.equal(writes,1);assert.equal(records.size,1);assert.equal((await runner.getCheckpoint()).checkpoint.phase,"quarantined");
});

test("recovery respects a durable pause after partial acceptance without any GET",async()=>{
  const f=partialFixture();f.handle=r=>r.method==="POST"&&f.writes===2?reply(r,{},429,{"Retry-After":"2"}):undefined;
  assert.equal((await f.run(f.create())).accepted,true);
  const reads=f.reads;const recovered=await f.create().recover();
  assert.equal(recovered.status,"cooldown");assert.equal(recovered.retryAt,3000);assert.equal(f.reads,reads);assert.equal(f.writes,2);
});

test("429 during recovery persists its pause for the next runner",async()=>{
  const f=fixture({timeoutMs:10,handle:r=>r.method==="POST"?new Promise(()=>{}):undefined});
  await f.run(f.create());
  f.handle=r=>r.url.includes("verify_credentials")?reply(r,{},429,{"Retry-After":"2"}):undefined;
  const first=await f.create().recover();assert.equal(first.status,"cooldown");assert.equal(first.retryAt,3000);
  const reads=f.reads.length;assert.equal((await f.create().recover()).status,"cooldown");assert.equal(f.reads.length,reads);
});

test("recovery authentication failures stop current and fresh runners without false storage reasons",async()=>{
  for(const error of [401,403,"identity"]){
    const f=fixture({timeoutMs:10,handle:r=>r.method==="POST"?new Promise(()=>{}):undefined});
    await f.run(f.create());
    f.handle=r=>r.url.includes("verify_credentials")?reply(r,{id:"8"},error==="identity"?200:error):undefined;
    const runner=f.create();const result=await runner.recover();assert.equal(result.reason,"session-stopped");
    const reads=f.reads.length;
    assert.equal((await runner.recover()).reason,"session-stopped");assert.equal((await f.create().recover()).reason,"session-stopped");
    assert.equal(f.reads.length,reads);assert.equal((await runner.getCheckpoint()).checkpoint.phase,"quarantined");
  }
});

test("persistent journal failure preserves a known partial deletion without confirmation",async()=>{
  const f=partialFixture(),original=f.journal.compareAndSet;let failed=false;
  f.journal.compareAndSet=async(...args)=>{if(args[2].phase==="sending"&&args[2].attempts===2)failed=true;if(failed)throw new ConnectorError("journal-storage-error");return original(...args);};
  const result=await f.run(f.create());assert.equal(result.status,"unknown");assert.equal(result.accepted,true);assert.equal(result.changed,true);
  assert.equal(result.confirmed,false);assert.equal(result.evidence,null);assert.equal(f.writes,1);assert.equal(f.records.size,1);
  assert.equal((await f.create().getCheckpoint()).checkpoint.phase,"sending");
});

test("consent expiry at the second Bluesky checkpoint preserves the first deletion only",async()=>{
  const f=partialFixture(),original=f.journal.compareAndSet;
  f.journal.compareAndSet=async(...args)=>{const saved=await original(...args);if(args[2].phase==="sending"&&args[2].attempts===2)f.now=61000;return saved;};
  const result=await f.run(f.create());assert.equal(result.status,"unknown");assert.equal(result.accepted,true);assert.equal(result.changed,true);
  assert.equal(result.confirmed,false);assert.equal(f.writes,1);assert.equal(f.records.size,1);
});
