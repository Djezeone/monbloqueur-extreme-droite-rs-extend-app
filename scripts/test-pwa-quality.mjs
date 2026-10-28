import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { devices, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { servePwa, launchPwaBrowser } from "./pwa-test-utils.mjs";

const server = await servePwa();
const axePackage = JSON.parse(await readFile(new URL("../package.json", import.meta.resolve("@axe-core/playwright")), "utf8"));
let browser;
const checks = [];
async function check(name, work) {
  try { await work(); checks.push({ name, result: "PASS" }); }
  catch (error) { checks.push({ name, result: "FAIL", error: error.message }); }
}
async function reflow(page) {
  const bounds = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(bounds.document <= bounds.viewport + 1 && bounds.body <= bounds.viewport + 1, JSON.stringify(bounds));
}
async function scan(page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  console.log(JSON.stringify({ axeEngine: result.testEngine.version, violations: result.violations.length, manualReview: result.incomplete.map(rule => ({ id: rule.id, targets: rule.nodes.map(node => node.target) })) }));
  assert.deepEqual(result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), []);
}

try {
  const launched = await launchPwaBrowser();
  browser = launched.browser;
  console.log(JSON.stringify({ engine: launched.name, version: launched.version, axePlaywright: axePackage.version, physicalDevice: false }));
  const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
  const page = await context.newPage();
  await page.goto(server.url, { waitUntil: "networkidle" });
  await check("navigation: single-word tab labels remain unbroken at 320px", async () => {
    for (const name of ["Accueil", "Historique", "Réglages"]) {
      const lines = await page.getByRole("button", { name, exact:true }).evaluate(element => {
        const range = document.createRange(); range.selectNodeContents(element); return range.getClientRects().length;
      });
      assert.equal(lines, 1, name);
    }
  });
  await check("keyboard: skip link focuses main content", async () => {
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.className), "skip");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "content");
  });
  await check("keyboard: next native control has a visible focus outline", async () => {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      const style = getComputedStyle(element);
      return { id: element.id, visible: element.matches(":focus-visible"), outline: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    assert.equal(focus.id, "start-flows");
    assert.equal(focus.visible, true);
    assert.notEqual(focus.outline, "none");
    assert.ok(focus.width >= 2);
  });
  for (const view of ["Accueil", "Mes flux", "Mes listes", "Historique", "Réglages"]) {
    await page.getByRole("button", { name: view, exact: true }).click();
    if (view === "Mes listes") {
      await page.locator("#handle").fill("qa_synthetic");
      await page.getByRole("button", { name: "Ajouter à ma liste", exact: true }).click();
      await expect(page.locator("#accounts li")).toHaveCount(1);
      await check("keyboard: account decision retains focus after render", async () => {
        await page.locator('button[data-action="review"]').focus();
        await page.keyboard.press("Enter");
        await expect(page.locator(".status").first()).toContainText(/vérifier/i);
        assert.equal(await page.evaluate(() => document.activeElement.getAttribute("data-action")), "review");
      });
      await check("names: account actions include profile context", async () => {
        for (const action of ["blocked", "muted", "review", "skipped", "todo", "delete"]) {
          await expect(page.locator(`button[data-action="${action}"]`)).toHaveAccessibleName(/qa_synthetic/);
        }
      });
      await page.locator("#network").selectOption("mastodon");
      await page.locator("#handle").fill("a".repeat(80));
      await page.locator("#instance").fill("a".repeat(63) + "." + "b".repeat(63) + "." + "c".repeat(60) + ".example");
      await page.getByRole("button", { name: "Ajouter à ma liste", exact: true }).click();
      await expect(page.locator("#accounts li")).toHaveCount(2);
      page.once("dialog", dialog => dialog.accept("L".repeat(70)));
      await page.getByRole("button", { name: "Renommer", exact: true }).click();
      await expect(page.locator("#list-picker option:checked")).toHaveText("L".repeat(70));
      await page.locator('button[data-action="review"]').last().click();
      await expect(page.locator(".status").last()).toContainText(/vérifier/i);
      await page.locator('button[data-action="skipped"]').first().click();
      await check("progress: accessible value follows declared decisions", async () => {
        await expect(page.getByRole("progressbar", { includeHidden: true })).toHaveAttribute("aria-valuenow", "50");
      });
      const sourceUrl = "https://example.org/" + "a".repeat(1850);
      const metadataList = {
        format: "fil-clair-v1", title: "QA source longue", revision: "r".repeat(80), provenance: { url: sourceUrl },
        accounts: [{ network: "mastodon", handle: "a".repeat(80), instance: "a".repeat(63) + "." + "b".repeat(63) + "." + "c".repeat(60) + ".example" }]
      };
      await page.locator("#file").setInputFiles({ name: "long-source.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(metadataList)) });
      await check("metadata: long declared source is visible", async () => {
        await expect(page.locator("#list-metadata")).toContainText(sourceUrl);
      });
    }
    await check(`${view}: 320px reflow`, () => reflow(page));
    await check(`${view}: axe automated A/AA rules`, () => scan(page));
  }
  await page.goto(server.url + "/privacy.html", { waitUntil: "networkidle" });
  await check("privacy: 320px reflow", () => reflow(page));
  await check("privacy: axe automated A/AA rules", () => scan(page));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(server.url, { waitUntil: "networkidle" });
  for (const view of ["Accueil", "Mes flux", "Mes listes", "Historique", "Réglages"]) {
    await page.getByRole("button", { name: view, exact: true }).click();
    await check(`${view}: 1280px bounds`, () => reflow(page));
    await check(`${view}: desktop axe automated A/AA rules`, () => scan(page));
  }
  await context.close();

  if (launched.name === "chromium" || launched.name === "webkit") {
    const label = launched.name === "chromium" ? "Android Pixel 7" : "iOS iPhone 13";
    const profile = devices[launched.name === "chromium" ? "Pixel 7" : "iPhone 13"];
    const mobile = await browser.newContext({ ...profile });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(server.url, { waitUntil: "networkidle" });
    await mobilePage.getByRole("button", { name: "Mes listes", exact: true }).click();
    await check(`${label}: emulated touch form workflow`, async () => {
      await mobilePage.locator("#handle").fill("qa_emulated");
      await mobilePage.getByRole("button", { name: "Ajouter à ma liste", exact: true }).tap();
      await expect(mobilePage.locator(".account-id strong").first()).toHaveText("@qa_emulated");
      await reflow(mobilePage);
    });
    await mobile.close();
  }
} catch (error) {
  checks.push({ name: "environment or browser setup", result: "FAIL", error: error.stack });
} finally {
  if (browser) await browser.close();
  await server.close();
}
for (const result of checks) console.log(JSON.stringify(result));
const failures = checks.filter(check => check.result === "FAIL");
console.log(`PWA quality: ${checks.length - failures.length}/${checks.length} checks passed. Automated checks do not establish full WCAG 2.2 AA conformance or physical-device acceptance.`);
if (failures.length) process.exitCode = 1;
