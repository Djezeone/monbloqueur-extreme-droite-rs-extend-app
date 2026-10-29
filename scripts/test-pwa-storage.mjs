import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect } from "@playwright/test";
import { newState } from "../pwa/core.js";
import { servePwa, launchPwaBrowser } from "./pwa-test-utils.mjs";

const server = await servePwa();
const temp = await mkdtemp(join(tmpdir(), "fil-clair-storage-"));
let browser;
try {
  const launched = await launchPwaBrowser();
  browser = launched.browser;
  console.log(`PWA storage engine: ${launched.name} ${launched.version}`);
  const denied = await browser.newContext({ serviceWorkers: "block" });
  try {
    await denied.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Synthetic QA storage denial", "SecurityError"); } });
    });
    const page = await denied.newPage();
    await page.goto(server.url, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Que souhaitez-vous maîtriser dans votre fil ?", exact: true }).waitFor();
    await page.getByRole("button", { name: "Mes listes", exact: true }).click();
    const add = page.getByRole("button", { name: "Ajouter à ma liste", exact: true });
    if (await page.locator("#handle").isEnabled() && await add.isEnabled()) {
      await page.locator("#handle").fill("qa_denied");
      await add.click();
      assert.equal(await page.locator("#handle").inputValue(), "qa_denied");
    }
    await expect(page.locator("#notice")).toContainText(/impossible|stockage|export/i);
    assert.equal(await page.locator("#accounts li").count(), 0);
    console.log("storage SecurityError: app usable, error visible, no false successful mutation PASS");
  } finally { await denied.close(); }

  const state = newState();
  state.lists[0].accounts = [{ network: "x", handle: "qa_existing" }];
  const initial = JSON.stringify(state);
  const quota = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
  try {
    await quota.addInitScript(initial => {
      localStorage.setItem("fil-clair-v1", initial);
      Storage.prototype.setItem = () => { throw new DOMException("Synthetic QA quota", "QuotaExceededError"); };
    }, initial);
    const page = await quota.newPage();
    await page.goto(server.url, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Mes listes", exact: true }).click();
    await page.locator("#handle").fill("qa_rejected");
    await page.getByRole("button", { name: "Ajouter à ma liste", exact: true }).click();
    await expect(page.locator("#notice")).toContainText(/impossible|insuffisant|stockage/i);
    assert.equal(await page.locator("#handle").inputValue(), "qa_rejected");
    assert.equal(await page.locator("#accounts li").count(), 1);
    assert.equal(await page.locator(".account-id strong").textContent(), "@qa_existing");
    assert.equal(await page.evaluate(() => localStorage.getItem("fil-clair-v1")), initial);
    await page.getByRole("button", { name: "Historique", exact: true }).click();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exporter mes données", exact: true }).click()]);
    const path = join(temp, "quota-export.json");
    await download.saveAs(path);
    const exported = JSON.parse(await readFile(path, "utf8"));
    assert.deepEqual(exported.lists[0].accounts, state.lists[0].accounts);
    console.log("storage QuotaExceededError: existing data unchanged and exportable, rejected write absent PASS");
  } finally { await quota.close(); }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await server.close();
  await rm(temp, { recursive: true, force: true });
}
