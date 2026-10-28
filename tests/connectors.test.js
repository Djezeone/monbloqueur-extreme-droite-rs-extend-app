import test from "node:test";
import assert from "node:assert/strict";

// Only the authenticated transport boundary is simulated. Any accidental fetch fails.
globalThis.fetch = () => { throw new Error("Live network is forbidden in connector tests"); };
const mastodon = await import("../pwa/connectors/mastodon.js").catch(error => {
  if (error.code === "ERR_MODULE_NOT_FOUND") return {};
  throw error;
});
const bluesky = await import("../pwa/connectors/bluesky.js").catch(error => {
  if (error.code === "ERR_MODULE_NOT_FOUND") return {};
  throw error;
});
const origin = "https://social.example";
const pds = "https://pds.example";
const actor = "did:plc:aaaaaaaaaaaaaaaaaaaaaaaa";
const target = "did:plc:bbbbbbbbbbbbbbbbbbbbbbbb";
const other = "did:plc:cccccccccccccccccccccccc";
const rkey = "3lfilclair222";
const blockScope = "repo:app.bsky.graph.block?action=create&action=delete";
const mastodonSession = () => ({ type:"official-oauth", provider:"mastodon", accountId:"7", origin, scopes:["profile", "write:blocks", "read:follows"] });
const blueskySession = () => ({ type:"official-oauth", provider:"bluesky", accountId:actor, origin:pds, scopes:["atproto", blockScope] });
const response = (request, body, status = 200, headers = {}) => ({ status, headers, body, url:request.url });
const record = (key, subject = target) => ({ uri:`at://${actor}/app.bsky.graph.block/${key}`, cid:`bafy-${key}`, value:{ $type:"app.bsky.graph.block", subject, createdAt:"2026-10-28T10:00:00.000Z" } });

function makeMastodon(options = {}) {
  assert.equal(typeof mastodon.createMastodonConnector, "function", "Mastodon factory must exist");
  return mastodon.createMastodonConnector({ session:mastodonSession(), transport:async request => {
    if (new URL(request.url).pathname.endsWith("verify_credentials")) return response(request, { id:"7", username:"alice", acct:"alice", url:`${origin}/@alice` });
    return response(request, [{ id:"42", following:false, followed_by:false, blocking:true, blocked_by:false, muting:false, muting_notifications:false, requested:false, domain_blocking:false, endorsed:false, showing_reblogs:false, notifying:false }]);
  }, allowedOrigins:[origin], ...options });
}
function makeBluesky(options = {}) {
  assert.equal(typeof bluesky.createBlueskyConnector, "function", "Bluesky factory must exist");
  return bluesky.createBlueskyConnector({ session:blueskySession(), transport:async request => {
    if (new URL(request.url).pathname.endsWith("getSession")) return response(request, { did:actor, handle:"alice.example", active:true });
    return response(request, { records:[] });
  }, allowedOrigins:[pds], ...options });
}

test("factories require an explicit official session and transport, with no boot request", () => {
  let calls = 0;
  const transport = async () => { calls++; throw Error("must remain inactive"); };
  const a = makeMastodon({ transport });
  const b = makeBluesky({ transport });
  assert.equal(calls, 0);
  assert.equal(Object.isFrozen(a), true);
  assert.equal(Object.isFrozen(b), true);
  assert.equal(a.write, undefined, "raw mutation must not be public");
  assert.equal(b.write, undefined);
  for (const make of [makeMastodon, makeBluesky]) {
    assert.throws(() => make({ session:undefined }));
    assert.throws(() => make({ transport:undefined }));
  }
  assert.throws(() => makeMastodon({ session:{ ...mastodonSession(), type:"imported" } }));
});

test("Mastodon refuses non-approved origins, IPs, credentials, paths and broad scopes", () => {
  makeMastodon();
  for (const bad of ["http://social.example", "https://evil.example", "https://user:secret@social.example", "https://social.example/api", "https://social.example?token=x", "https://social.example#x", "https://127.0.0.1", "https://[::1]", "https://localhost", "https://social.example:444"]) {
    assert.throws(() => makeMastodon({ session:{ ...mastodonSession(), origin:bad }, allowedOrigins:[origin] }));
  }
  assert.throws(() => makeMastodon({ allowedOrigins:[] }));
  assert.throws(() => makeMastodon({ session:{ ...mastodonSession(), scopes:["read", "write"] } }));
  assert.throws(() => makeMastodon({ session:{ ...mastodonSession(), accountId:"7/../../oauth" } }));
});

test("Mastodon validates decimal target IDs before any authenticated call", async () => {
  let calls = 0;
  const connector = makeMastodon({ transport:async () => { calls++; } });
  for (const id of [42, "", "0", "42/../7", "42?x=1", "4e2", "-42", " 42", "42\n"]) {
    await assert.rejects(connector.inspect(id));
  }
  assert.equal(calls, 0);
});

test("Mastodon reads identity then exactly one matching relationship on its fixed origin", async () => {
  const seen = [];
  const connector = makeMastodon({ transport:async request => {
    seen.push(request);
    if (seen.length === 1) return response(request, { id:"7", username:"alice", acct:"alice", url:`${origin}/@alice` });
    return response(request, [{ id:"42", blocking:true }]);
  } });
  const result = await connector.inspect("42");
  assert.equal(result.blocked, true);
  assert.equal(result.target, "42");
  assert.deepEqual(seen.map(request => [request.method, request.url]), [
    ["GET", "https://social.example/api/v1/accounts/verify_credentials"],
    ["GET", "https://social.example/api/v1/accounts/relationships?id%5B%5D=42&with_suspended=true"]
  ]);
  assert.ok(seen.every(request => request.redirect === "error"));
  assert.equal("session" in result, false);
  assert.equal("transport" in connector, false);
});

test("Mastodon never trusts a wrong account, redirected reply, missing or ambiguous relationship", async t => {
  const cases = [
    { name:"identity", identity:{ id:"8" }, body:[{ id:"42", blocking:true }] },
    { name:"redirect", body:[{ id:"42", blocking:true }], redirected:true },
    { name:"missing", body:[] },
    { name:"wrong ID", body:[{ id:"43", blocking:true }] },
    { name:"string boolean", body:[{ id:"42", blocking:"true" }] },
    { name:"duplicates", body:[{ id:"42", blocking:true }, { id:"42", blocking:true }] }
  ];
  for (const c of cases) await t.test(c.name, async () => {
    let calls = 0;
    const connector = makeMastodon({ transport:async request => {
      calls++;
      const res = response(request, calls === 1 ? (c.identity || { id:"7" }) : c.body);
      if (c.redirected && calls > 1) res.url = "https://evil.example/api";
      return res;
    } });
    await assert.rejects(connector.inspect("42"));
    if (c.name === "identity") assert.equal(calls, 1);
  });
});

test("Bluesky requires a pinned allowed HTTPS PDS, DID and narrowly granted write scopes", () => {
  makeBluesky();
  for (const session of [
    { ...blueskySession(), provider:"mastodon" },
    { ...blueskySession(), accountId:"alice.example" },
    { ...blueskySession(), accountId:"did:plc:bad" },
    { ...blueskySession(), origin:"https://evil.example" },
    { ...blueskySession(), scopes:["atproto", "transition:generic"] },
    { ...blueskySession(), scopes:["atproto"] }
  ]) assert.throws(() => makeBluesky({ session }));
});

test("Bluesky scans all pages on its actor repo before reporting a target absent", async () => {
  const seen = [];
  const connector = makeBluesky({ transport:async request => {
    seen.push(request);
    const url = new URL(request.url);
    if (url.pathname.endsWith("getSession")) return response(request, { did:actor, handle:"alice.example" });
    assert.equal(url.searchParams.get("repo"), actor);
    assert.equal(url.searchParams.get("collection"), "app.bsky.graph.block");
    assert.equal(url.searchParams.get("limit"), "100");
    return response(request, url.searchParams.has("cursor") ? { records:[record(rkey)] } : { records:[record("3lfilclair223", other)], cursor:"next-page" });
  } });
  const result = await connector.inspect({ did:target, rkey });
  assert.equal(result.blocked, true);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].uri, `at://${actor}/app.bsky.graph.block/${rkey}`);
  assert.equal(seen.length, 3);
  assert.equal(new URL(seen[2].url).searchParams.get("cursor"), "next-page");
});

test("Bluesky refuses incomplete, looping or malformed block collection reads", async t => {
  const cases = [
    { name:"looping cursor", body:{ records:[], cursor:"again" } },
    { name:"missing array", body:{ cursor:"next" } },
    { name:"wrong repo", body:{ records:[{ ...record(rkey), uri:`at://${other}/app.bsky.graph.block/${rkey}` }] } },
    { name:"wrong collection", body:{ records:[{ ...record(rkey), uri:`at://${actor}/app.bsky.feed.post/${rkey}` }] } },
    { name:"wrong record type", body:{ records:[{ ...record(rkey), value:{ $type:"app.bsky.feed.post", subject:target } }] } },
    { name:"missing CID", body:{ records:[{ ...record(rkey), cid:null }] } },
    { name:"invalid subject", body:{ records:[record(rkey, "not-a-DID")] } }
  ];
  for (const c of cases) await t.test(c.name, async () => {
    let calls = 0;
    const connector = makeBluesky({ transport:async request => {
      calls++;
      return response(request, calls === 1 ? { did:actor, handle:"alice.example" } : c.body);
    } });
    await assert.rejects(connector.inspect({ did:target, rkey }));
    assert.ok(calls <= 3);
  });
  let calls = 0;
  const connector = makeBluesky({ maxPages:2, transport:async request => {
    calls++;
    return response(request, calls === 1 ? { did:actor, handle:"alice.example" } : { records:[], cursor:`page-${calls}` });
  } });
  await assert.rejects(connector.inspect({ did:target, rkey }));
  assert.equal(calls, 3, "page budget cannot be interpreted as absence");
});

test("Bluesky target DID and stable record keys are validated before transport", async () => {
  let calls = 0;
  const connector = makeBluesky({ transport:async () => { calls++; } });
  for (const input of [target, { did:"alice.example", rkey }, { did:target, rkey:"../../oauth" }, { did:target, rkey:"" }]) {
    await assert.rejects(connector.inspect(input));
  }
  assert.equal(calls, 0);
});

test("a mutable caller session cannot change the captured provider identity or scopes", async () => {
  const session = mastodonSession();
  const connector = makeMastodon({ session });
  session.accountId = "8";
  session.origin = "https://evil.example";
  session.scopes.length = 0;
  const state = await connector.inspect("42");
  assert.equal(connector.accountId, "7");
  assert.equal(connector.origin, origin);
  assert.equal(state.blocked, true);
});
