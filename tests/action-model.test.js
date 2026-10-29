import test from "node:test";
import assert from "node:assert/strict";
import { newState, parseBackup, loadState } from "../pwa/core.js";
import * as core from "../pwa/flow-core.js";
const actions = await import("../pwa/actions.js").catch(() => ({}));
const now = 1793221200000;
function guided() {
  return core.addFlow(core.configureFlows(core.newFlows(), ["x"], ["accounts"]),
    { id:"a", platform:"x", control:"mute", target:"Cible synthétique" }, now);
}

test("modèle commun : nature/portée/méthode/date et déclaration sans preuve fournisseur", () => {
  assert.equal(typeof actions.actionRecord, "function");
  const item = core.setFlowStatus(guided(), "a", "declared", now + 1).items[0];
  const result = actions.actionRecord(item);
  assert.equal(result.service, "x"); assert.equal(result.nature, "mute");
  assert.equal(result.category, "accounts"); assert.equal(result.scope.kind, "account");
  assert.equal(result.method, "guided"); assert.equal(result.state, "declared");
  assert.equal(result.verification.kind, "self-declared"); assert.equal(result.verification.providerConfirmed, false);
  assert.equal(result.verification.at, now + 1); assert.equal(result.date, now + 1);
  assert.equal(result.revocation.requiresProvider, true);
  assert.ok(result.documentation.url.startsWith("https://help.x.com/"));
  assert.notEqual(result.documentation, result.verification);
  assert.throws(() => actions.actionRecord({ ...item, status:"confirmed" }));
});

test("note locale enregistrée et réglage Safari ne prétendent pas connaître un compte", () => {
  assert.equal(typeof actions.actionRecord, "function");
  const local = core.addFlow(core.newFlows(), { id:"b", platform:"local", control:"source-avoid", target:"Note" }, now);
  const record = actions.actionRecord(local.items[0]);
  assert.equal(record.scope.kind, "local"); assert.equal(record.verification.kind, "local-record");
  assert.equal(record.verification.providerConfirmed, false); assert.equal(record.revocation.requiresProvider, false);
  const safari = core.addFlow(core.configureFlows(core.newFlows(), ["safari"], ["recommendations"]),
    { id:"c", platform:"safari", control:"search-suggestions", target:"Safari" }, now);
  assert.equal(actions.actionRecord(safari.items[0]).scope.kind, "device");
});

test("échec/revue/annulation personnels et retour précédent sont immuables et datés", () => {
  const original = guided(), before = JSON.stringify(original);
  let flows = core.setFlowStatus(original, "a", "failed", now + 1);
  flows = core.setFlowStatus(flows, "a", "review", now + 2);
  flows = core.setFlowStatus(flows, "a", "cancelled", now + 3);
  assert.equal(typeof core.undoFlowStatus, "function");
  const undone = core.undoFlowStatus(flows, "a", now + 4);
  assert.equal(undone.items[0].status, "review");
  assert.deepEqual(undone.items[0].events.map(e=>e.status), ["planned","failed","review","cancelled","review"]);
  assert.equal(flows.items[0].status, "cancelled"); assert.equal(JSON.stringify(original), before);
  assert.equal(undone.items[0].updatedAt, now + 4);
  assert.throws(() => core.undoFlowStatus(original, "a", now - 1));
  assert.throws(() => core.undoFlowStatus(original, "absent", now + 5));
});

test("historique borné à32, sans copie de cible ni faux passé des anciennes fiches", () => {
  let flows = guided();
  for (let i=1;i<=50;i++) flows = core.setFlowStatus(flows,"a",i%2 ? "declared":"planned",now+i);
  assert.ok(Array.isArray(flows.items[0].events), "Historique absent");
  assert.equal(flows.items[0].events.length, 32);
  assert.deepEqual(Object.keys(flows.items[0].events[0]).sort(), ["at","status"]);
  assert.equal(flows.items[0].events.at(-1).at, now+50);
  assert.equal(flows.items[0].events.at(-1).status, flows.items[0].status);
  const legacy = guided(); delete legacy.items[0].events;
  assert.deepEqual(core.validateFlows(legacy), legacy);
  const changed = core.setFlowStatus(legacy,"a","review",now+1);
  assert.deepEqual(changed.items[0].events,[{status:"planned",at:now},{status:"review",at:now+1}]);
  assert.equal(Object.hasOwn(legacy.items[0],"events"),false);
});

test("sauvegardes V2/V3 restaurables ; historique falsifié conserve la source de récupération", () => {
  let flows=core.setFlowStatus(guided(),"a","declared",now+1);
  const state={...newState(),flows};
  assert.deepEqual(parseBackup(JSON.stringify(state)).flows,flows);
  const item=flows.items[0];
  const invalid=[[],[{status:"confirmed",at:now+1}],[{status:"declared",at:now+2}],
    [{status:"planned",at:now+1}],[{status:"declared",at:now-1}],
    [{status:"declared",at:now+1,token:"secret"}],Array(33).fill({status:"declared",at:now+1}),
    [{status:"declared",at:now+1},{status:"planned",at:now}],"bad",null];
  for (const events of invalid) {
    const raw=JSON.stringify({...state,flows:{...flows,items:[{...item,events}]}});
    assert.throws(()=>parseBackup(raw)); const result=loadState(raw);
    assert.equal(result.ok,false); assert.equal(result.raw,raw);
  }
});

test("métriques ne récompensent ni signalements ni pénalités de comptes", () => {
  assert.equal(typeof actions.flowMetrics,"function");
  let flows=guided();
  for (const [i,status] of ["planned","declared","failed","review","cancelled"].entries()) {
    let one=guided().items[0]; one={...one,id:"a"+i,target:"Cible "+i}; delete one.events;
    flows.items.push({...one,status});
  }
  const result=actions.flowMetrics(flows);
  assert.deepEqual(result,{total:6,local:0,planned:2,declared:1,failed:1,review:1,cancelled:1,providerConfirmed:0});
  assert.equal(Object.hasOwn(result,"stars"),false); assert.equal(Object.hasOwn(result,"penalized"),false);
});
