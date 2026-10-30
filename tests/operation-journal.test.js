import test from "node:test";
import assert from "node:assert/strict";
import { ConnectorError } from "../pwa/connectors/internal.js";

const module = await import("../pwa/connectors/operation-journal.js").catch(error => {
  if (error.code === "ERR_MODULE_NOT_FOUND") return {};
  throw error;
});
function create(options) {
  assert.equal(typeof module.createOperationJournal, "function", "The durable operation journal factory must exist");
  return module.createOperationJournal(options);
}
const lane = { provider:"mastodon", accountId:"7", origin:"https://social.example" };
const actor = "did:plc:aaaaaaaaaaaaaaaaaaaaaaaa";
const did = "did:plc:bbbbbbbbbbbbbbbbbbbbbbbb";
const blueskyLane = { provider:"bluesky", accountId:actor, origin:"https://pds.example" };
const checkpoint = (extra = {}) => ({
  version:1, operationId:"11111111-1111-4111-8111-111111111111", target:"42", targetKey:"42",
  action:"block", phase:"prepared", attempts:0, createdAt:1000, updatedAt:1000,
  retryAt:0, reason:null, observation:null, ...extra
});
function safeError(code) {
  return error => error instanceof ConnectorError && error.code === code && error.message === code &&
    !JSON.stringify(error).includes("PRIVATE-DETAIL");
}
function storageTrap() {
  let calls = 0;
  return { indexedDB:{ open() { calls++; throw Error("PRIVATE-DETAIL"); } }, calls:() => calls };
}

test("the journal exposes only read and compareAndSet", () => {
  const journal = create({ indexedDB:null });
  assert.deepEqual(Object.keys(journal).sort(), ["compareAndSet", "read"]);
  assert.ok(Object.isFrozen(journal));
});

test("unavailable and denied IndexedDB fail with bounded ConnectorError codes", async () => {
  const missing = create({ indexedDB:null });
  await assert.rejects(missing.read(lane), safeError("journal-unavailable"));
  await assert.rejects(missing.compareAndSet(lane, null, checkpoint()), safeError("journal-unavailable"));
  const trap = storageTrap();
  const denied = create(trap);
  await assert.rejects(denied.read(lane), safeError("journal-storage-error"));
  await assert.rejects(denied.compareAndSet(lane, null, checkpoint()), safeError("journal-storage-error"));
  assert.equal(trap.calls(), 2);
});

test("a pending IndexedDB open times out safely", async () => {
  const journal = create({ indexedDB:{ open:() => ({}) }, timeoutMs:5 });
  await assert.rejects(journal.read(lane), safeError("journal-timeout"));
});

test("timeout configuration is an integer between 1 and 10000ms", () => {
  for (const timeoutMs of [0, -1, 10001, 1.5, NaN, Infinity, "5000", null]) {
    assert.throws(() => create({ indexedDB:null, timeoutMs }), safeError("journal-invalid-timeout"));
  }
  for (const timeoutMs of [1, 5000, 10000]) assert.equal(typeof create({ indexedDB:null, timeoutMs }).read, "function");
});

test("lane validation precedes storage access and binds the provider account format", async () => {
  const trap = storageTrap();
  const journal = create(trap);
  const invalid = [null, [], {}, { ...lane, provider:"x" }, { ...lane, accountId:7 },
    { ...lane, accountId:"007" }, { ...lane, accountId:"0" }, { ...lane, accountId:actor },
    { ...blueskyLane, accountId:"7" }, { ...lane, secret:"PRIVATE-DETAIL" },
    Object.assign(Object.create({ inherited:true }), lane)];
  for (const value of invalid) {
    await assert.rejects(journal.read(value), safeError("journal-invalid-lane"));
    await assert.rejects(journal.compareAndSet(value, null, checkpoint()), safeError("journal-invalid-lane"));
  }
  assert.equal(trap.calls(), 0);
});

test("lane origins reject credentials, paths, queries, ports and private literal hosts", async () => {
  const trap = storageTrap();
  const journal = create(trap);
  for (const origin of ["http://social.example", "https://u:p@social.example", "https://social.example/path",
    "https://social.example/?x=1", "https://social.example/#x", "https://social.example:8443", "https://localhost",
    "https://127.0.0.1", "https://[::1]", "https://host.local", "https://host.internal", "https://bad_host.example", null]) {
    await assert.rejects(journal.read({ ...lane, origin }), safeError("journal-invalid-lane"));
  }
  assert.equal(trap.calls(), 0);
});

test("CAS rejects invalid or caller-assigned revisions before storage access", async () => {
  const trap = storageTrap();
  const journal = create(trap);
  for (const revision of [undefined, 0, -1, 1.5, NaN, Infinity, "1", Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(journal.compareAndSet(lane, revision, checkpoint()), safeError("journal-invalid-revision"));
  }
  await assert.rejects(journal.compareAndSet(lane, null, checkpoint({ revision:1 })), safeError("journal-invalid-checkpoint"));
  assert.equal(trap.calls(), 0);
});

test("checkpoint shape is exact and rejects imported proof, consent and secrets", async () => {
  const trap = storageTrap();
  const journal = create(trap);
  const missing = checkpoint();
  delete missing.reason;
  const accessor = checkpoint();
  Object.defineProperty(accessor, "target", { enumerable:true, get() { throw Error("PRIVATE-DETAIL"); } });
  const hidden = checkpoint();
  Object.defineProperty(hidden, "secret", { value:"PRIVATE-DETAIL" });
  const symbol = checkpoint();
  symbol[Symbol("secret")] = "PRIVATE-DETAIL";
  for (const value of [null, [], {}, missing, accessor, hidden, symbol,
    ...["status", "confirmed", "evidence", "secret", "token", "ticket", "consent"].map(key => checkpoint({ [key]:"PRIVATE-DETAIL" }))]) {
    await assert.rejects(journal.compareAndSet(lane, null, value), safeError("journal-invalid-checkpoint"));
  }
  assert.equal(trap.calls(), 0);
});

test("checkpoint scalar fields and bounded reasons are validated before storage", async () => {
  const trap = storageTrap();
  const journal = create(trap);
  const invalid = [
    { version:2 }, { operationId:"not-a-uuid" }, { operationId:"11111111-1111-0111-0111-111111111111" },
    { target:"042", targetKey:"042" }, { target:"42", targetKey:"43" }, { target:42 }, { action:"mute" },
    { phase:"confirmed" }, { attempts:-1 }, { attempts:101 }, { attempts:0.5 },
    { phase:"prepared", attempts:1 }, { phase:"sending", attempts:0 }, { phase:"quarantined", attempts:0 },
    { createdAt:-1 }, { updatedAt:999 }, { updatedAt:Infinity }, { retryAt:-1 },
    { createdAt:Number.MAX_SAFE_INTEGER + 1, updatedAt:Number.MAX_SAFE_INTEGER + 1 },
    { retryAt:0.5 }, { reason:"PRIVATE-DETAIL" }, { reason:0 }
  ];
  for (const extra of invalid) await assert.rejects(journal.compareAndSet(lane, null, checkpoint(extra)), safeError("journal-invalid-checkpoint"));
  assert.equal(trap.calls(), 0);
});

test("observations allow only a boolean and a nonnegative safe timestamp", async () => {
  const trap = storageTrap();
  const journal = create(trap);
  for (const observation of [true, [], {}, { blocked:true }, { blocked:1, observedAt:1000 },
    { blocked:true, observedAt:-1 }, { blocked:true, observedAt:1.5 }, { blocked:true, observedAt:Infinity },
    { blocked:true, observedAt:1000, confirmed:true }]) {
    await assert.rejects(journal.compareAndSet(lane, null, checkpoint({ observation })), safeError("journal-invalid-checkpoint"));
  }
  assert.equal(trap.calls(), 0);
});

test("Bluesky targets are exact normalized DID and record-key pairs", async () => {
  const trap = storageTrap();
  const journal = create(trap);
  for (const target of [did, {}, { did, rkey:"invalid" }, { did:"not-did", rkey:"3lfilclair222" },
    { did, rkey:"3lfilclair222", token:"PRIVATE-DETAIL" }]) {
    await assert.rejects(journal.compareAndSet(blueskyLane, null, checkpoint({ target, targetKey:did })), safeError("journal-invalid-checkpoint"));
  }
  await assert.rejects(journal.compareAndSet(blueskyLane, null, checkpoint({ target:{ did, rkey:"3lfilclair222" }, targetKey:actor })), safeError("journal-invalid-checkpoint"));
  assert.equal(trap.calls(), 0);
});

test("every bounded checkpoint reason and valid phase passes validation", async () => {
  const trap = storageTrap();
  const journal = create(trap);
  const reasons = [null, "completed", "no-write", "provider-refusal", "rate-limited", "session-stopped", "interrupted-before-send",
    "interrupted-after-send", "uncertain", "storage-error", "observed-match", "observed-differs", "read-failed", "stopped"];
  for (const reason of reasons) {
    await assert.rejects(journal.compareAndSet(lane, null, checkpoint({ phase:"closed", attempts:100, reason,
      observation:{ blocked:false, observedAt:0 } })), safeError("journal-storage-error"));
  }
  for (const phase of ["prepared", "sending", "quarantined", "closed"]) {
    await assert.rejects(journal.compareAndSet(lane, 1, checkpoint({ phase, attempts:phase === "prepared" ? 0 : 1 })), safeError("journal-storage-error"));
  }
  await assert.rejects(journal.compareAndSet(blueskyLane, null, checkpoint({
    target:{ did, rkey:"3lfilclair222" }, targetKey:did
  })), safeError("journal-storage-error"));
  assert.equal(trap.calls(), reasons.length + 5);
});
