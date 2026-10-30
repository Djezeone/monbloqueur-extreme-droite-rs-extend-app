import { createServer, request as httpsRequest } from "node:https";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";

export const origin="https://social.example";
export const scopes=["profile","read:follows","write:blocks"];
export const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};

export async function createTlsLab() {
  const directory=await mkdtemp(join(tmpdir(),"fil-clair-tls-"));
  const key=join(directory,"key.pem"),cert=join(directory,"cert.pem");
  await promisify(execFile)("openssl",["req","-x509","-newkey","rsa:2048","-nodes","-keyout",key,"-out",cert,"-days","1","-subj","/CN=social.example","-addext","subjectAltName=DNS:social.example"]);
  const ca=await readFile(cert),secret=await readFile(key);
  const f={calls:[],dispatches:0,lookups:0,blocked:false,mode:"normal",sockets:new Set(),handle:null,answers:[{address:"93.184.216.34",family:4}]};
  const server=createServer({key:secret,cert:ca},async(req,res)=>{
    const body=[];for await(const chunk of req)body.push(chunk);
    const call={method:req.method,path:req.url,headers:req.headers,body:Buffer.concat(body).toString()};f.calls.push(call);
    if(f.handle && await f.handle(req,res,call,f)===true)return;
    if(req.method==="POST")f.blocked=req.url.endsWith("/block");
    const data=req.url.includes("verify_credentials")?{id:"7",username:"synthetic",source:{note:"private-test-field"}}:req.url.includes("relationships")?[{id:"42",blocking:f.blocked,following:false,muting:false}]:{id:"42",blocking:f.blocked,following:false};
    res.writeHead(200,{"Content-Type":"application/json; charset=utf-8","Set-Cookie":"must-not-leave-lab=1","X-RateLimit-Reset":"2026-10-30T12:00:00Z"});res.end(JSON.stringify(data));
  });
  server.on("connection",socket=>{f.sockets.add(socket);socket.on("close",()=>f.sockets.delete(socket));});
  await new Promise(done=>server.listen(0,"127.0.0.1",done));
  f.lookup=async(host,options)=>{f.lookups++;assert.equal(options.all,true);assert.equal(options.verbatim,true);return structuredClone(f.answers);};
  // Trusted test driver only: verify production DNS/TLS options, then route the
  // wire to the synthetic loopback fixture with its ephemeral certificate CA.
  f.request=(options,callback)=>{
    f.dispatches++;
    assert.equal(options.agent,false);assert.equal(options.rejectUnauthorized,true);assert.equal(options.autoSelectFamily,false);
    assert.equal(options.servername,options.hostname);assert.equal(options.checkServerIdentity,undefined);
    let pinned;
    options.lookup(options.hostname,{all:true},(error,value)=>{assert.ifError(error);pinned=value;});
    assert.deepEqual(pinned,[f.answers[0]]);assert.equal(options.family,f.answers[0].family);
    return httpsRequest({...options,family:4,port:server.address().port,ca,lookup:(host,opts,done)=>done(null,"127.0.0.1",4)},callback);
  };
  f.close=async()=>{for(const socket of f.sockets)socket.destroy();await new Promise(done=>server.close(done));await rm(directory,{recursive:true,force:true});};
  return f;
}

export function memoryJournal() {
  const rows=new Map();
  return {
    async read(lane){return structuredClone(rows.get(JSON.stringify(lane))??null);},
    async compareAndSet(lane,revision,next){const key=JSON.stringify(lane),old=rows.get(key);if((old?.revision??null)!==revision)return null;const value={...structuredClone(next),revision:(revision??0)+1};rows.set(key,value);return structuredClone(value);}
  };
}
