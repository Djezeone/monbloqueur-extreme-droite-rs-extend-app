import { test } from "node:test";
import assert from "node:assert/strict";
const guided = await import("../pwa/guided-core.js").catch(()=>({}));
import { newFlows, configureFlows, addFlow, setFlowStatus } from "../pwa/flow-core.js";

const input = {category:"sources",target:"CNEWS",platforms:["discover","youtube"],selections:[{platform:"discover",control:"hide-source"},{platform:"youtube",control:"dont-recommend-channel"}]};
let seq=0;
const ids=()=>"guided-"+(++seq);
test("guided options expose only documented category controls, including unavailable services",()=>{
  const options=guided.guidedOptions("sources",["discover","bluesky","local"]);
  assert.equal(options.length,3);
  assert.ok(options[0].controls.every(c=>c.category==="sources"));
  assert.equal(options[1].controls.length,0);
  assert.throws(()=>guided.guidedOptions("unknown",["local"]));
  assert.throws(()=>guided.guidedOptions("sources",["discover","discover"]));
});
test("guided batch registers intentions together, never a provider confirmation",()=>{
  const base=newFlows(), before=JSON.stringify(base);
  const result=guided.buildGuidedPlan(base,input,1000,ids);
  assert.equal(JSON.stringify(base),before);
  assert.equal(result.added,2); assert.equal(result.existing,0);
  assert.equal(result.flows.items.length,2);
  assert.ok(result.flows.items.every(i=>i.status==="planned"&&i.target==="CNEWS"));
  assert.equal(result.flows.setupComplete,true);
});
test("guided duplicate preserves existing declaration and history instead of resetting it",()=>{
  let base=configureFlows(newFlows(),["discover"],["sources"]);
  base=addFlow(base,{id:"old",platform:"discover",control:"hide-source",target:"cnews"},100);
  base=setFlowStatus(base,"old","declared",200);
  const old=structuredClone(base.items[0]);
  const result=guided.buildGuidedPlan(base,input,1000,ids);
  assert.equal(result.existing,1);assert.equal(result.added,1);
  assert.deepEqual(result.flows.items[0],old);
});
test("invalid or over-limit batch cannot partially modify the original snapshot",()=>{
  const base=configureFlows(newFlows(),["discover"],["sources"]);
  for(let i=0;i<499;i++) base.items.push({...addFlow(configureFlows(newFlows(),["discover"],["sources"]),{id:"old-"+i,platform:"discover",control:"hide-source",target:"source-"+i},100).items[0]});
  const raw=JSON.stringify(base);
  assert.throws(()=>guided.buildGuidedPlan(base,input,1000,ids),/500/);
  assert.equal(JSON.stringify(base),raw);
  for(const bad of [
    {...input,target:"x\nsecret"},{...input,category:"accounts"},
    {...input,selections:[{platform:"mastodon",control:"block"}]},
    {...input,selections:[{...input.selections[0],status:"confirmed"}]},
    {...input,selections:[input.selections[0],input.selections[0]]},
    {...input,selections:[]}
  ]) assert.throws(()=>guided.buildGuidedPlan(newFlows(),bad,1000,ids));
});
test("guided local route works with no external service and keeps previous selections",()=>{
  const base=configureFlows(newFlows(),["mastodon"],["accounts"]);
  const result=guided.buildGuidedPlan(base,{category:"sources",target:"Ma source",platforms:["local"],selections:[{platform:"local",control:"source-avoid"}]},1000,ids);
  assert.equal(result.flows.items[0].status,"local");
  assert.deepEqual(result.flows.platforms,["mastodon"]);
  assert.deepEqual(result.flows.categories,["accounts","sources"]);
});
