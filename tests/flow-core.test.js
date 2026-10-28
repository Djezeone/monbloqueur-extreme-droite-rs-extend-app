import test from "node:test";
import assert from "node:assert/strict";
import { newState, parseBackup, loadState, markDecision } from "../pwa/core.js";

const model = await import("../pwa/flow-core.js").catch(() => ({}));
const catalogue = await import("../pwa/platforms.js").catch(() => ({}));
const now = 1793150000000;
const example = { id:"flow-a", platform:"local", control:"source-avoid", target:"Journal personnel" };
function empty() { assert.equal(typeof model.newFlows, "function"); return model.newFlows(); }
function guided() {
  let flows = model.configureFlows(empty(), ["youtube"], ["accounts", "sources", "topics", "recommendations"]);
  return model.addFlow(flows, { id:"flow-b", platform:"youtube", control:"not-interested", target:"Une vidéo" }, now);
}

test("catalogue universel avec quatre catégories et services entièrement facultatifs", () => {
  assert.ok(catalogue.PLATFORMS, "Catalogue non implémenté");
  assert.deepEqual(Object.keys(catalogue.CATEGORIES), ["accounts", "sources", "topics", "recommendations"]);
  for (const id of ["local", "discover", "google-search", "youtube", "x", "facebook", "instagram", "threads", "tiktok", "bluesky", "mastodon", "reddit", "linkedin", "safari"])
    assert.ok(Object.hasOwn(catalogue.PLATFORMS, id), id);
  for (const [id, platform] of Object.entries(catalogue.PLATFORMS)) {
    assert.ok(platform.description.length > 10);
    assert.ok(Object.isFrozen(platform));
    assert.ok(platform.controls.length);
    const controls = new Set();
    for (const control of platform.controls) {
      assert.ok(!controls.has(control.id)); controls.add(control.id);
      assert.ok(Object.hasOwn(catalogue.CATEGORIES, control.category));
      assert.ok(["local", "guide"].includes(control.mode));
      assert.ok(control.scope.length > 20);
      assert.equal(catalogue.getControl(id, control.id), control);
      assert.ok(Object.isFrozen(control));
      if (control.mode === "guide") {
        const url = new URL(control.url);
        assert.equal(url.protocol, "https:");
        assert.equal(url.username + url.password, "");
        assert.ok(control.steps.length >= 2);
        assert.ok(control.limits.length);
      }
    }
  }
  assert.equal(catalogue.getControl("__proto__", "constructor"), null);
  assert.equal(catalogue.getControl("youtube", "block"), null, "Ne pas promettre un blocage des vidéos YouTube");
});

test("sans Google ni réseau, le carnet local est utilisable et immuable", () => {
  const flows = empty();
  const before = JSON.stringify(flows);
  const configured = model.configureFlows(flows, [], ["sources", "topics"]);
  const next = model.addFlow(configured, example, now);
  assert.equal(JSON.stringify(flows), before);
  assert.equal(next.setupComplete, true);
  assert.deepEqual(next.platforms, []);
  assert.equal(next.items[0].status, "local");
  assert.equal(next.items[0].target, example.target);
  assert.equal(next.items[0].createdAt, now);
});

test("modifier ses services et catégories ne supprime ni ne confirme de fiche existante", () => {
  let flows = guided();
  const before = JSON.stringify(flows);
  const next = model.configureFlows(flows, [], ["sources"]);
  assert.deepEqual(next.items, flows.items);
  assert.equal(JSON.stringify(flows), before);
  assert.throws(() => model.addFlow(next, { ...example, platform:"youtube", control:"not-interested" }, now));
  assert.throws(() => model.configureFlows(flows, ["unknown"], ["sources"]));
  assert.throws(() => model.configureFlows(flows, [], []));
  assert.throws(() => model.configureFlows(flows, ["youtube", "youtube"], ["sources"]));
});

test("déclaré, à faire et note locale gardent des portées distinctes sans statut API", () => {
  const flows = guided();
  assert.equal(flows.items[0].status, "planned");
  const declared = model.setFlowStatus(flows, "flow-b", "declared", now + 1);
  assert.equal(declared.items[0].status, "declared");
  assert.equal(flows.items[0].status, "planned");
  const reset = model.setFlowStatus(declared, "flow-b", "planned", now + 2);
  assert.equal(reset.items[0].status, "planned");
  for (const status of ["confirmed", "provider-confirmed", "accepted", "local", "blocked"])
    assert.throws(() => model.setFlowStatus(flows, "flow-b", status, now + 1));
  const local = model.addFlow(empty(), example, now);
  assert.throws(() => model.setFlowStatus(local, "flow-a", "declared", now + 1));
  assert.throws(() => model.setFlowStatus(flows, "missing", "declared", now + 1));
  assert.equal(model.removeFlow(declared, "flow-b").items.length, 0);
  assert.equal(declared.items.length, 1);
});

test("la sauvegarde complète préserve les flux et les anciennes listes sans conversion de preuve", () => {
  let state = newState();
  const account = { network:"x", handle:"alice" };
  state.lists[0].accounts.push(account);
  state = markDecision(state, "personal", account, "muted", now);
  state.flows = model.addFlow(empty(), example, now);
  const restored = parseBackup(JSON.stringify(state));
  assert.deepEqual(restored.flows, state.flows);
  assert.deepEqual(restored.lists, state.lists);
  assert.deepEqual(restored.history, state.history);
  const legacy = { ...state }; delete legacy.flows;
  assert.equal(Object.hasOwn(parseBackup(JSON.stringify(legacy)), "flows"), false);
  assert.equal(loadState(JSON.stringify(state)).ok, true);
});

test("flux corrompus, secrets et fausses confirmations rendent le snapshot récupérable sans écrasement", () => {
  const valid = model.addFlow(empty(), example, now);
  const invalid = [
    null, [], { ...valid, version:2 }, { ...valid, setupComplete:"yes" },
    { ...valid, token:"secret" }, { ...valid, platforms:["__proto__"] },
    { ...valid, categories:["unknown"] },
    { ...valid, items:[{ ...valid.items[0], status:"confirmed" }] },
    { ...valid, items:[{ ...valid.items[0], accessToken:"secret" }] },
    { ...valid, items:[{ ...valid.items[0], id:"bad|id" }] },
    { ...valid, items:[{ ...valid.items[0], control:"constructor" }] },
    { ...valid, items:[{ ...valid.items[0], updatedAt:now - 1 }] },
    { ...valid, items:[{ ...valid.items[0], target:"x".repeat(201) }] },
    { ...valid, items:[valid.items[0], valid.items[0]] }
  ];
  for (const flows of invalid) {
    const raw = JSON.stringify({ ...newState(), flows });
    assert.throws(() => parseBackup(raw));
    const recovery = loadState(raw);
    assert.equal(recovery.ok, false);
    assert.equal(recovery.raw, raw);
  }
});

test("bornes, doublons et cibles dangereuses refusés sans mutation", () => {
  let flows = model.addFlow(empty(), example, now);
  const before = JSON.stringify(flows);
  for (const target of ["", " ", "a\nsecret", "\u0000", "x".repeat(201), 42])
    assert.throws(() => model.addFlow(flows, { ...example, id:"flow-c", target }, now));
  assert.throws(() => model.addFlow(flows, { ...example, id:"flow-c", target:" journal PERSONNEL " }, now));
  assert.throws(() => model.addFlow(flows, { ...example, target:"Autre" }, now));
  for (const date of [0, -1, 1.5, Infinity, 8_640_000_000_000_001])
    assert.throws(() => model.addFlow(flows, { ...example, id:"flow-c", target:"Autre" }, date));
  assert.equal(JSON.stringify(flows), before);
  flows = { ...flows, items:Array.from({ length:500 }, (_, i) => ({ ...flows.items[0], id:"flow-" + i, target:"Source " + i })) };
  assert.equal(model.validateFlows(flows).items.length, 500);
  assert.throws(() => model.addFlow(flows, { ...example, id:"overflow", target:"Trop" }, now));
  assert.throws(() => model.validateFlows({ ...flows, items:[...flows.items, { ...flows.items[0], id:"overflow", target:"Trop" }] }));
});

test("bloquer, feedback et réglages ne sont jamais des actions interchangeables", () => {
  assert.ok(catalogue.PLATFORMS);
  const block = catalogue.getControl("bluesky", "block");
  const feedback = catalogue.getControl("youtube", "not-interested");
  const settings = catalogue.getControl("safari", "search-suggestions");
  assert.equal(block.category, "accounts");
  assert.equal(feedback.category, "topics");
  assert.equal(settings.category, "recommendations");
  assert.match(block.scope, /public/i);
  assert.match(feedback.scope, /recommand|signal/i);
  assert.match(settings.scope, /suggestion|recherche/i);
  assert.notEqual(block.scope, feedback.scope);
});
