import test from "node:test";
import assert from "node:assert/strict";
import * as core from "../pwa/core.js";

test("adding a missing profile never revives its imported orphan declaration", () => {
  assert.equal(typeof core.addAccount, "function");
  const input = core.newState();
  input.decisions["personal|x::qa_ghost"] = { status:"blocked", at:1000 };
  input.history.push({ key:"personal|x::qa_ghost", status:"blocked", at:1000 });
  const restored = core.parseBackup(JSON.stringify(input));
  const next = core.addAccount(restored, "personal", { network:"x", handle:"QA_GHOST" });
  assert.deepEqual(next.lists[0].accounts, [{ network:"x", handle:"QA_GHOST" }]);
  assert.equal(Object.hasOwn(next.decisions, "personal|x::qa_ghost"), false);
  assert.equal(next.history.length, 1, "Historical declarations remain history, not new active evidence");
  assert.deepEqual(core.progress(next, next.lists[0]), { total:1, blocked:0, muted:0, skipped:0, remaining:1 });
  assert.equal(restored.lists[0].accounts.length, 0, "The input snapshot is immutable");
  assert.equal(restored.decisions["personal|x::qa_ghost"].status, "blocked");
});

test("adding a profile clears only its own list, service and Mastodon instance declaration", () => {
  assert.equal(typeof core.addAccount, "function");
  const input = core.newState();
  input.lists[0].revision = "historical-v1";
  input.decisions = {
    "personal|mastodon:social.example:qa_ghost": { status:"muted", at:1000 },
    "personal|mastodon:other.example:qa_ghost": { status:"blocked", at:1000 },
    "other|mastodon:social.example:qa_ghost": { status:"blocked", at:1000 },
    "personal|x::qa_ghost": { status:"skipped", at:1000 }
  };
  input.flows = { syntheticMarker:true };
  const next = core.addAccount(input, "personal", { network:"mastodon", handle:"Qa_Ghost", instance:"SOCIAL.EXAMPLE" });
  assert.equal(Object.hasOwn(next.decisions, "personal|mastodon:social.example:qa_ghost"), false);
  for (const key of ["personal|mastodon:other.example:qa_ghost", "other|mastodon:social.example:qa_ghost", "personal|x::qa_ghost"])
    assert.deepEqual(next.decisions[key], input.decisions[key]);
  assert.equal(next.lists[0].revision, "historical-v1");
  assert.equal(next.flows, input.flows);
  assert.equal(next.activeList, "personal");
});

test("adding an existing normalized profile preserves its declaration and snapshot", () => {
  assert.equal(typeof core.addAccount, "function");
  let input = core.newState();
  input.lists[0].accounts.push({ network:"x", handle:"qa_existing" });
  input = core.markDecision(input, "personal", input.lists[0].accounts[0], "muted", 1000);
  assert.equal(core.addAccount(input, "personal", { network:"x", handle:"QA_EXISTING" }), input);
  assert.equal(input.decisions["personal|x::qa_existing"].status, "muted");
});

test("invalid or over-capacity additions fail without changing data", () => {
  assert.equal(typeof core.addAccount, "function");
  const input = core.newState();
  input.lists[0].accounts = Array.from({ length:5000 }, (_, i) => ({ network:"x", handle:"qa_" + i }));
  const before = JSON.stringify(input);
  assert.throws(() => core.addAccount(input, "absent", { network:"x", handle:"qa_new" }));
  assert.throws(() => core.addAccount(input, "personal", { network:"x", handle:"bad/path" }));
  assert.throws(() => core.addAccount(input, "personal", { network:"x", handle:"qa_new" }));
  assert.equal(core.addAccount(input, "personal", { network:"x", handle:"QA_0" }), input, "An existing profile is harmless even at capacity");
  assert.equal(JSON.stringify(input), before);
});
