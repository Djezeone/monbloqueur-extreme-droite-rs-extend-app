import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { servePwa, launchPwaBrowser } from "./pwa-test-utils.mjs";
import { newState, parseBackup, MAX_BACKUP_BYTES } from "../pwa/core.js";

const server = await servePwa();
const temp = await mkdtemp(join(tmpdir(), "fil-clair-recovery-"));
let browser;
try {
  const launched = await launchPwaBrowser();
  browser = launched.browser;
  console.log(`PWA recovery engine: ${launched.name} ${launched.version}`);
  const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
  const corrupt = '{"synthetic-corrupt-startup":';
  await context.addInitScript(raw => localStorage.setItem("fil-clair-v1", raw), corrupt);
  const page = await context.newPage();
  await page.goto(server.url, { waitUntil: "networkidle" });
  assert.match(await page.locator("#notice").textContent(), /corromp|récupér|illisible|invalide/i);
  assert.equal(await page.evaluate(() => localStorage.getItem("fil-clair-v1")), corrupt);
  await page.getByRole("button", { name: "Mes listes", exact: true }).click();
  if (await page.locator("#handle").isEnabled()) {
    await page.locator("#handle").fill("qa_overwrite");
    const add = page.getByRole("button", { name: "Ajouter à ma liste", exact: true });
    if (await add.isEnabled()) await add.click();
  }
  assert.equal(await page.evaluate(() => localStorage.getItem("fil-clair-v1")), corrupt, "Corrupt source must survive any attempted mutation");
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#export-recovery").click()]);
  const path = join(temp, "raw-recovery.txt");
  await download.saveAs(path);
  assert.equal(await readFile(path, "utf8"), corrupt, "Raw recovery must preserve the exact original string");
  assert.equal(await page.evaluate(() => localStorage.getItem("fil-clair-v1")), corrupt);
  await context.close();
  console.log("corrupt startup: visible error, no overwrite after mutation attempt, exact raw source export PASS");

  // Browser storage limits vary. Inject an already-existing valid snapshot to
  // exercise export size independently from this machine's localStorage quota.
  const large = newState();
  const instance = ["a".repeat(63), "b".repeat(63), "c".repeat(63), "d".repeat(60)].join(".");
  const accounts = Array.from({length:5000}, (_, i) => ({network:"mastodon", handle:"qa" + String(i).padStart(78,"0"), instance}));
  for (let i = 0; i < 5; i++) large.lists.push({id:"size-"+i,title:"Synthetic size fixture",accounts});
  const raw = JSON.stringify(large);
  assert.ok(Buffer.byteLength(raw) < MAX_BACKUP_BYTES);
  assert.ok(Buffer.byteLength(JSON.stringify(large,null,2)) > MAX_BACKUP_BYTES, "Fixture must expose pretty-printed backup overflow");
  parseBackup(raw);
  const bounded = await browser.newContext({serviceWorkers:"block",acceptDownloads:true});
  await bounded.addInitScript(raw => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) { return key === "fil-clair-v1" ? raw : original.call(this,key); };
  },raw);
  const backupPage = await bounded.newPage();
  await backupPage.goto(server.url,{waitUntil:"networkidle"});
  await backupPage.getByRole("button",{name:"Historique",exact:true}).click();
  const [largeDownload] = await Promise.all([backupPage.waitForEvent("download"),backupPage.getByRole("button",{name:"Exporter mes données",exact:true}).click()]);
  const largePath = join(temp,"bounded-backup.json");
  await largeDownload.saveAs(largePath);
  const exported = await readFile(largePath,"utf8");
  assert.ok(Buffer.byteLength(exported) <= MAX_BACKUP_BYTES,"A valid state must export within the restore byte limit");
  assert.equal(parseBackup(exported).lists[1].accounts.length,5000);
  await bounded.close();
  console.log("near-limit valid state: compact export within 10MB and strict restore PASS");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await server.close();
  await rm(temp, { recursive: true, force: true });
}
