import test from "node:test";
import assert from "node:assert/strict";
import { inspect } from "node:util";
import { createMastodonConnector } from "../pwa/connectors/mastodon.js";
import { createDurableOrchestrator } from "../pwa/connectors/durable-orchestration.js";
import { createTlsLab, origin, scopes, deferred, memoryJournal } from "./fixtures/server-transport-helpers.js";

const module=await import("../server/connectors/mastodon-transport.js").catch(error=>{if(error.code==="ERR_MODULE_NOT_FOUND")return{};throw error;});
const token="synthetic-fc-token";
const identity={url:origin+"/api/v1/accounts/verify_credentials",method:"GET",redirect:"error",credentials:"omit"};
const mutation={url:origin+"/api/v1/accounts/42/block",method:"POST",body:{},redirect:"error",credentials:"omit"};
const readRelation={url:origin+"/api/v1/accounts/relationships?id%5B%5D=42&with_suspended=true",method:"GET",redirect:"error",credentials:"omit"};
function bound(f,extra={}) {
  assert.equal(typeof module.createMastodonTransport,"function","server transport factory must exist");
  return module.createMastodonTransport({origin,allowedOrigins:[origin],accountId:"7",accessToken:token,scopes,lookup:f.lookup,request:f.request,...extra});
}
async function lab(work){const f=await createTlsLab();try{await work(f);}finally{await f.close();}}

test("server session does no bootstrap call and never serializes its token",async()=>lab(async f=>{
  const b=bound(f);assert.equal(f.dispatches,0);assert.equal(f.lookups,0);assert.ok(!JSON.stringify(b).includes(token));assert.ok(!inspect(b).includes(token));
  assert.equal(b.status().state,"active");assert.deepEqual(b.session.scopes,scopes);assert.ok(Object.isFrozen(b.session.scopes));
  assert.equal(b.disconnect().providerRevocation,"not-requested");assert.equal(b.status().state,"disconnected");
}));

test("server factory refuses broad scopes, unapproved origins and unsafe token/config without network",async()=>lab(async f=>{
  assert.equal(typeof module.createMastodonTransport,"function");
  for(const extra of [{scopes:["read","write"]},{allowedOrigins:[]},{accountId:"07"},{accessToken:"bad\r\nheader"},{ttlMs:0},{ttlMs:3600001},{timeoutMs:30001},{maxBodyBytes:127},{maxBodyBytes:1048577}])assert.throws(()=>bound(f,extra));
  assert.equal(f.dispatches,0);assert.equal(f.lookups,0);
}));

test("TLS transport binds bearer/host and returns only matching identity and rate headers",async()=>lab(async f=>{
  const b=bound(f),result=await b.transport(identity);
  assert.equal(f.dispatches,1);assert.equal(f.calls.length,1);assert.equal(f.calls[0].headers.authorization,"Bearer "+token);
  assert.equal(f.calls[0].headers.host,"social.example");assert.deepEqual(result.body,{id:"7"});assert.equal(result.status,200);assert.equal(result.url,identity.url);
  assert.equal(result.headers["set-cookie"],undefined);assert.ok(!JSON.stringify(result).includes("private-test-field"));b.disconnect();
}));

test("Mastodon adapter and durable runner confirm only after TLS relationship readback",async()=>lab(async f=>{
  const b=bound(f),connector=createMastodonConnector({session:b.session,transport:b.transport,allowedOrigins:[origin]});
  const runner=createDurableOrchestrator({connector,journal:memoryJournal()});
  const consent=runner.grantConsent({accountId:"7",target:"42",action:"block",explicit:true});
  const result=await runner.execute({consent,target:"42",action:"block"});
  assert.equal(result.status,"confirmed");assert.equal(result.evidence.source,"provider-readback");
  assert.equal(f.calls.filter(c=>c.method==="POST").length,1);assert.ok(f.calls.at(-1).path.includes("relationships"));b.disconnect();
}));

test("421, redirect and503 produce one POST, no replay, no forwarded Location or body",async()=>lab(async f=>{
  for(const status of [421,302,503]){
    f.handle=async(req,res)=>{res.writeHead(status,{Location:"https://other.example/private","Content-Type":"text/html"});res.end("PRIVATE provider message");return true;};
    const b=bound(f),before=f.dispatches;const result=await b.transport(mutation);
    assert.equal(result.status,status);assert.deepEqual(result.body,{});assert.equal(result.headers.location,undefined);assert.equal(f.dispatches,before+1);assert.ok(!JSON.stringify(result).includes("PRIVATE"));b.disconnect();
  }
  assert.equal(f.calls.length,3);
}));

test("an applied POST followed by socket reset is unknown and cannot be replayed",async()=>lab(async f=>{
  f.handle=async(req,res)=>{if(req.method==="POST"){f.blocked=true;req.socket.destroy();return true;}};
  const b=bound(f),connector=createMastodonConnector({session:b.session,transport:b.transport,allowedOrigins:[origin]});
  const runner=createDurableOrchestrator({connector,journal:memoryJournal()});
  const run=()=>runner.execute({consent:runner.grantConsent({accountId:"7",target:"42",action:"block",explicit:true}),target:"42",action:"block"});
  const first=await run();assert.equal(first.status,"unknown");assert.equal(first.confirmed,false);assert.equal(first.evidence,null);assert.equal(f.blocked,true);
  assert.equal((await run()).reason,"needs-reconciliation");assert.equal(f.calls.filter(c=>c.method==="POST").length,1);b.disconnect();
}));

test("mixed private DNS results are refused before native request construction",async()=>lab(async f=>{
  const b=bound(f,{lookup:async()=>[{address:"93.184.216.34",family:4},{address:"127.0.0.1",family:4}]});
  await assert.rejects(b.transport(identity),e=>e.code==="server-invalid-addresses");assert.equal(f.dispatches,0);assert.equal(f.calls.length,0);b.disconnect();
}));

test("disconnect during DNS prevents a late authenticated request",async()=>lab(async f=>{
  const entered=deferred(),release=deferred();const b=bound(f,{lookup:async()=>{entered.resolve();return release.promise;}});
  const pending=b.transport(identity);await entered.promise;b.disconnect();release.resolve([{address:"93.184.216.34",family:4}]);
  await assert.rejects(pending,e=>e.code==="session-disconnected");assert.equal(f.dispatches,0);
  await assert.rejects(b.transport(identity));assert.equal(f.dispatches,0);
}));

test("abort during DNS settles without waiting for the resolver and prevents later dispatch",async()=>lab(async f=>{
  const entered=deferred(),release=deferred(),controller=new AbortController();
  const b=bound(f,{lookup:async()=>{entered.resolve();return release.promise;}}),pending=b.transport({...identity,signal:controller.signal});
  await entered.promise;controller.abort();await assert.rejects(pending,e=>e.code==="cancelled");
  release.resolve([{address:"93.184.216.34",family:4}]);await new Promise(resolve=>setImmediate(resolve));assert.equal(f.dispatches,0);b.disconnect();
}));

test("local expiry after DNS prevents dispatch and never claims provider revocation",async()=>lab(async f=>{
  let now=1000;const b=bound(f,{now:()=>now,ttlMs:10,lookup:async()=>{now=1010;return[{address:"93.184.216.34",family:4}];}});
  await assert.rejects(b.transport(identity),e=>e.code==="session-expired");assert.equal(f.dispatches,0);assert.equal(b.status().state,"expired");assert.equal(b.disconnect().providerRevocation,"not-requested");
}));

test("401 and403 stop as soon as headers arrive, even with an invalid unfinished body",async()=>lab(async f=>{
  for(const status of [401,403]){
    f.handle=async(req,res)=>{res.writeHead(status,{"Content-Type":"application/json"});res.flushHeaders();res.write('{"access_token":"PRIVATE');return true;};
    const b=bound(f),before=f.dispatches,result=await b.transport(identity);
    assert.equal(result.status,status);assert.deepEqual(result.body,{});assert.ok(!JSON.stringify(result).includes("PRIVATE"));assert.ok(["unauthorized","forbidden"].includes(b.status().state));
    await assert.rejects(b.transport(identity));assert.equal(f.dispatches,before+1);b.disconnect();
  }
}));

test("a200identity mismatch stops the captured session",async()=>lab(async f=>{
  f.handle=async(req,res)=>{res.writeHead(200,{"Content-Type":"application/json"});res.end('{"id":"8"}');return true;};
  const b=bound(f);await assert.rejects(b.transport(identity),e=>e.code==="identity-mismatch");assert.equal(b.status().state,"identity-mismatch");await assert.rejects(b.transport(identity));assert.equal(f.dispatches,1);b.disconnect();
}));

test("invalid UTF8, JSON, compression and oversized bodies fail without leaking response text",async()=>lab(async f=>{
  const bodies=[{headers:{"Content-Type":"application/json"},body:Buffer.from([0xff])},{headers:{"Content-Type":"application/json"},body:"PRIVATE not json"},{headers:{"Content-Type":"application/json","Content-Encoding":"gzip"},body:"compressed"},{headers:{"Content-Type":"text/html"},body:"PRIVATE html"},{headers:{"Content-Type":"application/json"},body:'{"id":"7","extra":"'+"a".repeat(2048)+'"}'}];
  for(const data of bodies){f.handle=async(req,res)=>{res.writeHead(200,data.headers);res.end(data.body);return true;};const b=bound(f,{maxBodyBytes:1024});await assert.rejects(b.transport(identity),e=>{assert.ok(!e.message.includes("PRIVATE"));return e.code==="invalid-wire-response";});b.disconnect();}
}));

test("wrong relationship/action binding after POST is uncertain rather than confirmed",async()=>lab(async f=>{
  f.handle=async(req,res)=>{res.writeHead(200,{"Content-Type":"application/json"});res.end('{"id":"43","blocking":true}');return true;};
  const b=bound(f);await assert.rejects(b.transport(mutation),e=>e.code==="invalid-wire-response"&&e.uncertain===true);assert.equal(f.dispatches,1);b.disconnect();
}));

test("deadline covers a stalled TLS response and destroys rather than retries the request",async()=>lab(async f=>{
  f.handle=async()=>true;const b=bound(f,{timeoutMs:100});
  await assert.rejects(b.transport(mutation),e=>e.code==="timeout"&&e.uncertain===true);assert.equal(f.dispatches,1);b.disconnect();
}));

test("disconnect interrupts an in-flight POST without claiming its remote cancellation",async()=>lab(async f=>{
  const entered=deferred();f.handle=async(req,res)=>{f.blocked=true;entered.resolve();return true;};const b=bound(f);
  const pending=b.transport(mutation);await entered.promise;b.disconnect();
  await assert.rejects(pending,e=>e.code==="session-disconnected"&&e.uncertain===true);assert.equal(f.calls.length,1);assert.equal(f.blocked,true);
}));

test("native TLS rejects an otherwise trusted certificate for a different hostname",async()=>lab(async f=>{
  const b=bound(f,{origin:"https://other.example",allowedOrigins:["https://other.example"]});
  await assert.rejects(b.transport({...identity,url:"https://other.example/api/v1/accounts/verify_credentials"}),e=>e.code==="wire-error");assert.equal(f.calls.length,0);assert.equal(f.dispatches,1);b.disconnect();
}));

test("one active request per handle prevents overlapping dispatches",async()=>lab(async f=>{
  const entered=deferred(),release=deferred();f.handle=async(req,res)=>{entered.resolve();await release.promise;return false;};const b=bound(f);
  const pending=b.transport(identity);await entered.promise;await assert.rejects(b.transport(readRelation),e=>e.code==="session-busy");release.resolve();await pending;assert.equal(f.dispatches,1);b.disconnect();
}));

test("a DNS deadline settles before any ClientRequest exists",async()=>lab(async f=>{
  const b=bound(f,{timeoutMs:40,lookup:()=>new Promise(()=>{})});
  await assert.rejects(b.transport(mutation),e=>e.code==="timeout"&&e.sent===false&&e.uncertain===false);assert.equal(f.dispatches,0);b.disconnect();
}));

test("the local lifetime expires and interrupts a stalled DNS lookup",async()=>lab(async f=>{
  const b=bound(f,{ttlMs:40,lookup:()=>new Promise(()=>{})});
  await assert.rejects(b.transport(identity),e=>e.code==="session-expired");assert.equal(f.dispatches,0);assert.equal(b.status().state,"expired");b.disconnect();
}));

test("public IPv6 is pinned while the test driver alone uses loopback IPv4",async()=>lab(async f=>{
  f.answers=[{address:"2606:4700:4700::1111",family:6}];
  const b=bound(f);assert.deepEqual((await b.transport(identity)).body,{id:"7"});assert.equal(f.dispatches,1);b.disconnect();
}));

test("truncated successful JSON cannot become a successful mutation",async()=>lab(async f=>{
  f.handle=async(req,res)=>{res.writeHead(200,{"Content-Type":"application/json","Content-Length":"100"});res.end('{"id":"42"}');return true;};
  const b=bound(f);await assert.rejects(b.transport(mutation),e=>e.code==="invalid-wire-response"&&e.uncertain===true);assert.equal(f.dispatches,1);b.disconnect();
}));

test("oversized response headers fail once without exposing their value",async()=>lab(async f=>{
  f.handle=async(req,res)=>{res.writeHead(200,{"Content-Type":"application/json","X-Oversized":"PRIVATE".repeat(4096)});res.end('{"id":"7"}');return true;};
  const b=bound(f);await assert.rejects(b.transport(identity),e=>e.code==="wire-error"&&!e.message.includes("PRIVATE"));assert.equal(f.dispatches,1);b.disconnect();
}));

test("mutating constructor inputs cannot switch the captured token account origin or permissions",async()=>lab(async f=>{
  const permissions=[...scopes],options={origin,allowedOrigins:[origin],accountId:"7",accessToken:token,scopes:permissions,lookup:f.lookup,request:f.request};
  const b=module.createMastodonTransport(options);options.origin="https://other.example";options.accountId="8";options.accessToken="new-synthetic-token";permissions[0]="admin:write";
  assert.deepEqual((await b.transport(identity)).body,{id:"7"});assert.equal(f.calls[0].headers.authorization,"Bearer "+token);assert.equal(b.session.accountId,"7");assert.deepEqual(b.session.scopes,scopes);b.disconnect();
}));

test("an elapsed deadline blocks a DNS continuation before queued timers run",async()=>{
  const release=deferred();let dispatches=0;
  const b=module.createMastodonTransport({origin,allowedOrigins:[origin],accountId:"7",accessToken:token,scopes,timeoutMs:10,lookup:()=>release.promise,request:()=>{dispatches++;throw Error("driver must not be invoked");}});
  const pending=b.transport(mutation);const until=performance.now()+40;while(performance.now()<until){}
  release.resolve([{address:"93.184.216.34",family:4}]);
  try{await assert.rejects(pending,e=>e.code==="timeout"&&e.sent===false&&e.uncertain===false);assert.equal(dispatches,0);}finally{b.disconnect();}
});

test("a completed response after the deadline cannot beat the queued timeout",async()=>{
  const {EventEmitter}=await import("node:events");let dispatches=0;
  const driver=(options,receive)=>{
    dispatches++;
    const response=new EventEmitter();Object.assign(response,{statusCode:200,headers:{"content-type":"application/json"},complete:true,destroy(){}});
    return{on(){return this;},destroy(){},end(){receive(response);response.emit("data",Buffer.from('{"id":"42","blocking":true}'));const until=performance.now()+40;while(performance.now()<until){}response.emit("end");}};
  };
  const b=module.createMastodonTransport({origin,allowedOrigins:[origin],accountId:"7",accessToken:token,scopes,timeoutMs:10,lookup:async()=>[{address:"93.184.216.34",family:4}],request:driver});
  try{await assert.rejects(b.transport(mutation),e=>e.code==="timeout"&&e.uncertain===true);assert.equal(dispatches,1);}finally{b.disconnect();}
});
