import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launchPwaBrowser } from "./pwa-test-utils.mjs";

// An isolated loopback fixture. The PWA server, shell and service worker are never used.
const paths = new Map(["internal.js", "operation-journal.js"].map(name => ["/connectors/" + name, resolve("pwa/connectors", name)]));
const requests = [];
const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  requests.push(path);
  if (path === "/") { res.writeHead(200, { "Content-Type":"text/html", "Cache-Control":"no-store" }); res.end("<!doctype html><meta charset=utf-8><title>Journal test</title>"); return; }
  if (!paths.has(path)) { res.writeHead(404); res.end(); return; }
  try { res.writeHead(200, { "Content-Type":"text/javascript", "Cache-Control":"no-store" }); res.end(await readFile(paths.get(path))); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((done, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", done); });
const origin = "http://127.0.0.1:" + server.address().port;
const results = [];
let browser;
async function check(name, work) {
  if (process.env.OPERATION_JOURNAL_CASE && !name.includes(process.env.OPERATION_JOURNAL_CASE)) return;
  const context = await browser.newContext({ serviceWorkers:"block" });
  const external = [];
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    external.push(route.request().url());
    return route.abort("blockedbyclient");
  });
  try { await work(context); assert.deepEqual(external, [], "No external request is permitted"); results.push({ name, result:"PASS" }); }
  catch (error) { results.push({ name, result:"FAIL", error:error.stack }); }
  finally { await context.close(); }
}
async function pageFor(context) {
  const page = await context.newPage();
  await page.goto(origin);
  await page.evaluate(async () => {
    const { createOperationJournal } = await import("/connectors/operation-journal.js");
    if (typeof createOperationJournal !== "function") throw Error("The operation journal factory must exist");
    window.qaJournal = {
      create:createOperationJournal,
      lane:{ provider:"mastodon", accountId:"7", origin:"https://social.example" },
      next:(extra = {}) => ({ version:1, operationId:"11111111-1111-4111-8111-111111111111", target:"42", targetKey:"42",
        action:"block", phase:"prepared", attempts:0, createdAt:1000, updatedAt:1000, retryAt:0, reason:null, observation:null, ...extra }),
      journal:createOperationJournal(),
      raw:work => new Promise((resolve, reject) => {
        const req = indexedDB.open("fil-clair-operations-v1", 1);
        req.onerror = () => reject(Error("Fixture database unavailable"));
        req.onsuccess = () => {
          const db = req.result, tx = db.transaction("lanes", "readwrite", { durability:"strict" });
          let value;
          tx.oncomplete = () => { db.close(); resolve(value); };
          tx.onabort = () => { db.close(); reject(Error("Fixture transaction aborted")); };
          work(tx.objectStore("lanes"), result => { value = result; });
        };
      })
    };
  });
  return page;
}

try {
  const launched = await launchPwaBrowser();
  browser = launched.browser;
  console.log(JSON.stringify({ engine:launched.name, version:launched.version, physicalDevice:false, network:"loopback modules only" }));

  await check("CAS assigns revisions, captures input and survives reload without proof fields", async context => {
    const page = await pageFor(context);
    const result = await page.evaluate(async () => {
      const q = qaJournal;
      const empty = await q.journal.read(q.lane);
      const next = q.next();
      const writing = q.journal.compareAndSet({ ...q.lane, origin:q.lane.origin + "/" }, null, next);
      next.target = "99";
      const saved = await writing;
      saved.target = "88";
      const read = await q.journal.read(q.lane);
      const stale = await q.journal.compareAndSet(q.lane, null, q.next());
      const updated = await q.journal.compareAndSet(q.lane, 1, q.next({ phase:"sending", attempts:1, updatedAt:1001 }));
      const { revision, ...withoutRevision } = read;
      return { empty, read, stale, updated, keys:Object.keys(withoutRevision).sort() };
    });
    assert.equal(result.empty, null);
    assert.equal(result.read.target, "42");
    assert.equal(result.read.revision, 1);
    assert.equal(result.stale, null);
    assert.equal(result.updated.revision, 2);
    assert.deepEqual(result.keys, ["action", "attempts", "createdAt", "observation", "operationId", "phase", "reason", "retryAt", "target", "targetKey", "updatedAt", "version"]);
    await page.reload();
    const restored = await page.evaluate(async lane => (await import("/connectors/operation-journal.js")).createOperationJournal().read(lane), { provider:"mastodon", accountId:"7", origin:"https://social.example" });
    assert.equal(restored.phase, "sending");
    assert.equal(restored.revision, 2);
    assert.equal("confirmed" in restored, false);
  });

  await check("two pages race atomically for one lane and one revision", async context => {
    const [a, b] = await Promise.all([pageFor(context), pageFor(context)]);
    const start = page => page.evaluate(() => qaJournal.journal.compareAndSet(qaJournal.lane, null, qaJournal.next()));
    const first = await Promise.all([start(a), start(b)]);
    assert.equal(first.filter(Boolean).length, 1);
    assert.equal(first.filter(value => value === null).length, 1);
    const update = (page, action) => page.evaluate(action => qaJournal.journal.compareAndSet(qaJournal.lane, 1,
      qaJournal.next({ action, phase:"sending", attempts:1, updatedAt:1001 })), action);
    const second = await Promise.all([update(a, "block"), update(b, "unblock")]);
    assert.equal(second.filter(Boolean).length, 1);
    assert.equal(second.filter(value => value === null).length, 1);
    assert.equal(second.find(Boolean).revision, 2);
    assert.deepEqual(await a.evaluate(() => qaJournal.journal.read(qaJournal.lane)), await b.evaluate(() => qaJournal.journal.read(qaJournal.lane)));
  });

  await check("CAS waits for strict transaction complete and closes every connection", async context => {
    const page = await pageFor(context);
    const result = await page.evaluate(async () => {
      const q = qaJournal, events = [];
      const transaction = IDBDatabase.prototype.transaction, close = IDBDatabase.prototype.close, put = IDBObjectStore.prototype.put;
      let closes = 0;
      IDBDatabase.prototype.transaction = function (...args) {
        const tx = transaction.apply(this, args);
        if (this.name === "fil-clair-operations-v1") {
          events.push(["transaction", args[1], args[2]?.durability, tx.durability]);
          tx.addEventListener("complete", () => events.push(["complete"]));
        }
        return tx;
      };
      IDBDatabase.prototype.close = function (...args) { if (this.name === "fil-clair-operations-v1") closes++; return close.apply(this, args); };
      IDBObjectStore.prototype.put = function (...args) {
        const req = put.apply(this, args);
        if (this.transaction.db.name === "fil-clair-operations-v1") req.addEventListener("success", () => events.push(["put-success"]));
        return req;
      };
      try {
        await q.journal.compareAndSet(q.lane, null, q.next()); events.push(["cas-resolved"]);
        await q.journal.read(q.lane); events.push(["read-resolved"]);
        return { events, closes };
      } finally { IDBDatabase.prototype.transaction = transaction; IDBDatabase.prototype.close = close; IDBObjectStore.prototype.put = put; }
    });
    const transactions = result.events.filter(e => e[0] === "transaction");
    assert.equal(transactions.length, 2);
    for (const tx of transactions) assert.deepEqual(tx.slice(2), ["strict", "strict"]);
    const names = result.events.map(e => e[0]);
    assert.ok(names.indexOf("put-success") < names.indexOf("complete"));
    assert.ok(names.indexOf("complete") < names.indexOf("cas-resolved"));
    assert.ok(names.lastIndexOf("complete") < names.indexOf("read-resolved"));
    assert.equal(result.closes, 2);
  });

  await check("abort after a successful put rejects and preserves the old checkpoint", async context => {
    const page = await pageFor(context);
    const result = await page.evaluate(async () => {
      const q = qaJournal;
      await q.journal.compareAndSet(q.lane, null, q.next());
      const put = IDBObjectStore.prototype.put;
      let putSucceeded = false, code;
      IDBObjectStore.prototype.put = function (...args) {
        const req = put.apply(this, args);
        if (this.transaction.db.name === "fil-clair-operations-v1") {
          const tx = this.transaction;
          req.addEventListener("success", () => { putSucceeded = true; tx.abort(); }, { once:true });
        }
        return req;
      };
      try { await q.journal.compareAndSet(q.lane, 1, q.next({ phase:"sending", attempts:1, updatedAt:1001 })); }
      catch (error) { code = error.code; }
      finally { IDBObjectStore.prototype.put = put; }
      return { putSucceeded, code, saved:await q.journal.read(q.lane) };
    });
    assert.equal(result.putSucceeded, true);
    assert.equal(result.code, "journal-storage-error");
    assert.equal(result.saved.revision, 1);
    assert.equal(result.saved.phase, "prepared");
  });

  await check("a transaction blocked past timeout cannot commit after its lock is released", async context => {
    const page = await pageFor(context);
    const result = await page.evaluate(async () => {
      const q = qaJournal;
      await q.journal.read(q.lane);
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open("fil-clair-operations-v1", 1);
        req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      });
      const tx = db.transaction("lanes", "readwrite", { durability:"strict" }), store = tx.objectStore("lanes");
      let hold = true, code;
      const keepAlive = () => { const req = store.get("fixture-lock"); req.onsuccess = () => { if (hold) keepAlive(); }; };
      keepAlive();
      const finished = new Promise(resolve => { tx.oncomplete = resolve; tx.onabort = resolve; });
      try { await q.create({ timeoutMs:25 }).compareAndSet(q.lane, null, q.next()); }
      catch (error) { code = error.code; }
      finally { hold = false; await finished; db.close(); }
      return { code, saved:await q.journal.read(q.lane) };
    });
    assert.equal(result.code, "journal-timeout");
    assert.equal(result.saved, null);
  });

  await check("an engine that ignores strict durability is refused before writing", async context => {
    const page = await pageFor(context);
    const result = await page.evaluate(async () => {
      const q = qaJournal, transaction = IDBDatabase.prototype.transaction;
      let code, puts = 0;
      const put = IDBObjectStore.prototype.put;
      IDBDatabase.prototype.transaction = function (stores, mode) { return transaction.call(this, stores, mode); };
      IDBObjectStore.prototype.put = function (...args) { puts++; return put.apply(this, args); };
      try { await q.journal.compareAndSet(q.lane, null, q.next()); }
      catch (error) { code = error.code; }
      finally { IDBDatabase.prototype.transaction = transaction; IDBObjectStore.prototype.put = put; }
      return { code, puts, saved:await q.journal.read(q.lane) };
    });
    assert.equal(result.code, "journal-durability-unavailable");
    assert.equal(result.puts, 0);
    assert.equal(result.saved, null);
  });

  await check("corrupt, cross-bound and proof-bearing envelopes fail closed without overwrite", async context => {
    const page = await pageFor(context);
    const result = await page.evaluate(async () => {
      const q = qaJournal, key = JSON.stringify([q.lane.provider, q.lane.accountId, q.lane.origin]);
      await q.journal.compareAndSet(q.lane, null, q.next());
      const original = await q.raw((store, done) => { const req = store.get(key); req.onsuccess = () => done(req.result); });
      const mutations = [row => { row.lane.accountId = "8"; }, row => { row.lane.origin = "https://other.example"; },
        row => { row.checkpoint.revision = 0; }, row => { row.checkpoint.confirmed = true; },
        row => { delete row.checkpoint.reason; }, row => { row.checkpoint.targetKey = "99"; },
        row => { row.checkpoint.observation = { blocked:true, observedAt:1000, evidence:"synthetic" }; },
        row => { row.token = "synthetic-secret"; }];
      const outcomes = [];
      for (const mutate of mutations) {
        const row = structuredClone(original); mutate(row);
        await q.raw(store => { store.put(row); });
        let read, cas;
        try { await q.journal.read(q.lane); } catch (error) { read = error.code; }
        try { await q.journal.compareAndSet(q.lane, 1, q.next()); } catch (error) { cas = error.code; }
        const unchanged = await q.raw((store, done) => { const req = store.get(key); req.onsuccess = () => done(JSON.stringify(req.result) === JSON.stringify(row)); });
        outcomes.push({ read, cas, unchanged });
      }
      return outcomes;
    });
    assert.equal(result.length, 8);
    for (const outcome of result) assert.deepEqual(outcome, { read:"journal-corrupt", cas:"journal-corrupt", unchanged:true });
  });

  await check("the 128-lane bound is atomic across pages and permits existing-lane updates", async context => {
    const [a, b] = await Promise.all([pageFor(context), pageFor(context)]);
    await a.evaluate(async () => {
      const q = qaJournal;
      for (let id = 1; id <= 127; id++) await q.journal.compareAndSet({ ...q.lane, accountId:String(id) }, null, q.next());
    });
    const add = (page, id) => page.evaluate(async id => {
      const q = qaJournal;
      try { const saved = await q.journal.compareAndSet({ ...q.lane, accountId:String(id) }, null, q.next()); return { revision:saved.revision }; }
      catch (error) { return { code:error.code }; }
    }, id);
    const last = await Promise.all([add(a, 128), add(b, 129)]);
    assert.equal(last.filter(result => result.revision === 1).length, 1);
    assert.equal(last.filter(result => result.code === "journal-capacity").length, 1);
    const final = await a.evaluate(async () => {
      const q = qaJournal;
      const saved = await q.journal.compareAndSet(q.lane, 1, q.next({ phase:"closed", reason:"no-write", updatedAt:1001 }));
      const count = await q.raw((store, done) => { const req = store.count(); req.onsuccess = () => done(req.result); });
      return { count, saved };
    });
    assert.equal(final.count, 128);
    assert.equal(final.saved.revision, 2);
  });

  await check("provider, account and normalized origin identify independent lanes", async context => {
    const page = await pageFor(context);
    const result = await page.evaluate(async () => {
      const q = qaJournal;
      await q.journal.compareAndSet(q.lane, null, q.next());
      const did = "did:plc:bbbbbbbbbbbbbbbbbbbbbbbb";
      const lane = { provider:"bluesky", accountId:"did:plc:aaaaaaaaaaaaaaaaaaaaaaaa", origin:"https://pds.example" };
      const next = q.next({ target:{ did, rkey:"3lfilclair222" }, targetKey:did });
      const saved = await q.journal.compareAndSet(lane, null, next);
      saved.target.did = lane.accountId;
      return { otherAccount:await q.journal.read({ ...q.lane, accountId:"8" }),
        otherOrigin:await q.journal.read({ ...q.lane, origin:"https://other.example" }),
        same:await q.journal.read({ ...q.lane, origin:"https://SOCIAL.example/" }), bluesky:await q.journal.read(lane) };
    });
    assert.equal(result.otherAccount, null);
    assert.equal(result.otherOrigin, null);
    assert.equal(result.same.revision, 1);
    assert.equal(result.bluesky.target.did, "did:plc:bbbbbbbbbbbbbbbbbbbbbbbb");
  });

  await check("same-operation timestamps cannot roll back or change the original creation time", async context => {
    const page = await pageFor(context);
    const result = await page.evaluate(async () => {
      const q = qaJournal;
      await q.journal.compareAndSet(q.lane, null, q.next({ phase:"sending", attempts:1, updatedAt:2000 }));
      const codes = [];
      for (const extra of [{ updatedAt:1999 }, { createdAt:1001, updatedAt:2001 }]) {
        try { await q.journal.compareAndSet(q.lane, 1, q.next({ phase:"closed", attempts:1, ...extra })); }
        catch (error) { codes.push(error.code); }
      }
      return { codes, saved:await q.journal.read(q.lane) };
    });
    assert.deepEqual(result.codes, ["journal-invalid-checkpoint", "journal-invalid-checkpoint"]);
    assert.equal(result.saved.revision, 1);
  });
} catch (error) { results.push({ name:"browser environment", result:"FAIL", error:error.stack }); }
finally { if (browser) await browser.close(); await new Promise(done => server.close(done)); }
for (const result of results) console.log(JSON.stringify(result));
const failed = results.filter(result => result.result === "FAIL").length;
console.log(`Operation journal: ${results.length - failed}/${results.length} scenarios passed; served ${requests.length} loopback fixture requests.`);
if (failed) process.exitCode = 1;
