import { request as nativeRequest } from "node:https";
import { lookup as nativeLookup } from "node:dns/promises";
import { performance } from "node:perf_hooks";
import { ConnectorError, decimalId } from "../../pwa/connectors/internal.js";
import { normalizeOrigin, selectPublicAddress, normalizeMastodonRequest } from "./network-policy.js";

const requiredScopes=["profile","read:follows","write:blocks"];
const clockValue=now=>{const value=now();if(!Number.isSafeInteger(value)||value<0)throw new ConnectorError("server-invalid-clock");return value;};

// Server library only: no route, credential acquisition, refresh, or boot request.
// The trusted OAuth caller and injected network drivers are explicit boundaries.
export function createMastodonTransport(options={}) {
  let origin,accountId,secret,scopes,ttlMs,timeoutMs,maxBodyBytes,now,lookup,request,createdAt;
  try {
    if(!options||typeof options!=="object"||Array.isArray(options))throw Error();
    origin=normalizeOrigin(options.origin);accountId=decimalId(options.accountId);
    if(!Array.isArray(options.allowedOrigins)||options.allowedOrigins.length<1||options.allowedOrigins.length>32||!options.allowedOrigins.map(normalizeOrigin).includes(origin))throw Error();
    scopes=[...options.scopes];
    if(scopes.length!==3||new Set(scopes).size!==3||!requiredScopes.every(scope=>scopes.includes(scope)))throw Error();
    secret=options.accessToken;
    if(typeof secret!=="string"||secret.length<1||secret.length>4096||!/^[A-Za-z0-9._~+/-]+=*$/.test(secret))throw Error();
    ttlMs=options.ttlMs??900000;timeoutMs=options.timeoutMs??10000;maxBodyBytes=options.maxBodyBytes??65536;
    if(!Number.isInteger(ttlMs)||ttlMs<1||ttlMs>3600000||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000||!Number.isInteger(maxBodyBytes)||maxBodyBytes<128||maxBodyBytes>1048576)throw Error();
    now=options.now??Date.now;lookup=options.lookup??nativeLookup;request=options.request??nativeRequest;
    if(typeof now!=="function"||typeof lookup!=="function"||typeof request!=="function")throw Error();
    createdAt=clockValue(now);if(!Number.isSafeInteger(createdAt+ttlMs))throw Error();
  } catch {throw new ConnectorError("server-invalid-session");}
  const hostname=new URL(origin).hostname,localExpiresAt=createdAt+ttlMs;
  const session=Object.freeze({type:"official-oauth",provider:"mastodon",origin,accountId,scopes:Object.freeze(scopes)});
  let state="active",active=null;
  const reason=()=>state==="expired"?"session-expired":state==="disconnected"?"session-disconnected":state;
  function stop(next,except=null) {
    if(state==="active")state=next;
    secret=null;clearTimeout(expiryTimer);
    if(active&&active!==except)active.fail(reason());
  }
  function guard() {
    if(state==="active"&&clockValue(now)>=localExpiresAt)stop("expired");
    if(state!=="active")throw new ConnectorError(reason());
  }
  const expiryTimer=setTimeout(()=>stop("expired"),ttlMs);expiryTimer.unref?.();
  function rateHeaders(headers) {
    const result={};
    for(const key of ["retry-after","x-ratelimit-reset"]){const value=headers?.[key];if(typeof value==="string"&&value.length<=128&&/^[\x20-\x7e]+$/.test(value))result[key]=value;}
    return result;
  }
  function project(body,plan) {
    if(plan.targetId===null){
      if(!body||body.id!==accountId){stop("identity-mismatch",active);throw new ConnectorError("identity-mismatch");}
      return{id:accountId};
    }
    const value=plan.method==="GET"?(Array.isArray(body)&&body.length===1?body[0]:null):body;
    if(!value||value.id!==plan.targetId||typeof value.blocking!=="boolean"||(plan.action!==null&&value.blocking!==(plan.action==="block")))throw new ConnectorError("invalid-wire-response");
    return plan.method==="GET"?[{id:value.id,blocking:value.blocking}]:{id:value.id,blocking:value.blocking};
  }
  async function transport(input) {
    const plan=normalizeMastodonRequest(input,origin),signal=input.signal;
    guard();
    if(active)throw new ConnectorError("session-busy");
    if(signal?.aborted)throw new ConnectorError("cancelled",{sent:false,mutation:plan.method==="POST",uncertain:false});
    const deadline=performance.now()+timeoutMs;
    const checkDeadline=()=>{if(performance.now()>=deadline)throw new ConnectorError("timeout");};
    return new Promise((resolve,reject)=>{
      const context={sent:false,request:null,response:null,settled:false,fail:null};
      active=context;
      let timer;
      const finish=(error,value)=>{
        if(context.settled)return;context.settled=true;
        clearTimeout(timer);signal?.removeEventListener("abort",onAbort);
        if(active===context)active=null;
        if(error){context.response?.destroy();context.request?.destroy();reject(error);}else resolve(value);
      };
      context.fail=code=>finish(new ConnectorError(code,{sent:context.sent,mutation:plan.method==="POST",uncertain:context.sent&&plan.method==="POST"}));
      const onAbort=()=>context.fail("cancelled");
      signal?.addEventListener("abort",onAbort,{once:true});
      timer=setTimeout(()=>{if(clockValue(now)>=localExpiresAt)stop("expired");else context.fail("timeout");},Math.min(timeoutMs,Math.max(1,localExpiresAt-clockValue(now))));
      const receive=response=>{
        context.response=response;
        if(context.settled){response.destroy();return;}
        response.on("error",()=>context.fail("invalid-wire-response"));
        response.on("aborted",()=>context.fail("invalid-wire-response"));
        const status=response.statusCode,headers=rateHeaders(response.headers);
        if(!Number.isInteger(status)||status<100||status>599){context.fail("invalid-wire-response");return;}
        if(status===401||status===403)stop(status===401?"unauthorized":"forbidden",context);
        try{checkDeadline();if(state==="active")guard();}catch(error){context.fail(error instanceof ConnectorError?error.code:"wire-error");return;}
        if(status!==200){finish(null,{url:plan.url,status,headers,body:{}});response.destroy();return;}
        const type=response.headers["content-type"],encoding=response.headers["content-encoding"],length=response.headers["content-length"];
        if(typeof type!=="string"||!/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i.test(type)||(encoding!==undefined&&encoding!=="identity")||(length!==undefined&&(!/^\d+$/.test(length)||Number(length)>maxBodyBytes))){context.fail("invalid-wire-response");return;}
        const chunks=[];let bytes=0;
        response.on("data",chunk=>{
          if(context.settled)return;
          try{checkDeadline();}catch{context.fail("timeout");return;}
          bytes+=chunk.length;if(bytes>maxBodyBytes){context.fail("invalid-wire-response");return;}
          chunks.push(chunk);
        });
        response.on("end",()=>{
          if(context.settled)return;
          try{
            guard();checkDeadline();if(!response.complete)throw new ConnectorError("invalid-wire-response");
            const body=project(JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Buffer.concat(chunks))),plan);
            finish(null,{url:plan.url,status,headers,body});
          }catch(error){context.fail(error instanceof ConnectorError?error.code:"invalid-wire-response");}
        });
      };
      (async()=>{
        const addresses=await lookup(hostname,{all:true,verbatim:true});
        if(context.settled)return;
        guard();checkDeadline();const pinned=selectPublicAddress(addresses);
        const pinnedLookup=(host,options,callback)=>{
          if(host!==hostname){callback(new Error("bound-host-required"));return;}
          if(options?.all)callback(null,[{...pinned}]);else callback(null,pinned.address,pinned.family);
        };
        guard();if(context.settled||signal?.aborted){context.fail("cancelled");return;}
        const headers={Accept:"application/json",Authorization:"Bearer "+secret,Host:hostname,Connection:"close"};
        if(plan.method==="POST"){headers["Content-Type"]="application/json";headers["Content-Length"]="2";}
        // One ClientRequest, one end. No redirect/retry/refresh/fallback exists.
        checkDeadline();
        context.sent=true;
        context.request=request({protocol:"https:",hostname,servername:hostname,port:443,path:plan.path,method:plan.method,headers,agent:false,rejectUnauthorized:true,family:pinned.family,autoSelectFamily:false,lookup:pinnedLookup,maxHeaderSize:16384},receive);
        context.request.on("error",()=>context.fail("wire-error"));
        context.request.end(plan.method==="POST"?"{}":undefined);
      })().catch(error=>{if(!context.settled)context.fail(error instanceof ConnectorError?error.code:"wire-error");});
    });
  }
  return Object.freeze({session,transport,status(){if(state==="active"&&clockValue(now)>=localExpiresAt)stop("expired");return{state,localExpiresAt,active:active!==null};},disconnect(){stop("disconnected");return Object.freeze({localDisconnected:true,providerRevocation:"not-requested"});}});
}
