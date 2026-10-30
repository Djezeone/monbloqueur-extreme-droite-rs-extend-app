import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import { servePwa, launchPwaBrowser } from "./pwa-test-utils.mjs";
import { newState, parseBackup } from "../pwa/core.js";
import { configureFlows, newFlows } from "../pwa/flow-core.js";

const server = await servePwa();
const results = [];
let browser, externalRequests = 0;
const listFile = { format:"fil-clair-v1", title:"Synthetic earlier import", accounts:[{ network:"x", handle:"qa_old_import" }] };
function initialState() {
  const state = newState();
  state.flows = configureFlows(newFlows(), [], ["accounts", "sources", "topics", "recommendations"]);
  return state;
}
function replacement() {
  const state = initialState();
  state.lists[0].accounts = [{ network:"x", handle:"qa_replacement" }];
  return state;
}
function file(value, name = "synthetic-import.json") {
  return { name, mimeType:"application/json", buffer:Buffer.from(JSON.stringify(value)) };
}
async function snapshot(page) { return page.evaluate(() => localStorage.getItem("fil-clair-v1")); }
async function settled(page) {
  await expect.poll(() => page.evaluate(async () => {
    const locks = await navigator.locks.query();
    return [...locks.held, ...locks.pending].filter(lock => lock.name === "fil-clair-v1-write").length;
  })).toBe(0);
}
async function holdWrite(page) {
  await page.evaluate(() => {
    navigator.locks.request("fil-clair-v1-write", async () => {
      window.qaLockHeld = true;
      await new Promise(resolve => { window.qaReleaseWrite = resolve; });
    });
  });
  await page.waitForFunction(() => window.qaLockHeld);
}
async function queuedWrite(page) {
  await page.waitForFunction(async () => (await navigator.locks.query()).pending.some(lock => lock.name === "fil-clair-v1-write"));
}
async function deferFiles(page) {
  await page.evaluate(() => {
    // Keep the native method and each gate strongly rooted on WebKit as well.
    window.qaNativeFileText = File.prototype.text;
    window.qaFileReads = [];
    File.prototype.text = async function () {
      const entry = { name:this.name };
      window.qaFileReads.push(entry);
      await new Promise(resolve => { entry.release = resolve; });
      return window.qaNativeFileText.call(this);
    };
  });
}
async function finishFile(page, index = 0) {
  await page.evaluate(index => window.qaFileReads[index].release(), index);
}
async function replaceSpace(page, action, accept = true) {
  await page.getByRole("button", { name:"Réglages", exact:true }).click();
  page.once("dialog", d => accept ? d.accept() : d.dismiss());
  if (action === "restore") {
    // bypass only the test's artificial hold for this second, explicit file.
    await page.evaluate(() => { if (window.qaNativeFileText) File.prototype.text = window.qaNativeFileText; });
    await page.locator("#file").setInputFiles(file(replacement(), "replacement.json"));
  } else await page.locator(action === "erase" ? "#erase" : "#session-mode").click();
  if (accept) {
    if (action === "session") await expect(page.locator("#session-warning")).toBeVisible();
    else await expect(page.locator("#notice")).toContainText(action === "erase" ? "locaux effacés" : "restaurée");
  }
  await settled(page);
}
async function check(name, work, state = initialState(), options = {}) {
  if (process.env.PWA_LIFECYCLE_CASE && !name.includes(process.env.PWA_LIFECYCLE_CASE)) return;
  console.log(JSON.stringify({ start:name }));
  const context = await browser.newContext({ serviceWorkers:"block" });
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === new URL(server.url).origin) return route.continue();
    externalRequests++;
    return route.abort();
  });
  await context.addInitScript(({ raw, deny }) => {
    localStorage.setItem("fil-clair-v1", raw);
    if (deny) Storage.prototype.setItem = () => { throw new DOMException("Synthetic quota", "QuotaExceededError"); };
  }, { raw:JSON.stringify(state), deny:options.denyWrites || false });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto(server.url, { waitUntil:"networkidle" });
    await work(page, context);
    results.push({ name, result:"PASS" });
  } catch (error) { results.push({ name, result:"FAIL", error:error.stack }); }
  finally { await context.close(); }
}

try {
  const launched = await launchPwaBrowser(); browser = launched.browser;
  console.log(JSON.stringify({ suite:"local-data-lifecycle", engine:launched.name, version:launched.version, physicalDevice:false }));
  const orphan = initialState();
  orphan.decisions["personal|x::qa_ghost"] = { status:"blocked", at:1000 };
  await check("profile: adding an imported orphan starts at To do without a fresh declaration", async p => {
    await p.getByRole("button", { name:"Mes listes", exact:true }).click();
    await p.locator("#handle").fill("QA_GHOST");
    await p.locator("#add-account button[type=submit]").click(); await settled(p);
    const next = parseBackup(await snapshot(p));
    assert.equal(Object.hasOwn(next.decisions, "personal|x::qa_ghost"), false);
    assert.equal(next.history.length, 0);
    await expect(p.locator("#accounts .status")).toHaveText("À faire");
  }, orphan);

  for (const kind of ["account", "flow"]) {
    await check(`draft: newer ${kind} text survives a pending save and retains focus`, async p => {
      await p.getByRole("button", { name:kind === "account" ? "Mes listes" : "Mes flux", exact:true }).click();
      const input = p.locator(kind === "account" ? "#handle" : "#flow-target");
      await input.fill(kind === "account" ? "qa_first" : "Earlier source"); await holdWrite(p);
      await p.locator(kind === "account" ? "#add-account button[type=submit]" : "#flow-add-button").click();
      await queuedWrite(p);
      const nextDraft = kind === "account" ? "qa_next_draft" : "Next sensitive source";
      await input.fill(nextDraft); await p.evaluate(() => window.qaReleaseWrite()); await settled(p);
      await expect(input).toHaveValue(nextDraft); await expect(input).toBeFocused();
      const saved = parseBackup(await snapshot(p));
      assert.deepEqual(kind === "account" ? saved.lists[0].accounts.map(a => a.handle) : saved.flows.items.map(i => i.target), [kind === "account" ? "qa_first" : "Earlier source"]);
    });
    await check(`draft: changed ${kind} context and help focus survive a pending save`, async p => {
      await p.getByRole("button", { name:kind === "account" ? "Mes listes" : "Mes flux", exact:true }).click();
      const input = p.locator(kind === "account" ? "#handle" : "#flow-target");
      await input.fill(kind === "account" ? "qa_first" : "Same source"); await holdWrite(p);
      await p.locator(kind === "account" ? "#add-account button[type=submit]" : "#flow-add-button").click(); await queuedWrite(p);
      if (kind === "account") {
        await p.locator("#network").selectOption("mastodon"); await p.locator("#instance").fill("social.example");
      } else await p.locator("#flow-category").selectOption("topics");
      await p.getByRole("button", { name:"Réglages", exact:true }).click();
      await p.evaluate(() => window.qaReleaseWrite()); await settled(p);
      await expect(input).toHaveValue(kind === "account" ? "qa_first" : "Same source");
      await expect(p.locator("#view-settings h1")).toBeFocused();
    });
  }
  await check("draft: moving to an unchanged service selector keeps keyboard focus after save", async p => {
    await p.getByRole("button", { name:"Mes flux", exact:true }).click();
    await p.locator("#flow-target").fill("Earlier source"); await holdWrite(p);
    await p.locator("#flow-add-button").click(); await queuedWrite(p);
    await p.locator("#flow-target").focus();
    for (let i = 0; i < 3; i++) await p.keyboard.press("Shift+Tab");
    await expect(p.locator("#flow-platform")).toBeFocused();
    await p.evaluate(() => window.qaReleaseWrite()); await settled(p);
    await expect(p.locator("#flow-platform")).toBeFocused();
    assert.deepEqual(parseBackup(await snapshot(p)).flows.items.map(i => i.target), ["Earlier source"]);
  });
  await check("draft: unchanged successful submission clears its submitted fields", async p => {
    await p.getByRole("button", { name:"Mes listes", exact:true }).click();
    await p.locator("#handle").fill("qa_first"); await p.locator("#add-account button[type=submit]").click();
    await settled(p); await expect(p.locator("#handle")).toHaveValue("");
    await p.getByRole("button", { name:"Mes flux", exact:true }).click();
    await p.locator("#flow-target").fill("Source saved"); await p.locator("#flow-add-button").click();
    await settled(p); await expect(p.locator("#flow-target")).toHaveValue("");
  });
  await check("draft: failed account write keeps the current text and persisted snapshot", async p => {
    const before = await snapshot(p);
    await p.getByRole("button", { name:"Mes listes", exact:true }).click();
    await p.locator("#handle").fill("qa_keep_draft"); await p.locator("#add-account button[type=submit]").click();
    await expect(p.locator("#notice")).toContainText("Enregistrement impossible");
    await expect(p.locator("#handle")).toHaveValue("qa_keep_draft"); assert.equal(await snapshot(p), before);
  }, initialState(), { denyWrites:true });

  for (const action of ["erase", "restore", "session"]) for (const type of ["list", "backup"]) {
    await check(`import: late ${type} after successful ${action} cannot modify the new space`, async p => {
      await deferFiles(p);
      const payload = type === "list" ? listFile : { ...newState(), lists:[{ id:"personal", title:"Old backup", accounts:listFile.accounts }] };
      await p.locator("#file").setInputFiles(file(payload));
      await p.waitForFunction(() => window.qaFileReads.length === 1);
      await replaceSpace(p, action);
      const before = await snapshot(p); let confirmations = 0;
      p.on("dialog", async d => { confirmations++; await d.dismiss(); });
      await finishFile(p); await expect(p.locator("#notice")).toContainText(/import.*interrompu|import.*annulé/i);
      assert.equal(confirmations, 0, "A stale backup must not offer replacement in the new space");
      assert.equal(await snapshot(p), before);
      if (action === "session") {
        await p.getByRole("button", { name:"Mes listes", exact:true }).click();
        await expect(p.locator("#accounts > li")).toHaveCount(0);
      }
    });
  }
  for (const action of ["erase", "restore", "session"]) {
    await check(`import: delayed public response after ${action} is ignored`, async (p, context) => {
      let release, requested;
      const seen = new Promise(resolve => { requested = resolve; });
      const gate = new Promise(resolve => { release = resolve; });
      await context.route("https://raw.githubusercontent.com/**", async route => {
        requested(); await gate;
        await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({ schemaVersion:1, version:"synthetic-v1", accounts:[{ username:"qa_old_import" }] }) });
      });
      await p.getByRole("button", { name:"Mes listes", exact:true }).click();
      await p.locator("#import-public").click(); await seen;
      await replaceSpace(p, action); const before = await snapshot(p); release();
      await expect(p.locator("#import-public")).toBeEnabled();
      await expect(p.locator("#notice")).toContainText(/import.*interrompu|import.*annulé/i);
      assert.equal(await snapshot(p), before);
      if (action === "session") {
        await p.getByRole("button", { name:"Mes listes", exact:true }).click(); await expect(p.locator("#accounts > li")).toHaveCount(0);
      }
    });
  }
  await check("import: a stale invalid file reports cancellation without its private error text", async p => {
    await deferFiles(p); await p.locator("#file").setInputFiles({ name:"invalid.json", mimeType:"application/json", buffer:Buffer.from("SENSITIVE OLD FILE ERROR") });
    await p.waitForFunction(() => window.qaFileReads.length === 1);
    await replaceSpace(p, "erase"); const before = await snapshot(p); await finishFile(p);
    await expect(p.locator("#notice")).toContainText(/import.*interrompu|import.*annulé/i);
    assert.ok(!(await p.locator("#notice").textContent()).includes("SENSITIVE")); assert.equal(await snapshot(p), before);
  });
  await check("import boundary: a rejected file read after replacement cannot expose its error", async p => {
    await p.evaluate(() => {
      File.prototype.text = async function () {
        window.qaRejectedReadPending = true;
        await new Promise(resolve => { window.qaReleaseRejectedRead = resolve; });
        throw Error("SENSITIVE REJECTED FILE");
      };
    });
    await p.locator("#file").setInputFiles(file(listFile)); await p.waitForFunction(() => window.qaRejectedReadPending);
    await replaceSpace(p, "erase"); const before = await snapshot(p);
    await p.evaluate(() => window.qaReleaseRejectedRead());
    await expect(p.locator("#notice")).toContainText(/import.*interrompu|import.*annulé/i);
    assert.ok(!(await p.locator("#notice").textContent()).includes("SENSITIVE")); assert.equal(await snapshot(p), before);
  });
  await check("import boundary: a public body finishing after replacement cannot write", async p => {
    await p.evaluate(() => {
      window.qaOriginalFetch = window.fetch;
      window.fetch = async (...args) => {
        if (args[0] !== "https://raw.githubusercontent.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/b7cd31b036cca17b48dbf726c047847191c01a5b/liste/accounts.json") return window.qaOriginalFetch(...args);
        window.qaDelayedBody = new Response(new ReadableStream({ start(controller) { window.qaBodyController = controller; } }), { status:200, headers:{ "Content-Type":"application/json" } });
        const read = window.qaDelayedBody.text.bind(window.qaDelayedBody);
        window.qaDelayedBody.text = () => { window.qaBodyReadPending = true; return read(); };
        return window.qaDelayedBody;
      };
    });
    await p.getByRole("button", { name:"Mes listes", exact:true }).click(); await p.locator("#import-public").click();
    await p.waitForFunction(() => window.qaBodyReadPending);
    await replaceSpace(p, "erase"); const before = await snapshot(p);
    await p.evaluate(() => {
      window.qaBodyController.enqueue(new TextEncoder().encode(JSON.stringify({ schemaVersion:1, version:"synthetic-v1", accounts:[{ username:"qa_body_late" }] })));
      window.qaBodyController.close();
    });
    await expect(p.locator("#import-public")).toBeEnabled();
    await expect(p.locator("#notice")).toContainText(/import.*interrompu|import.*annulé/i);
    assert.equal(await snapshot(p), before);
  });
  for (const action of ["cancelled", "failed", "ordinary"]) {
    await check(`import: ${action} replacement or ordinary mutation preserves an authorized import`, async p => {
      await deferFiles(p); await p.locator("#file").setInputFiles(file(listFile));
      await p.waitForFunction(() => window.qaFileReads.length === 1);
      if (action === "ordinary") {
        await p.getByRole("button", { name:"Mes listes", exact:true }).click();
        await p.locator("#handle").fill("qa_during_read"); await p.locator("#add-account button[type=submit]").click(); await settled(p);
      } else if (action === "failed") {
        await p.evaluate(() => { window.qaNativeSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new DOMException("Synthetic quota", "QuotaExceededError"); }; });
        await p.getByRole("button", { name:"Réglages", exact:true }).click(); p.once("dialog", d => d.accept()); await p.locator("#erase").click();
        await expect(p.locator("#notice")).toContainText("Enregistrement impossible"); await settled(p);
        await p.evaluate(() => { Storage.prototype.setItem = window.qaNativeSetItem; });
      } else await replaceSpace(p, "erase", false);
      await finishFile(p); await expect(p.locator("#notice")).toContainText("profils importés"); await settled(p);
      const saved = parseBackup(await snapshot(p));
      assert.equal(saved.lists.length, 2); assert.equal(saved.lists[1].accounts[0].handle, "qa_old_import");
      if (action === "ordinary") assert.equal(saved.lists[0].accounts[0].handle, "qa_during_read");
    });
  }
  await check("import: finishing the older file does not clear a newer selection", async p => {
    await deferFiles(p); await p.locator("#file").setInputFiles(file(listFile, "first.json"));
    await p.waitForFunction(() => window.qaFileReads.length === 1);
    const second = { ...listFile, title:"Second import", accounts:[{ network:"x", handle:"qa_second" }] };
    await p.locator("#file").setInputFiles(file(second, "second.json")); await p.waitForFunction(() => window.qaFileReads.length === 2);
    await finishFile(p, 0); await expect(p.locator("#notice")).toContainText("profils importés"); await settled(p);
    assert.equal(await p.locator("#file").evaluate(el => el.files[0]?.name), "second.json");
    await finishFile(p, 1); await expect.poll(async () => parseBackup(await snapshot(p)).lists.length).toBe(3); await settled(p);
    assert.deepEqual(parseBackup(await snapshot(p)).lists.slice(1).map(l => l.accounts[0].handle), ["qa_old_import", "qa_second"]);
    await expect(p.locator("#file")).toHaveValue("");
  });
} catch (error) { results.push({ name:"environment", result:"FAIL", error:error.stack }); }
finally { if (browser) await browser.close(); await server.close(); }
results.forEach(result => console.log(JSON.stringify(result)));
console.log(JSON.stringify({ suite:"local-data-lifecycle", passed:results.filter(r => r.result === "PASS").length, total:results.length, externalRequests }));
if (results.some(r => r.result === "FAIL") || externalRequests) process.exitCode = 1;
