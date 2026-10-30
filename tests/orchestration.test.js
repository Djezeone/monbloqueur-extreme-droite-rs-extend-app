import test from "node:test";
import assert from "node:assert/strict";

globalThis.fetch = () => { throw new Error("Live network is forbidden in orchestration tests"); };
const modules = await Promise.all(["mastodon", "bluesky", "orchestration"].map(name => import(`../pwa/connectors/${name}.js`).catch(error => {
  if (error.code === "ERR_MODULE_NOT_FOUND") return {};
  throw error;
})));
const [mastodon, bluesky, orchestration] = modules;
const origin = "https://social.example";
const actor = "did:plc:aaaaaaaaaaaaaaaaaaaaaaaa";
const did = "did:plc:bbbbbbbbbbbbbbbbbbbbbbbb";
const rkey = "3lfilclair222";
const target = { did, rkey };
const response = (request, body, status = 200, headers = {}) => ({ status, body, headers, url:request.url });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

function fixture(options = {}) {
  assert.equal(typeof mastodon.createMastodonConnector, "function", "Mastodon factory must exist");
  assert.equal(typeof orchestration.createOrchestrator, "function", "Orchestrator must exist");
  const f = { now:1_000, blocked:false, actor:"7", calls:[], writes:0, ...options };
  f.transport = async request => {
    f.calls.push(request);
    const url = new URL(request.url);
    if (f.handle) {
      const override = await f.handle(request, url, f);
      if (override !== undefined) return override;
    }
    if (url.pathname.endsWith("verify_credentials")) return response(request, { id:f.actor, username:"alice", acct:"alice", url:`${origin}/@alice` });
    if (url.pathname.endsWith("relationships")) return response(request, [{ id:"42", blocking:f.blocked, following:false, followed_by:false, blocked_by:false, muting:false, requested:false, domain_blocking:false, endorsed:false, showing_reblogs:false, notifying:false, muting_notifications:false }]);
    if (request.method === "POST") {
      f.writes++;
      f.blocked = url.pathname.endsWith("/block");
      return response(request, { id:"42", blocking:f.blocked });
    }
    throw Error("Unexpected simulated route");
  };
  f.connector = mastodon.createMastodonConnector({
    session:{ type:"official-oauth", provider:"mastodon", accountId:"7", origin, scopes:["profile", "write:blocks", "read:follows"] },
    transport:f.transport, allowedOrigins:[origin], timeoutMs:options.timeoutMs || 1000
  });
  f.runner = orchestration.createOrchestrator({ connector:f.connector, now:() => f.now });
  f.consent = (extra = {}) => f.runner.grantConsent({ accountId:"7", target:"42", action:"block", explicit:true, ...extra });
  f.run = (extra = {}) => f.runner.execute({ target:"42", action:"block", consent:f.consent(), ...extra });
  return f;
}
function blueskyFixture(initial = []) {
  assert.equal(typeof bluesky.createBlueskyConnector, "function", "Bluesky factory must exist");
  assert.equal(typeof orchestration.createOrchestrator, "function", "Orchestrator must exist");
  const f = { now:1000, records:new Map(initial.map(r => [r.uri.split("/").at(-1), structuredClone(r)])), calls:[], writes:0 };
  f.transport = async request => {
    f.calls.push(request);
    const url = new URL(request.url);
    if (f.handle) { const result = await f.handle(request, url, f); if (result !== undefined) return result; }
    if (url.pathname.endsWith("getSession")) return response(request, { did:actor, handle:"alice.example", active:true });
    if (url.pathname.endsWith("listRecords")) return response(request, { records:[...f.records.values()] });
    if (url.pathname.endsWith("createRecord")) {
      f.writes++;
      assert.equal(request.body.repo, actor);
      assert.equal(request.body.collection, "app.bsky.graph.block");
      const record = { uri:`at://${actor}/app.bsky.graph.block/${request.body.rkey}`, cid:`bafy-${request.body.rkey}`, value:request.body.record };
      f.records.set(request.body.rkey, record);
      return response(request, { uri:record.uri, cid:record.cid });
    }
    if (url.pathname.endsWith("deleteRecord")) {
      f.writes++;
      assert.equal(request.body.repo, actor);
      assert.equal(request.body.collection, "app.bsky.graph.block");
      assert.equal(request.body.swapRecord, f.records.get(request.body.rkey)?.cid);
      f.records.delete(request.body.rkey);
      return response(request, {});
    }
    throw Error("Unexpected simulated Bluesky route");
  };
  f.connector = bluesky.createBlueskyConnector({ session:{ type:"official-oauth", provider:"bluesky", accountId:actor, origin:"https://pds.example", scopes:["atproto", "repo:app.bsky.graph.block?action=create&action=delete"] }, transport:f.transport, allowedOrigins:["https://pds.example"] });
  f.runner = orchestration.createOrchestrator({ connector:f.connector, now:() => f.now });
  f.consent = (action = "block") => f.runner.grantConsent({ accountId:actor, target, action, explicit:true });
  f.run = (action = "block") => f.runner.execute({ target, action, consent:f.consent(action) });
  return f;
}
const bskyRecord = (key, subject = did) => ({ uri:`at://${actor}/app.bsky.graph.block/${key}`, cid:`bafy-${key}`, value:{ $type:"app.bsky.graph.block", subject, createdAt:"2026-10-28T10:00:00.000Z" } });

test("an older operation cannot reconcile or clear the current uncertainty lock", async () => {
  const f = fixture({timeoutMs:5});
  const first = await f.run();
  assert.equal(first.status,"confirmed");
  f.handle = request => {
    if (request.method === "POST") { f.writes++; return new Promise(() => {}); }
  };
  const unblock = () => f.run({action:"unblock",consent:f.consent({action:"unblock"})});
  const current = await unblock();
  assert.equal(current.status,"unknown");
  assert.equal((await f.runner.reconcile(first.operationId)).reason,"no-unresolved-operation");
  assert.equal((await unblock()).reason,"needs-reconciliation");
  assert.equal(f.writes,2);
  assert.equal(f.runner.getOperation(current.operationId).status,"unknown");
});

for (const status of [500, 502, 503, 408, 201, 302, 0, 700]) {
  test(`HTTP ${status} after mutation preserves uncertainty and forbids a replay`, async () => {
    const f = fixture({ handle:(request, url, fixture) => {
      if (request.method === "POST") {
        fixture.writes++;
        return response(request, {}, status);
      }
    } });
    const first = await f.run();
    assert.equal(first.status, "unknown");
    assert.equal(first.accepted, null);
    assert.equal(first.confirmed, false);
    assert.equal((await f.run()).reason,"needs-reconciliation");
    assert.equal(f.writes,1);
    const observed = await f.runner.reconcile(first.operationId);
    assert.equal(observed.status,"unknown");
    assert.equal(observed.observation.blocked,false);
    assert.equal((await f.run()).reason,"needs-reconciliation", "A differing read cannot prove an old server request finished");
    assert.equal(f.writes,1);
  });
}

test("no consent, forged/imported consent, mismatched account/target/action or expiry can write", async () => {
  const f = fixture();
  assert.throws(() => f.consent({ explicit:false }));
  assert.throws(() => f.consent({ accountId:"8" }));
  assert.throws(() => f.consent({ ttlMs:0 }));
  assert.throws(() => f.consent({ ttlMs:300_001 }));
  const ticket = f.consent({ ttlMs:10 });
  for (const consent of [undefined, {}, structuredClone(ticket)]) {
    assert.equal((await f.runner.execute({ consent, target:"42", action:"block", confirmed:true })).status, "rejected");
  }
  assert.equal((await f.runner.execute({ consent:f.consent(), target:"43", action:"block" })).status, "rejected");
  assert.equal((await f.runner.execute({ consent:f.consent(), target:"42", action:"unblock" })).status, "rejected");
  f.now = 1_010;
  assert.equal((await f.runner.execute({ consent:ticket, target:"42", action:"block" })).status, "rejected");
  assert.equal(f.calls.length, 0);
  assert.equal(f.writes, 0);
});

test("fresh independent readback follows accepted mutation and alone creates confirmation", async () => {
  const f = fixture();
  const result = await f.run();
  assert.equal(result.status, "confirmed");
  assert.equal(result.accepted, true);
  assert.equal(result.confirmed, true);
  assert.equal(result.evidence.blocked, true);
  assert.equal(result.evidence.accountId, "7");
  assert.equal(result.evidence.origin, origin);
  assert.equal(result.evidence.source, "provider-readback");
  assert.deepEqual(result.steps.map(step => step.status), ["declared", "accepted", "confirmed"]);
  const postIndex = f.calls.findIndex(call => call.method === "POST");
  assert.ok(postIndex > 0);
  assert.ok(f.calls.slice(0, postIndex).some(call => call.url.includes("relationships")));
  assert.ok(f.calls.slice(postIndex + 1).some(call => call.url.includes("relationships")));
  assert.equal(f.writes, 1);
});

test("a provider accepted response is not a confirmation when readback still differs", async () => {
  const f = fixture({ handle:(request, url, f) => {
    if (request.method === "POST") { f.writes++; return response(request, { id:"42", blocking:true }); }
  } });
  const result = await f.run();
  assert.equal(result.status, "accepted");
  assert.equal(result.accepted, true);
  assert.equal(result.confirmed, false);
  assert.equal(result.evidence, null);
  assert.equal(result.reason, "readback-differs");
});

test("already blocked state uses a fresh provider read and avoids duplicate mutation", async () => {
  const f = fixture({ blocked:true });
  const result = await f.run();
  assert.equal(result.status, "confirmed");
  assert.equal(result.accepted, false);
  assert.equal(result.changed, false);
  assert.equal(f.writes, 0);
  assert.equal(f.calls.length, 2);
});

test("consent is single use and a double click cannot start a second request", async () => {
  const waiting = deferred();
  const entered = deferred();
  const f = fixture({ handle:async (request, url) => {
    if (url.pathname.endsWith("relationships")) { entered.resolve(); await waiting.promise; }
  } });
  const consent = f.consent();
  const first = f.runner.execute({ consent, target:"42", action:"block" });
  await entered.promise;
  const duplicate = await f.runner.execute({ consent, target:"42", action:"block" });
  assert.equal(duplicate.status, "rejected");
  waiting.resolve();
  assert.equal((await first).status, "confirmed");
  assert.equal((await f.runner.execute({ consent, target:"42", action:"block" })).status, "rejected");
  assert.equal(f.writes, 1);
});

test("cancellation before start or while reading prevents every later write", async () => {
  const aborted = new AbortController();
  aborted.abort();
  const f = fixture();
  assert.equal((await f.run({ signal:aborted.signal })).status, "cancelled");
  assert.equal(f.calls.length, 0);
  const waiting = deferred();
  const entered = deferred();
  const g = fixture({ handle:async (request, url) => {
    if (url.pathname.endsWith("relationships")) { entered.resolve(); await waiting.promise; }
  } });
  const running = g.run();
  await entered.promise;
  assert.equal(g.runner.cancel(), true);
  assert.equal((await running).status, "cancelled");
  waiting.resolve();
  await Promise.resolve();
  assert.equal(g.writes, 0);
});

test("expired consent while pre-reading does not permit a write", async () => {
  const f = fixture({ handle:(request, url, f) => { if (url.pathname.endsWith("relationships")) f.now = 1_010; } });
  const consent = f.consent({ ttlMs:10 });
  const result = await f.runner.execute({ consent, target:"42", action:"block" });
  assert.equal(result.status, "rejected");
  assert.equal(result.reason, "consent-expired");
  assert.equal(f.writes, 0);
});

test("a different authenticated identity stops before state or mutation", async () => {
  const f = fixture({ actor:"8" });
  const result = await f.run();
  assert.equal(result.status, "rejected");
  assert.equal(result.reason, "identity-mismatch");
  assert.equal(f.calls.length, 1);
  assert.equal(f.writes, 0);
});

test("a session changed during pre-reading is checked again before mutation", async () => {
  const f = fixture({ handle:(request, url, f) => { if (url.pathname.endsWith("relationships")) f.actor = "8"; } });
  const result = await f.run();
  assert.equal(result.reason, "identity-mismatch");
  assert.equal(result.status, "rejected");
  assert.equal(f.writes, 0);
});

test("401 and 403 stop this runner and never trigger refresh or retry", async t => {
  for (const status of [401, 403]) await t.test(String(status), async () => {
    const f = fixture({ handle:request => response(request, { error:"secret must not enter public result" }, status) });
    const first = await f.run();
    assert.equal(first.status, "rejected");
    assert.equal(first.reason, status === 401 ? "unauthorized" : "forbidden");
    const calls = f.calls.length;
    assert.equal((await f.run()).reason, "session-stopped");
    assert.equal(f.calls.length, calls);
    assert.equal(JSON.stringify(first).includes("secret"), false);
  });
});

test("429 records Retry-After cooldown with no automatic retry, including HTTP date", async t => {
  for (const [header, until] of [["5", 6000], ["Thu, 01 Jan 1970 00:00:09 GMT", 9000], ["nonsense", 61_000]]) await t.test(header, async () => {
    const f = fixture({ handle:(request, url) => url.pathname.endsWith("relationships") ? response(request, {}, 429, { "Retry-After":header }) : undefined });
    const result = await f.run();
    assert.equal(result.status, "cooldown");
    assert.equal(result.retryAt, until);
    const calls = f.calls.length;
    assert.equal((await f.run()).status, "cooldown");
    assert.equal(f.calls.length, calls);
    assert.equal(f.writes, 0);
  });
});

test("a mutation 429 requires another explicit consent after cooldown, never a scheduled retry", async () => {
  const f = fixture({ handle:(request) => request.method === "POST" ? response(request, {}, 429, { "retry-after":"5" }) : undefined });
  const consent = f.consent();
  const result = await f.runner.execute({ consent, target:"42", action:"block" });
  assert.equal(result.status, "cooldown");
  assert.equal(result.accepted, false);
  const calls = f.calls.length;
  f.now = 6000;
  f.handle = undefined;
  assert.equal((await f.runner.execute({ consent, target:"42", action:"block" })).status, "rejected");
  assert.equal(f.calls.length, calls);
  assert.equal((await f.run()).status, "confirmed");
  assert.equal(f.writes, 1);
});

test("a lost mutation reply remains unknown and cannot be replayed with fresh consent", async () => {
  const f = fixture({ handle:(request, url, f) => {
    if (request.method === "POST") { f.writes++; f.blocked = true; throw new TypeError("network lost with sensitive provider content"); }
  } });
  const result = await f.run();
  assert.equal(result.status, "unknown");
  assert.equal(result.accepted, null);
  assert.equal(result.confirmed, false);
  assert.equal(result.evidence, null);
  assert.equal(JSON.stringify(result).includes("sensitive"), false);
  const calls = f.calls.length;
  assert.equal((await f.run()).reason, "needs-reconciliation");
  assert.equal(f.calls.length, calls);
  const reconciled = await f.runner.reconcile(result.operationId);
  assert.equal(reconciled.status, "confirmed");
  assert.equal(reconciled.evidence.blocked, true);
  assert.equal(f.writes, 1);
});

test("a different state cannot release uncertainty while an earlier mutation may still be in flight", async () => {
  const f = fixture({ handle:request => { if (request.method === "POST") throw Error("reply lost before any observable application"); } });
  const result = await f.run();
  const posts = () => f.calls.filter(request => request.method === "POST").length;
  assert.equal(posts(), 1);
  f.handle = undefined;
  const observed = await f.runner.reconcile(result.operationId);
  assert.equal(observed.status, "unknown");
  assert.equal(observed.confirmed, false);
  assert.equal(observed.reason, "reconciled-state-differs");
  assert.equal(observed.observation.blocked, false);
  assert.equal(posts(), 1);
  assert.equal((await f.run()).reason, "needs-reconciliation", "even fresh consent cannot prove the old request has finished");
  assert.equal(posts(), 1);
});

test("an actual request deadline returns unknown and does not retry an in-flight mutation", async () => {
  const f = fixture({ timeoutMs:10, handle:(request, url, f) => {
    if (request.method === "POST") { f.writes++; return new Promise(() => {}); }
  } });
  const result = await f.run();
  assert.equal(result.status, "unknown");
  assert.equal(result.reason, "timeout");
  assert.equal(f.writes, 1);
});

test("cancellation in flight cannot claim the remote mutation was cancelled", async () => {
  const entered = deferred();
  const f = fixture({ handle:(request, url, f) => {
    if (request.method === "POST") { f.writes++; entered.resolve(); return new Promise(() => {}); }
  } });
  const pending = f.run();
  await entered.promise;
  f.runner.cancel();
  const result = await pending;
  assert.equal(result.status, "unknown");
  assert.equal(result.reason, "cancelled-after-send");
  assert.equal(result.confirmed, false);
  assert.equal(f.writes, 1);
});

test("failed readback keeps accepted true but cannot create a provider confirmation", async () => {
  const f = fixture({ handle:(request, url, f) => {
    if (f.writes && url.pathname.endsWith("relationships")) throw Error("readback unavailable");
  } });
  const result = await f.run();
  assert.equal(result.status, "unknown");
  assert.equal(result.accepted, true);
  assert.equal(result.confirmed, false);
  assert.equal(result.evidence, null);
  assert.deepEqual(result.steps.map(step => step.status), ["declared", "accepted", "unknown"]);
});

test("a malformed successful mutation reply is unknown and never promoted by imported flags", async () => {
  const f = fixture({ handle:request => request.method === "POST" ? response(request, { id:"43", blocking:true, confirmed:true }) : undefined });
  const result = await f.run();
  assert.equal(result.status, "unknown");
  assert.equal(result.accepted, null);
  assert.equal(result.evidence, null);
  assert.equal((await f.run()).reason, "needs-reconciliation");
});

test("public snapshots cannot mutate runner evidence and imported evidence is ignored", async () => {
  const f = fixture();
  const result = await f.run({ providerEvidence:{ blocked:true }, confirmed:true });
  result.evidence.blocked = false;
  result.steps.length = 0;
  const snapshot = f.runner.getOperation(result.operationId);
  assert.equal(snapshot.evidence.blocked, true);
  assert.deepEqual(snapshot.steps.map(step => step.status), ["declared", "accepted", "confirmed"]);
  assert.equal(f.runner.getOperation("imported-operation"), null);
  assert.throws(() => orchestration.createOrchestrator({ connector:{ provider:"mastodon", accountId:"7", confirmed:true } }));
});

test("Bluesky sends a stable explicit rkey and verifies the new target record independently", async () => {
  const f = blueskyFixture();
  const result = await f.run();
  assert.equal(result.status, "confirmed");
  assert.equal(f.writes, 1);
  const mutation = f.calls.find(call => call.method === "POST");
  assert.equal(mutation.body.rkey, "3lfilclair222");
  assert.equal(mutation.body.record.subject, did);
  assert.equal(mutation.body.record.$type, "app.bsky.graph.block");
  assert.ok(f.calls.at(-1).url.includes("listRecords"));
  assert.equal(result.evidence.records[0].uri, `at://${actor}/app.bsky.graph.block/${rkey}`);
});

test("Bluesky pre-read finds an existing later-page block without creating a duplicate", async () => {
  const f = blueskyFixture([bskyRecord("3lfilclair223")]);
  f.handle = (request, url) => {
    if (url.pathname.endsWith("listRecords") && !url.searchParams.has("cursor")) return response(request, { records:[], cursor:"later" });
  };
  assert.equal((await f.run()).status, "confirmed");
  assert.equal(f.writes, 0);
});

test("Bluesky refuses an rkey collision with another DID before mutation", async () => {
  const f = blueskyFixture([bskyRecord(rkey, "did:plc:cccccccccccccccccccccccc")]);
  const result = await f.run();
  assert.equal(result.status, "rejected");
  assert.equal(result.reason, "record-key-conflict");
  assert.equal(f.writes, 0);
});

test("Bluesky unblocks every matching record with CID checks, preserving unrelated blocks", async () => {
  const unrelated = bskyRecord("3lfilclair224", "did:plc:cccccccccccccccccccccccc");
  const f = blueskyFixture([bskyRecord(rkey), bskyRecord("3lfilclair223"), unrelated]);
  const result = await f.run("unblock");
  assert.equal(result.status, "confirmed");
  assert.equal(result.evidence.blocked, false);
  assert.equal(f.writes, 2);
  assert.deepEqual([...f.records.keys()], ["3lfilclair224"]);
});

test("Bluesky cannot confirm unblock while a matching block remains on a later page", async () => {
  const f = blueskyFixture([bskyRecord(rkey)]);
  f.handle = (request, url, f) => {
    if (f.writes && url.pathname.endsWith("listRecords")) {
      return response(request, url.searchParams.has("cursor") ? { records:[bskyRecord("3lfilclair223")] } : { records:[], cursor:"remaining" });
    }
  };
  const result = await f.run("unblock");
  assert.equal(result.status, "accepted");
  assert.equal(result.confirmed, false);
});

test("cancelling a Bluesky multi-record unblock stops the next delete and preserves uncertainty", async () => {
  const f = blueskyFixture([bskyRecord(rkey), bskyRecord("3lfilclair223")]);
  f.handle = (request, url, f) => {
    if (url.pathname.endsWith("deleteRecord")) {
      f.writes++;
      f.records.delete(request.body.rkey);
      f.runner.cancel();
      return response(request, {});
    }
  };
  const result = await f.run("unblock");
  assert.equal(result.status, "unknown");
  assert.equal(result.confirmed, false);
  assert.equal(f.writes, 1);
  assert.equal(f.records.size, 1);
});

test("an explicit refusal after one accepted Bluesky deletion reports the partial change and stops", async () => {
  const f = blueskyFixture([bskyRecord(rkey), bskyRecord("3lfilclair223")]);
  f.handle = (request, url, f) => {
    if (url.pathname.endsWith("deleteRecord") && f.writes === 1) return response(request, {}, 403);
  };
  const result = await f.run("unblock");
  assert.equal(result.status, "unknown");
  assert.equal(result.reason, "forbidden");
  assert.equal(result.accepted, true);
  assert.equal(result.changed, true);
  assert.deepEqual(result.steps.map(step => step.status), ["declared", "accepted", "unknown"]);
  assert.equal(result.confirmed, false);
  assert.equal(f.records.size, 1);
  const calls = f.calls.length;
  assert.equal((await f.run("unblock")).reason, "session-stopped");
  assert.equal(f.calls.length, calls);
});

test("expiry between Bluesky deletions prevents the next write and preserves accepted partial progress", async () => {
  const f = blueskyFixture([bskyRecord(rkey), bskyRecord("3lfilclair223")]);
  f.handle = (request, url, f) => {
    if (url.pathname.endsWith("deleteRecord") && f.writes === 1) f.now = 61_000;
  };
  const originalTransport = f.transport;
  // Advance immediately after the first accepted reply, before a second request can start.
  const connector = bluesky.createBlueskyConnector({ session:{ type:"official-oauth", provider:"bluesky", accountId:actor, origin:"https://pds.example", scopes:["atproto", "repo:app.bsky.graph.block?action=create&action=delete"] }, allowedOrigins:["https://pds.example"], transport:async request => {
    const reply = await originalTransport(request);
    if (request.url.endsWith("deleteRecord")) f.now = 61_000;
    return reply;
  } });
  const runner = orchestration.createOrchestrator({ connector, now:() => f.now });
  const consent = runner.grantConsent({ accountId:actor, target, action:"unblock", explicit:true });
  const result = await runner.execute({ consent, target, action:"unblock" });
  assert.equal(result.status, "unknown");
  assert.equal(result.reason, "consent-expired");
  assert.equal(result.accepted, true);
  assert.equal(result.changed, true);
  assert.equal(f.writes, 1);
  assert.equal(f.records.size, 1);
});
