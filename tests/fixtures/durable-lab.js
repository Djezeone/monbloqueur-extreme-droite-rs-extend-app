import { createOperationJournal } from "../../pwa/connectors/operation-journal.js";
import { createDurableOrchestrator } from "../../pwa/connectors/durable-orchestration.js";
import { createMastodonConnector } from "../../pwa/connectors/mastodon.js";
import { createBlueskyConnector } from "../../pwa/connectors/bluesky.js";

globalThis.fetch = () => { throw Error("Live network forbidden in connector lab"); };
const response = (r,body,status=200,headers={}) => ({url:r.url,body,status,headers});
export function makeFixture(options={}) {
  const f={now:1000,accountId:"7",blocked:false,reads:[],writes:[],journal:createOperationJournal(),...options};
  const origin="https://social.example";
  f.transport=async r=>{
    if(r.method==="POST")f.writes.push({url:r.url,body:r.body});else f.reads.push(r.url);
    const custom=await f.handle?.(r,f,response);
    if(custom!==undefined)return custom;
    if(r.url.includes("verify_credentials"))return response(r,{id:f.accountId,username:"synthetic",acct:"synthetic",url:`${origin}/@synthetic`});
    if(r.url.includes("relationships"))return response(r,[{id:"42",blocking:f.blocked,following:false,followed_by:false,blocked_by:false,muting:false,requested:false,domain_blocking:false,endorsed:false,showing_reblogs:false,notifying:false,muting_notifications:false}]);
    if(r.method==="POST"){f.blocked=r.url.endsWith("/block");return response(r,{id:"42",blocking:f.blocked});}
    throw Error("Unqualified simulated route");
  };
  f.connector=createMastodonConnector({session:{type:"official-oauth",provider:"mastodon",accountId:f.accountId,origin,scopes:["profile","write:blocks","read:follows"]},transport:f.transport,allowedOrigins:[origin],timeoutMs:options.timeoutMs??1000});
  f.create=()=>createDurableOrchestrator({connector:f.connector,journal:f.journal,now:()=>f.now});
  f.run=(runner,action="block")=>runner.execute({consent:runner.grantConsent({accountId:f.accountId,target:"42",action,explicit:true}),target:"42",action});
  return f;
}
export function makeBlueskyFixture() {
  const actor="did:plc:aaaaaaaaaaaaaaaaaaaaaaaa",did="did:plc:bbbbbbbbbbbbbbbbbbbbbbbb",rkey="3lfilclair222";
  const records=new Map([rkey,"3lfilclair223"].map(key=>[key,{uri:`at://${actor}/app.bsky.graph.block/${key}`,cid:`cid-${key}`,value:{$type:"app.bsky.graph.block",subject:did,createdAt:"2026-10-29T00:00:00Z"}}]));
  const f={now:1000,writes:[],records,journal:createOperationJournal()};
  f.connector=createBlueskyConnector({session:{type:"official-oauth",provider:"bluesky",accountId:actor,origin:"https://pds.example",scopes:["atproto","repo:app.bsky.graph.block?action=create&action=delete"]},allowedOrigins:["https://pds.example"],transport:async r=>{
    const custom=await f.handle?.(r,f,response);if(custom!==undefined)return custom;
    if(r.url.includes("getSession"))return response(r,{did:actor});
    if(r.url.includes("listRecords"))return response(r,{records:[...records.values()]});
    if(r.url.includes("deleteRecord")){f.writes.push(r.body);records.delete(r.body.rkey);return response(r,{});}
    throw Error("Unqualified simulated route");
  }});
  f.target={did,rkey};f.create=()=>createDurableOrchestrator({connector:f.connector,journal:f.journal,now:()=>f.now});
  f.run=runner=>runner.execute({consent:runner.grantConsent({accountId:actor,target:f.target,action:"unblock",explicit:true}),target:f.target,action:"unblock"});
  return f;
}
window.lab={makeFixture,makeBlueskyFixture,createOperationJournal};
