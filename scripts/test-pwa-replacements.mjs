import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import { newState, markDecision, parseBackup } from "../pwa/core.js";
import { newFlows, configureFlows, addFlow } from "../pwa/flow-core.js";
import { servePwa, launchPwaBrowser } from "./pwa-test-utils.mjs";

const server = await servePwa();
let browser;
const results = [];
function fixture(target, handle, includeFlows = true) {
  let state = newState(); const account = { network:"x", handle };
  state.lists[0].accounts.push(account); state = markDecision(state, "personal", account, "muted", 1793150000000);
  if (includeFlows) state.flows = addFlow(configureFlows(newFlows(), ["youtube"], ["accounts", "sources", "topics", "recommendations"]),
    { id:"flow-test", platform:"local", control:"source-avoid", target }, 1793150000000);
  return parseBackup(JSON.stringify(state));
}
const initial = fixture("Current synthetic source", "qa_current");
const restored = fixture("Restored synthetic source", "qa_restored");
const legacy = fixture("", "qa_legacy", false);
const rawInitial = JSON.stringify(initial);
const draftValues = page => page.evaluate(() => Object.fromEntries(
  ["flow-target", "flow-filter", "handle", "instance", "search", "network", "filter-network", "filter-status"].map(id => [id, document.getElementById(id).value])
));
async function prime(page) {
  await page.getByRole("button", { name:"Mes flux", exact:true }).click();
  await page.locator("#flow-target").fill("SENSITIVE UNSAVED DRAFT");
  await page.locator("#flow-filter").fill("OLD FILTER NO MATCH");
  await page.getByRole("button", { name:"Mes listes", exact:true }).click();
  await page.locator("#network").selectOption("mastodon");
  await page.locator("#handle").fill("qa_unsaved"); await page.locator("#instance").fill("social.example");
  await page.locator("#search").fill("OLD PROFILE FILTER");
  await page.locator("#filter-network").selectOption("mastodon"); await page.locator("#filter-status").selectOption("review");
  await page.getByRole("button", { name:"Historique", exact:true }).click();
  await expect(page.locator("#history")).toContainText("qa_current");
  await page.getByRole("button", { name:"Réglages", exact:true }).click();
}
async function assertCleared(page) {
  assert.deepEqual(await draftValues(page), { "flow-target":"", "flow-filter":"", handle:"", instance:"", search:"", network:"x", "filter-network":"", "filter-status":"" });
  await expect(page.locator("#instance-field")).toBeHidden();
  assert.ok(!(await page.locator("#history").textContent()).includes("qa_current"));
}
async function restore(page, backup, accept = true) {
  let message;
  page.once("dialog", async dialog => { message = dialog.message(); await (accept ? dialog.accept() : dialog.dismiss()); });
  await page.locator("#file").setInputFiles({ name:"synthetic-backup.json", mimeType:"application/json", buffer:Buffer.from(JSON.stringify(backup)) });
  await expect.poll(() => message).not.toBeUndefined();
  return message;
}
async function scenario(name, work, denyWrites = false) {
  const context = await browser.newContext();
  await context.addInitScript(({ raw, deny }) => {
    localStorage.setItem("fil-clair-v1", raw);
    if (deny) Storage.prototype.setItem = () => { throw new DOMException("Synthetic quota", "QuotaExceededError"); };
  }, { raw:rawInitial, deny:denyWrites });
  const p = await context.newPage();
  try { await p.goto(server.url, { waitUntil:"networkidle" }); await work(p); results.push({ name, result:"PASS" }); }
  catch (error) { results.push({ name, result:"FAIL", error:error.message }); }
  finally { await context.close(); }
}
try {
  const launched = await launchPwaBrowser(); browser = launched.browser;
  console.log(JSON.stringify({ suite:"space-replacements", engine:launched.name, version:launched.version, physicalDevice:false }));
  await scenario("I1: global erase clears sensitive drafts, filters and hidden historical DOM", async p => {
    await prime(p); p.once("dialog", d => d.accept()); await p.locator("#erase").click();
    await expect(p.locator("#notice")).toContainText("locaux effacés"); await assertCleared(p);
    assert.equal(JSON.parse(await p.evaluate(() => localStorage.getItem("fil-clair-v1"))).flows?.items.length || 0, 0);
  });
  await scenario("I1: V2 restore clears old filters and immediately displays restored records", async p => {
    await prime(p); await restore(p, restored); await expect(p.locator("#notice")).toContainText("restaurée"); await assertCleared(p);
    await p.getByRole("button", { name:"Mes flux", exact:true }).click();
    await expect(p.locator("#flow-workspace")).toBeVisible(); await expect(p.locator("#flow-items > li")).toHaveCount(1);
    await expect(p.locator("#flow-items")).toContainText("Restored synthetic source");
  });
  await scenario("I1: consented fresh memory space clears old drafts but preserves stored source", async p => {
    await prime(p); p.once("dialog", d => d.accept()); await p.locator("#session-mode").click();
    await expect(p.locator("#session-warning")).toBeVisible(); await assertCleared(p);
    assert.equal(await p.evaluate(() => localStorage.getItem("fil-clair-v1")), rawInitial);
  });
  await scenario("I2: V2 restore confirmation names all replaced data", async p => {
    const message = await restore(p, restored); assert.match(message, /Mes flux/); assert.match(message, /déclarations/); assert.match(message, /historique/);
    await expect(p.locator("#notice")).toContainText("restaurée");
    assert.deepEqual(JSON.parse(await p.evaluate(() => localStorage.getItem("fil-clair-v1"))), JSON.parse(JSON.stringify(restored)));
  });
  await scenario("I2: legacy restore explicitly removes current Mes flux after clear consent", async p => {
    const message = await restore(p, legacy); assert.match(message, /Mes flux/); assert.match(message, /ne contient pas|sans.*Mes flux/i);
    await expect(p.locator("#notice")).toContainText("restaurée");
    assert.equal(Object.hasOwn(JSON.parse(await p.evaluate(() => localStorage.getItem("fil-clair-v1"))), "flows"), false);
  });
  for (const action of ["erase", "restore", "session"]) {
    await scenario(`I1/I2: cancelled ${action} preserves all drafts and stored data`, async p => {
      await prime(p); const before = await draftValues(p);
      if (action === "restore") await restore(p, restored, false);
      else { p.once("dialog", d => d.dismiss()); await p.locator(action === "erase" ? "#erase" : "#session-mode").click(); }
      assert.deepEqual(await draftValues(p), before);
      assert.equal(await p.evaluate(() => localStorage.getItem("fil-clair-v1")), rawInitial);
      await expect(p.locator("#session-warning")).toBeHidden();
    });
  }
  for (const action of ["erase", "restore"]) {
    await scenario(`I1: failed ${action} preserves all drafts and stored data`, async p => {
      await prime(p); const before = await draftValues(p);
      if (action === "restore") await restore(p, restored);
      else { p.once("dialog", d => d.accept()); await p.locator("#erase").click(); }
      await expect(p.locator("#notice")).toContainText("Enregistrement impossible");
      assert.deepEqual(await draftValues(p), before); assert.equal(await p.evaluate(() => localStorage.getItem("fil-clair-v1")), rawInitial);
    }, true);
  }
  await scenario("I2: temporary restore names memory scope and leaves persistent source intact", async p => {
    await p.getByRole("button", { name:"Réglages", exact:true }).click();
    p.once("dialog", d => d.accept()); await p.locator("#session-mode").click();
    await expect(p.locator("#session-warning")).toBeVisible();
    const message = await restore(p, restored); assert.match(message, /temporaire/); assert.match(message, /persistantes.*intactes/);
    await expect(p.locator("#notice")).toContainText("restaurée");
    assert.equal(await p.evaluate(() => localStorage.getItem("fil-clair-v1")), rawInitial);
    await p.getByRole("button", { name:"Mes flux", exact:true }).click(); await expect(p.locator("#flow-items > li")).toHaveCount(1);
  });
} catch (error) { results.push({ name:"replacement environment", result:"FAIL", error:error.stack }); }
finally { if (browser) await browser.close(); await server.close(); }
results.forEach(result => console.log(JSON.stringify(result)));
console.log(`Space replacements: ${results.filter(r => r.result === "PASS").length}/${results.length} checks passed.`);
if (results.some(r => r.result === "FAIL")) process.exitCode = 1;
