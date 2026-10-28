import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect } from "@playwright/test";
import { parseBackup, newState } from "../pwa/core.js";
import { servePwa, launchPwaBrowser } from "./pwa-test-utils.mjs";

const server = await servePwa();
const temp = await mkdtemp(join(tmpdir(), "fil-clair-concurrency-"));
let browser;
const results = [];
const conflictMessage = /conflit|autre.+onglet|recharg|concurren/i;
async function check(name, work) {
  if (process.env.PWA_CONCURRENCY_CASE && !name.includes(process.env.PWA_CONCURRENCY_CASE)) return;
  try { await work(); results.push({ name, result: "PASS" }); }
  catch (error) { results.push({ name, result: "FAIL", error: error.stack }); }
}
async function traceLocks(context) {
  if (process.env.PWA_TRACE_LOCKS !== "1") return;
  await context.addInitScript(() => {
    const events = [];
    window.qaConcurrencyTrace = events;
    let sequence = 0, held = false;
    const record = (type, data = {}) => events.push({ sequence: ++sequence, wall: Date.now(), time: performance.timeOrigin + performance.now(), type, held, ...data });
    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      const value = originalGet.call(this, key);
      if (key === "fil-clair-v1") record("getItem", { value });
      return value;
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "fil-clair-v1") record("setItem-start", { value });
      const result = originalSet.call(this, key, value);
      if (key === "fil-clair-v1") record("setItem-return", { value });
      return result;
    };
    if (navigator.locks?.request) {
      const original = navigator.locks.request.bind(navigator.locks);
      navigator.locks.request = function (...args) {
        const name = args[0];
        if (name !== "fil-clair-v1-write") return original(...args);
        const index = args.length - 1, callback = args[index];
        record("lock-request", { name });
        args[index] = lock => {
          held = true;
          record("lock-granted", { name });
          try {
            const result = callback(lock);
            record("lock-callback-return", { result: result instanceof Promise ? "promise" : result });
            if (result instanceof Promise) result.then(() => { held = false; }, () => { held = false; });
            else held = false;
            return result;
          } catch (error) { held = false; record("lock-callback-error", { message: error.message }); throw error; }
        };
        const promise = original(...args);
        promise.then(result => record("lock-request-settled", { result }), error => record("lock-request-error", { message: error.message }));
        return promise;
      };
    }
    const value = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    Object.defineProperty(HTMLInputElement.prototype, "value", { ...value, set(next) {
      if (this.id === "handle") record("handle-set", { before: value.get.call(this), next });
      value.set.call(this, next);
    } });
    addEventListener("storage", event => {
      if (event.key === "fil-clair-v1") record("storage-event", { oldValue: event.oldValue, newValue: event.newValue });
    });
    addEventListener("submit", () => record("submit", { handle: document.getElementById("handle")?.value }), true);
    addEventListener("DOMContentLoaded", () => {
      const notice = document.getElementById("notice");
      let previous = notice.textContent;
      new MutationObserver(() => {
        if (notice.textContent !== previous) {
          previous = notice.textContent;
          record("notice", { text: previous, error: notice.classList.contains("error"), handle: document.getElementById("handle")?.value });
        }
      }).observe(notice, { childList: true, subtree: true, characterData: true });
    });
  });
}
async function openLists(context) {
  const page = await context.newPage();
  await page.goto(server.url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Mes listes", exact: true }).click();
  return page;
}
async function settleWrites(page) {
  await expect.poll(async () => page.evaluate(async () => {
    if (!navigator.locks?.query) return 0;
    const locks = await navigator.locks.query();
    return [...locks.held, ...locks.pending].filter(lock => lock.name === "fil-clair-v1-write").length;
  })).toBe(0);
}
async function storedHandles(page) {
  const raw = await page.evaluate(() => localStorage.getItem("fil-clair-v1"));
  assert.notEqual(raw, null, "A successful first write must exist in storage");
  return parseBackup(raw).lists.flatMap(list => list.accounts.map(account => account.handle)).sort();
}
async function clickAdd(page) {
  const button = page.getByRole("button", { name: "Ajouter à ma liste", exact: true });
  if (await button.isDisabled()) return;
  try { await button.click({ timeout: 3000 }); }
  catch (error) { if (!await button.isDisabled()) throw error; }
}
async function exportSnapshot(page, filename) {
  await page.getByRole("button", { name: "Historique", exact: true }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exporter mes données", exact: true }).click()]);
  const path = join(temp, filename);
  await download.saveAs(path);
  return parseBackup(await readFile(path, "utf8"));
}

try {
  const launched = await launchPwaBrowser();
  browser = launched.browser;
  console.log(JSON.stringify({ engine: launched.name, version: launched.version, physicalDevice: false }));
  await check("stale tab refuses overwrite, exports its snapshot and resumes only after reload", async () => {
    const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
    try {
      const [a, b] = await Promise.all([openLists(context), openLists(context)]);
      assert.equal(await a.locator("#accounts li").count(), 0);
      assert.equal(await b.locator("#accounts li").count(), 0);
      await a.locator("#handle").fill("qa_tab_a");
      await b.locator("#handle").fill("qa_tab_b");
      await clickAdd(a);
      await expect(a.locator(".account-id strong")).toHaveText("@qa_tab_a");
      await clickAdd(b);
      await settleWrites(b);
      assert.deepEqual(await storedHandles(a), ["qa_tab_a"], "A stale tab must not silently replace the first tab's write");
      assert.match(await b.locator("#notice").textContent(), conflictMessage);
      assert.equal(await b.locator("#notice").evaluate(element => element.classList.contains("error")), true);
      assert.equal(await b.locator("#handle").inputValue(), "qa_tab_b");
      await exportSnapshot(b, "stale-tab-snapshot.json");
      assert.deepEqual(await storedHandles(a), ["qa_tab_a"], "Exporting the refused snapshot must not change storage");
      await b.reload({ waitUntil: "networkidle" });
      await b.getByRole("button", { name: "Mes listes", exact: true }).click();
      await expect(b.locator(".account-id strong")).toHaveText("@qa_tab_a");
      await b.locator("#handle").fill("qa_tab_b");
      await clickAdd(b);
      await expect(b.locator("#accounts li")).toHaveCount(2);
      await settleWrites(b);
      assert.deepEqual(await storedHandles(b), ["qa_tab_a", "qa_tab_b"]);
    } finally { await context.close(); }
  });
  await check("simultaneous clicks preserve both additions or explicitly refuse the losing writer", async () => {
    const context = await browser.newContext({ serviceWorkers: "block" });
    try {
      await traceLocks(context);
      const [a, b] = await Promise.all([openLists(context), openLists(context)]);
      await a.locator("#handle").fill("qa_race_a");
      await b.locator("#handle").fill("qa_race_b");
      await Promise.all([clickAdd(a), clickAdd(b)]);
      await settleWrites(a);
      // A freshly opened document avoids treating a renderer's possibly stale
      // localStorage cache as the final stored state on multi-process engines.
      const fresh = await context.newPage();
      await fresh.goto(server.url, { waitUntil: "networkidle" });
      const handles = await storedHandles(fresh);
      const inspect = async page => page.evaluate(() => ({ raw: localStorage.getItem("fil-clair-v1"), notice: document.getElementById("notice").textContent, handle: document.getElementById("handle").value, trace: window.qaConcurrencyTrace || [] }));
      const views = { a: await inspect(a), b: await inspect(b), fresh: await inspect(fresh) };
      if (process.env.PWA_TRACE_LOCKS === "1") console.log("PWA_CONCURRENCY_DIAGNOSTIC " + JSON.stringify(views));
      assert.ok(handles.length === 1 || handles.length === 2, "At least one addition must be committed");
      assert.equal(new Set(handles).size, handles.length);
      assert.ok(handles.every(handle => ["qa_race_a", "qa_race_b"].includes(handle)));
      if (handles.length === 1) {
        const loser = handles[0] === "qa_race_a" ? b : a;
        const refused = handles[0] === "qa_race_a" ? "qa_race_b" : "qa_race_a";
        await expect(loser.locator("#notice")).toHaveText(conflictMessage);
        assert.equal(await loser.locator("#notice").evaluate(element => element.classList.contains("error")), true);
        assert.equal(await loser.locator("#handle").inputValue(), refused, "A refused write must keep the form: " + JSON.stringify(views));
      } else assert.deepEqual(handles, ["qa_race_a", "qa_race_b"]);
    } finally { await context.close(); }
  });
  await check("one initial SecurityError cannot authorize an unknown overwrite before reload", async () => {
    const context = await browser.newContext({ serviceWorkers: "block" });
    try {
      const initial = newState();
      initial.lists[0].accounts = [{ network: "x", handle: "qa_existing" }];
      const raw = JSON.stringify(initial);
      await context.addInitScript(raw => {
        if (sessionStorage.getItem("qa-read-failed-once")) return;
        localStorage.setItem("fil-clair-v1", raw);
        const original = Storage.prototype.getItem;
        let first = true;
        window.qaReadFailures = 0;
        Storage.prototype.getItem = function (key) {
          if (key === "fil-clair-v1" && first) {
            first = false;
            window.qaReadFailures++;
            sessionStorage.setItem("qa-read-failed-once", "yes");
            throw new DOMException("Synthetic one-time initial read denial", "SecurityError");
          }
          return original.call(this, key);
        };
      }, raw);
      const page = await openLists(context);
      assert.equal(await page.evaluate(() => window.qaReadFailures), 1);
      assert.equal(await page.evaluate(() => localStorage.getItem("fil-clair-v1")), raw, "Storage is accessible again with real fixture data");
      await page.locator("#handle").fill("qa_unknown");
      await clickAdd(page);
      await settleWrites(page);
      assert.equal(await page.evaluate(() => localStorage.getItem("fil-clair-v1")), raw, "An unknown initial snapshot must never overwrite readable existing data");
      assert.match(await page.locator("#notice").textContent(), /inaccessible|lecture|recharg|conflit|refus/i);
      assert.equal(await page.locator("#handle").inputValue(), "qa_unknown");
      await page.reload({ waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Mes listes", exact: true }).click();
      await expect(page.locator(".account-id strong")).toHaveText("@qa_existing");
      await page.locator("#handle").fill("qa_known");
      await clickAdd(page);
      await expect(page.locator("#accounts li")).toHaveCount(2);
      assert.deepEqual(await storedHandles(page), ["qa_existing", "qa_known"]);
    } finally { await context.close(); }
  });
  await check("without Web Locks the browser remains read/export only", async () => {
    const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
    try {
      const initial = newState();
      initial.lists[0].accounts = [{ network: "x", handle: "qa_existing" }];
      const raw = JSON.stringify(initial);
      await context.addInitScript(raw => {
        localStorage.setItem("fil-clair-v1", raw);
        Object.defineProperty(navigator, "locks", { value: undefined, configurable: true });
      }, raw);
      const page = await openLists(context);
      assert.equal(await page.evaluate(() => typeof navigator.locks), "undefined");
      await expect(page.locator(".account-id strong")).toHaveText("@qa_existing");
      await page.locator("#handle").fill("qa_no_locks");
      await clickAdd(page);
      assert.equal(await page.evaluate(() => localStorage.getItem("fil-clair-v1")), raw);
      assert.match(await page.locator("#notice").textContent(), /verrou|lock|lecture|export|navigateur/i);
      const snapshot = await exportSnapshot(page, "no-locks-snapshot.json");
      assert.deepEqual(snapshot.lists[0].accounts, initial.lists[0].accounts);
      assert.equal(await page.evaluate(() => localStorage.getItem("fil-clair-v1")), raw);
    } finally { await context.close(); }
  });
} catch (error) { results.push({ name: "browser environment", result: "FAIL", error: error.stack }); }
finally {
  if (browser) await browser.close();
  await server.close();
  await rm(temp, { recursive: true, force: true });
}
for (const result of results) console.log(JSON.stringify(result));
const failed = results.filter(result => result.result === "FAIL").length;
console.log(`PWA concurrency: ${results.length - failed}/${results.length} scenarios passed.`);
if (failed) process.exitCode = 1;
