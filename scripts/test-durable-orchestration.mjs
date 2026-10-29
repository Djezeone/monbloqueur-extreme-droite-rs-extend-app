import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import { launchPwaBrowser } from "./pwa-test-utils.mjs";
import { serveConnectorLab } from "./connector-test-utils.mjs";

const server=await serveConnectorLab();let browser;
const results=[],outside=[];
async function pageIn(context){const p=await context.newPage();await p.goto(server.url);await p.waitForFunction(()=>typeof window.lab?.makeFixture==="function");return p;}
async function check(name,work){
  const context=await browser.newContext();
  await context.route("**/*",route=>{if(new URL(route.request().url()).origin===server.url)return route.continue();outside.push(route.request().url());return route.abort();});
  try{await work(context);results.push({name,result:"PASS"});}
  catch(e){results.push({name,result:"FAIL",error:e.stack});}
  finally{await context.close();}
}
try{
  const launched=await launchPwaBrowser();browser=launched.browser;
  await check("fresh confirmation requires commit; reload returns metadata without restored proof",async c=>{
    const p=await pageIn(c);
    const initial=await p.evaluate(async()=>{const f=window.lab.makeFixture();const r=await f.run(f.create());return {status:r.status,writes:f.writes.length,evidence:r.evidence.source};});
    assert.deepEqual(initial,{status:"confirmed",writes:1,evidence:"provider-readback"});
    await p.reload();await p.waitForFunction(()=>window.lab);
    const saved=await p.evaluate(()=>window.lab.makeFixture().create().getCheckpoint());
    assert.equal(saved.checkpoint.phase,"closed");assert.equal(saved.confirmed,false);assert.equal(saved.evidence,null);assert.equal(saved.checkpoint.attempts,1);
  });
  await check("two pages cannot claim the same account simultaneously",async c=>{
    const a=await pageIn(c),b=await pageIn(c);
    await a.evaluate(()=>{
      window.f=window.lab.makeFixture({handle:async r=>{if(r.url.includes("verify_credentials")){window.entered=true;await new Promise(resolve=>{window.release=resolve;});}}});
      window.pending=f.run(f.create());
    });
    await expect.poll(()=>a.evaluate(()=>window.entered===true)).toBe(true);
    const other=await b.evaluate(async()=>{const f=window.lab.makeFixture();const r=await f.run(f.create());return {reason:r.reason,writes:f.writes.length,reads:f.reads.length};});
    assert.equal(other.reason,"operation-active");assert.equal(other.writes,0);assert.equal(other.reads,0);
    const winner=await a.evaluate(async()=>{window.f.handle=null;window.release();const r=await pending;return {status:r.status,writes:f.writes.length};});
    assert.deepEqual(winner,{status:"confirmed",writes:1});
  });
  await check("recovering prepared in another page fences a suspended sender",async c=>{
    const a=await pageIn(c),b=await pageIn(c);
    await a.evaluate(()=>{let held=false;window.f=window.lab.makeFixture({handle:async r=>{if(!held&&r.url.includes("relationships")){held=true;window.entered=true;await new Promise(resolve=>{window.release=resolve;});}}});window.pending=f.run(f.create());});
    await expect.poll(()=>a.evaluate(()=>window.entered===true)).toBe(true);
    assert.equal((await b.evaluate(()=>window.lab.makeFixture().create().recover())).reason,"interrupted-before-send");
    const late=await a.evaluate(async()=>{release();const r=await pending;return {confirmed:r.confirmed,writes:f.writes.length};});
    assert.deepEqual(late,{confirmed:false,writes:0});
  });
  await check("matching cross-page readback preserves quarantine against a late POST and inverse consent",async c=>{
    const a=await pageIn(c),b=await pageIn(c);
    await a.evaluate(()=>{window.f=window.lab.makeFixture({handle:async(r,f)=>{if(r.method==="POST"){f.blocked=true;window.entered=true;await new Promise(resolve=>{window.release=resolve;});return {url:r.url,status:200,body:{id:"42",blocking:true}};}}});window.pending=f.run(f.create());});
    await expect.poll(()=>a.evaluate(()=>window.entered===true)).toBe(true);
    const recovered=await b.evaluate(async()=>{window.f=window.lab.makeFixture({blocked:true});window.runner=f.create();const observation=await runner.recover();const inverse=await f.run(runner,"unblock");return {observation,inverse,writes:f.writes.length};});
    assert.equal(recovered.observation.confirmed,false);assert.equal(recovered.observation.evidence,null);assert.equal(recovered.observation.observation.blocked,true);
    assert.equal(recovered.inverse.reason,"needs-reconciliation");assert.equal(recovered.writes,0);
    const late=await a.evaluate(async()=>{release();const r=await pending;return {confirmed:r.confirmed,writes:f.writes.length,phase:(await f.create().getCheckpoint()).checkpoint.phase};});
    assert.deepEqual(late,{confirmed:false,writes:1,phase:"quarantined"});
  });
  await check("timeout, reload and a new consent never replay an uncertain mutation",async c=>{
    const p=await pageIn(c);
    const first=await p.evaluate(async()=>{const f=window.lab.makeFixture({timeoutMs:10,handle:r=>r.method==="POST"?new Promise(()=>{}):undefined});const r=await f.run(f.create());return {status:r.status,writes:f.writes.length};});
    assert.deepEqual(first,{status:"unknown",writes:1});
    await p.reload();await p.waitForFunction(()=>window.lab);
    const after=await p.evaluate(async()=>{const f=window.lab.makeFixture({blocked:true}),r=f.create();const observed=await r.recover();const result=await f.run(r);return {observed,result,writes:f.writes.length,phase:(await r.getCheckpoint()).checkpoint.phase};});
    assert.equal(after.observed.confirmed,false);assert.equal(after.result.reason,"needs-reconciliation");assert.equal(after.writes,0);assert.equal(after.phase,"quarantined");
  });
  await check("an aborted sending transaction after put success prevents the POST",async c=>{
    const p=await pageIn(c);
    const result=await p.evaluate(async()=>{
      const original=IDBObjectStore.prototype.put;let aborted=false;
      IDBObjectStore.prototype.put=function(value,...args){const request=original.call(this,value,...args);if(JSON.stringify(value).includes('"phase":"sending"')){const tx=this.transaction;request.addEventListener("success",()=>{aborted=true;tx.abort();});}return request;};
      try{const f=window.lab.makeFixture();const r=await f.run(f.create());return {confirmed:r.confirmed,writes:f.writes.length,aborted};}finally{IDBObjectStore.prototype.put=original;}
    });
    assert.deepEqual(result,{confirmed:false,writes:0,aborted:true});
  });
  await check("consent serialized before reload has no execution authority",async c=>{
    const p=await pageIn(c);
    const ticket=await p.evaluate(()=>window.lab.makeFixture().create().grantConsent({accountId:"7",target:"42",action:"block",explicit:true}));
    await p.reload();await p.waitForFunction(()=>window.lab);
    const after=await p.evaluate(async consent=>{const f=window.lab.makeFixture();const result=await f.create().execute({consent,target:"42",action:"block"});return {reason:result.reason,writes:f.writes.length,reads:f.reads.length};},ticket);
    assert.deepEqual(after,{reason:"consent-invalid",writes:0,reads:0});
  });
  await check("429 pause survives reload; expiry grants no automatic write",async c=>{
    const p=await pageIn(c);
    assert.equal((await p.evaluate(async()=>{const f=window.lab.makeFixture({handle:(r,f,reply)=>r.method==="POST"?reply(r,{},429,{"Retry-After":"2"}):undefined});return f.run(f.create());})).status,"cooldown");
    await p.reload();await p.waitForFunction(()=>window.lab);
    const after=await p.evaluate(async()=>{const f=window.lab.makeFixture(),runner=f.create();const paused=await f.run(runner);f.now=3001;const checkpoint=await runner.getCheckpoint();return {paused,writes:f.writes.length,checkpoint};});
    assert.equal(after.paused.status,"cooldown");assert.equal(after.writes,0);assert.equal(after.checkpoint.checkpoint.retryAt,3000);
  });
  await check("401 stops future runners on the account without persisting provider text",async c=>{
    const p=await pageIn(c);
    await p.evaluate(async()=>{const f=window.lab.makeFixture({handle:(r,f,reply)=>r.url.includes("verify_credentials")?reply(r,{error:"sensitive-provider-message"},401):undefined});await f.run(f.create());});
    await p.reload();await p.waitForFunction(()=>window.lab);
    const after=await p.evaluate(async()=>{const f=window.lab.makeFixture(),r=f.create();const result=await f.run(r);return {result,reads:f.reads.length,writes:f.writes.length,checkpoint:await r.getCheckpoint()};});
    assert.equal(after.result.reason,"session-stopped");assert.equal(after.reads,0);assert.equal(after.writes,0);assert.ok(!JSON.stringify(after.checkpoint).includes("sensitive-provider-message"));
  });
  await check("second Bluesky sending checkpoint abort preserves the first accepted deletion",async c=>{
    const p=await pageIn(c);
    const result=await p.evaluate(async()=>{
      const original=IDBObjectStore.prototype.put;let sending=0;
      IDBObjectStore.prototype.put=function(value,...args){const request=original.call(this,value,...args);if(JSON.stringify(value).includes('"phase":"sending"')&&++sending===2){const tx=this.transaction;request.addEventListener("success",()=>tx.abort());}return request;};
      try{const f=window.lab.makeBlueskyFixture();const runner=f.create();const result=await f.run(runner);return {result,writes:f.writes,remaining:f.records.size,checkpoint:await runner.getCheckpoint()};}finally{IDBObjectStore.prototype.put=original;}
    });
    assert.equal(result.result.status,"unknown");assert.equal(result.result.accepted,true);assert.equal(result.result.confirmed,false);assert.equal(result.writes.length,1);assert.equal(result.remaining,1);
    assert.equal(result.writes[0].swapRecord,"cid-3lfilclair222");assert.equal(result.checkpoint.checkpoint.phase,"quarantined");
  });
  console.log(JSON.stringify({browser:launched.name,version:launched.version,results,outsideRequests:outside},null,2));
  assert.equal(outside.length,0,"No external network requests allowed");
  assert.equal(results.filter(x=>x.result==="FAIL").length,0,"Durable browser scenarios failed");
}finally{await browser?.close();await server.close();}
