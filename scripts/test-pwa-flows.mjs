import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { devices, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { servePwa, launchPwaBrowser, waitForShell } from "./pwa-test-utils.mjs";
import { newState, parseBackup } from "../pwa/core.js";

const server = await servePwa();
const temp = await mkdtemp(join(tmpdir(), "fil-clair-flows-"));
const checks = [];
let browser;
async function check(name, work) {
  await work(); checks.push({ name, result:"PASS" });
}
async function setup(page, services = []) {
  await page.getByRole("button", { name:"Choisir mes services", exact:true }).click();
  for (const service of services) await page.locator(`#flow-platforms input[value="${service}"]`).check();
  await page.locator("#flow-next").click();
  await expect(page.locator("#flow-step-heading")).toContainText("moins voir");
  await page.locator("#flow-next").click();
  await page.locator("#flow-finish").click();
  await expect(page.locator("#flow-setup")).toBeHidden();
}
async function add(page, platform, category, control, target) {
  await page.locator("#flow-platform").selectOption(platform);
  await page.locator("#flow-category").selectOption(category);
  await page.locator("#flow-control").selectOption(control);
  await page.locator("#flow-target").fill(target);
  await page.getByRole("button", { name:"Ajouter ce choix", exact:true }).click();
}
async function bounds(page) {
  const report = await page.evaluate(() => ({
    viewport:innerWidth, width:document.documentElement.scrollWidth,
    offenders:[...document.querySelectorAll("body *")].filter(element => {
      const box = element.getBoundingClientRect(); return box.width && box.right > innerWidth + 1;
    }).slice(0, 15).map(element => ({ tag:element.tagName, id:element.id, class:element.className, text:element.textContent.slice(0, 65) }))
  }));
  assert.ok(report.width <= report.viewport + 1, JSON.stringify(report));
}
async function axe(page, phase) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  console.log(JSON.stringify({ phase, axe:result.testEngine.version, violations:result.violations.map(v => ({ id:v.id, targets:v.nodes.map(n => n.target) })), incomplete:result.incomplete.map(v => v.id) }));
  assert.equal(result.violations.length, 0);
}
try {
  const launched = await launchPwaBrowser(); browser = launched.browser;
  console.log(JSON.stringify({ suite:"universal-flows", engine:launched.name, version:launched.version, physicalDevice:false }));
  const context = await browser.newContext({ viewport:{ width:320, height:850 }, acceptDownloads:true });
  const external = [], errors = [];
  context.on("request", request => { if (new URL(request.url()).origin !== server.url) external.push(request.url()); });
  const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message));
  await page.goto(server.url, { waitUntil:"networkidle" });
  await expect(page.getByRole("button", { name:"Choisir mes services", exact:true })).toBeVisible({ timeout:3000 });
  await waitForShell(page);
  await page.getByRole("button", { name:"Mes listes", exact:true }).click();
  await page.locator("#handle").fill("qa_before_flows");
  await page.getByRole("button", { name:"Ajouter à ma liste", exact:true }).click();
  await expect(page.locator("#accounts > li")).toHaveCount(1);
  await page.getByRole("button", { name:"Accueil", exact:true }).click();
  await check("novice: 3 étapes sans compte et zéro service sélectionné", async () => {
    await setup(page);
    const flows = await page.evaluate(() => JSON.parse(localStorage.getItem("fil-clair-v1")).flows);
    assert.equal(flows.setupComplete, true); assert.deepEqual(flows.platforms, []);
    assert.equal(await page.locator("#flow-platform option").count(), 1);
  });
  await check("local: source sensible gardée en texte sans effet fournisseur", async () => {
    await add(page, "local", "sources", "source-avoid", "Préférence sensible <script>aucun code</script>");
    await expect(page.locator("#flow-items > li")).toHaveCount(1);
    await expect(page.locator("#flow-items")).toContainText("Note locale");
    await expect(page.locator("#flow-items script")).toHaveCount(0);
    await expect(page.locator("#flow-items a")).toHaveCount(0);
    await bounds(page);
  });
  await check("choix modifiables: ajouter YouTube conserve la note locale", async () => {
    await page.getByRole("button", { name:"Modifier mes choix", exact:true }).click();
    await page.locator('#flow-platforms input[value="youtube"]').check();
    await axe(page, "services-320");
    await page.locator("#flow-next").click();
    await axe(page, "categories-320");
    await page.locator("#flow-next").click();
    await axe(page, "summary-320");
    await page.locator("#flow-finish").click();
    await expect(page.locator("#flow-items > li")).toHaveCount(1);
  });
  await check("guidé: portée explicite, aide fixe sans cible, aucun faux blocage YouTube", async () => {
    await add(page, "youtube", "topics", "not-interested", "Vidéo synthétique QA");
    await expect(page.locator("#flow-items > li")).toHaveCount(2);
    const row = page.locator("#flow-items > li").last();
    await expect(row).toContainText("À faire");
    assert.match(await row.textContent(), /recommand|signal/i);
    const link = row.getByRole("link");
    assert.match(await link.getAttribute("href"), /^https:\/\/support.google.com\//);
    assert.ok(!(await link.getAttribute("href")).includes("QA"));
    assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
    assert.equal(await page.locator('#flow-control option[value="block"]').count(), 0);
  });
  await check("déclaration guidée: refus puis consentement, jamais confirmation API", async () => {
    const row = page.locator("#flow-items > li").last();
    page.once("dialog", dialog => dialog.dismiss());
    await row.getByRole("button", { name:/Déclarer effectué/ }).click();
    await expect(row).toContainText("À faire");
    page.once("dialog", dialog => dialog.accept());
    await row.getByRole("button", { name:/Déclarer effectué/ }).click();
    await expect(row).toContainText("Déclaré effectué");
    await expect(page.locator("#flow-count")).toContainText("0 confirmation API");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.flowAction), "reset");
    await row.getByRole("button", { name:/Remettre à faire/ }).click();
    await expect(row).toContainText("À faire");
    await expect(page.locator("#notice")).toContainText(/aucune action.*plateforme/i);
  });
  await check("accessibilité du carnet: axe, 320 px, cibles tactiles et agrandissement du texte", async () => {
    await axe(page, "items-320");
    await bounds(page);
    for (const control of await page.locator('#view-flows button:visible, #view-flows input[type="text"]:visible, #view-flows select:visible').all()) {
      const box = await control.boundingBox(); assert.ok(box.height >= 44, JSON.stringify(box));
    }
    // Simulate enlarged user text through CSSOM; do not relax the product CSP.
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
      document.querySelectorAll("input,select,button").forEach(element => { element.style.fontSize = "1rem"; });
    });
    await bounds(page);
    await page.setViewportSize({ width:1280, height:850 }); await axe(page, "items-1280-text200");
    await bounds(page);
  });
  let backupFile;
  await check("export, effacement global et restauration incluent toutes les préférences", async () => {
    await page.getByRole("button", { name:"Réglages", exact:true }).click();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name:"Sauvegarder toutes mes données", exact:true }).click()]);
    backupFile = join(temp, "flows.json"); await download.saveAs(backupFile);
    const saved = JSON.parse(await readFile(backupFile, "utf8")); assert.equal(saved.flows.items.length, 2);
    assert.equal(saved.lists[0].accounts[0].handle, "qa_before_flows", "Onboarding must preserve pre-existing lists");
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name:"Effacer toutes mes données", exact:true }).click();
    await expect(page.locator("#notice")).toContainText(/locaux effacés/);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("fil-clair-v1")).flows?.items.length || 0), 0);
    page.once("dialog", dialog => dialog.accept()); await page.locator("#file").setInputFiles(backupFile);
    await expect(page.locator("#notice")).toContainText("restaurée");
    await page.getByRole("button", { name:"Mes flux", exact:true }).click();
    await expect(page.locator("#flow-workspace")).toBeVisible();
    await expect(page.locator("#flow-setup")).toBeHidden();
    await expect(page.locator("#flow-items > li")).toHaveCount(2);
  });
  await check("import falsifié: aucune preuve API ni modification des préférences", async () => {
    const saved = JSON.parse(await readFile(backupFile, "utf8"));
    saved.flows.items[0].status = "confirmed";
    await page.locator("#file").setInputFiles({ name:"forged.json", mimeType:"application/json", buffer:Buffer.from(JSON.stringify(saved)) });
    await expect(page.locator("#notice")).toContainText(/statut.*invalide/i);
    await expect(page.locator("#flow-items > li")).toHaveCount(2);
  });
  await check("hors ligne: rechargement, guide embarqué et nouvelle note sans réseau", async () => {
    const before = server.requests.length;
    await context.setOffline(true); await page.reload({ waitUntil:"domcontentloaded" });
    await page.getByRole("button", { name:"Mes flux", exact:true }).click();
    await expect(page.locator("#flow-items > li")).toHaveCount(2);
    await add(page, "local", "topics", "topic-more", "Plus de connaissances locales");
    await expect(page.locator("#flow-items > li")).toHaveCount(3);
    assert.equal(server.requests.length, before);
    await context.setOffline(false);
  });
  await check("désélection et retrait: conservation puis oubli local uniquement", async () => {
    await page.getByRole("button", { name:"Modifier mes choix", exact:true }).click();
    await page.locator('#flow-platforms input[value="youtube"]').uncheck();
    await page.locator("#flow-next").click(); await page.locator("#flow-next").click(); await page.locator("#flow-finish").click();
    await expect(page.locator("#flow-items > li")).toHaveCount(3);
    const target = page.locator("#flow-items > li").filter({ hasText:"Vidéo synthétique QA" });
    page.once("dialog", dialog => dialog.accept()); await target.getByRole("button", { name:/Retirer le choix/ }).click();
    await expect(page.locator("#flow-items > li")).toHaveCount(2);
    await expect(page.locator("#notice")).toContainText(/aucune action.*plateforme/i);
  });
  await check("confidentialité: aucun appel externe ni exception JavaScript", async () => {
    assert.deepEqual(external, []); assert.deepEqual(errors, []);
    const urls = await page.evaluate(async () => {
      const result = []; for (const key of await caches.keys()) for (const request of await (await caches.open(key)).keys()) result.push(request.url);
      return result;
    });
    assert.ok(urls.every(url => new URL(url).origin === server.url && !url.includes("QA") && !url.includes("token")));
  });
  await check("concurrence: préférence contre profil, perdant refusé sans écrasement, oracle dans un onglet frais", async () => {
    const stale = await context.newPage(); await stale.goto(server.url, { waitUntil:"networkidle" });
    await stale.getByRole("button", { name:"Mes listes", exact:true }).click();
    await stale.locator("#handle").fill("qa_race_profile");
    await page.locator("#flow-platform").selectOption("local");
    await page.locator("#flow-category").selectOption("sources");
    await page.locator("#flow-control").selectOption("source-avoid");
    await page.locator("#flow-target").fill("Préférence concurrente synthétique");
    const before = await stale.evaluate(() => JSON.parse(localStorage.getItem("fil-clair-v1")));
    await Promise.all([
      stale.getByRole("button", { name:"Ajouter à ma liste", exact:true }).click(),
      page.getByRole("button", { name:"Ajouter ce choix", exact:true }).click()
    ]);
    await expect(stale.locator("#notice")).toContainText(/profil ajouté|conflit/i);
    await expect(page.locator("#notice")).toContainText(/choix ajouté|conflit/i);
    const fresh = await context.newPage(); await fresh.goto(server.url, { waitUntil:"networkidle" });
    const after = await fresh.evaluate(() => JSON.parse(localStorage.getItem("fil-clair-v1")));
    const addedProfile = after.lists[0].accounts.some(account => account.handle === "qa_race_profile");
    const addedFlow = after.flows.items.some(item => item.target === "Préférence concurrente synthétique");
    assert.equal(Number(addedProfile) + Number(addedFlow), 1);
    assert.equal(after.lists[0].accounts.length, before.lists[0].accounts.length + Number(addedProfile));
    assert.equal(after.flows.items.length, before.flows.items.length + Number(addedFlow));
    if (!addedProfile) assert.equal(await stale.locator("#handle").inputValue(), "qa_race_profile");
    if (!addedFlow) assert.equal(await page.locator("#flow-target").inputValue(), "Préférence concurrente synthétique");
    await stale.close(); await fresh.close();
  });
  await context.close();

  for (const blocked of ["storage", "locks", "corrupt"]) {
    await check(`secours ${blocked}: consentement mémoire, aucune écriture persistante, export et recharge sûrs`, async () => {
      const sandbox = await browser.newContext({ acceptDownloads:true });
      const saved = newState(); saved.lists[0].accounts.push({ network:"x", handle:"qa_saved_orig" });
      assert.doesNotThrow(() => parseBackup(JSON.stringify(saved)));
      const initial = blocked === "corrupt" ? '{"version":1,"flows":"corrupt-source"' : JSON.stringify(saved);
      await sandbox.addInitScript(({ kind, initial }) => {
        const originalGet = Storage.prototype.getItem;
        if (originalGet.call(localStorage, "fil-clair-v1") === null) localStorage.setItem("fil-clair-v1", initial);
        window.qaReadPersistent = () => originalGet.call(localStorage, "fil-clair-v1");
        if (kind === "storage") Object.defineProperty(Storage.prototype, "getItem", { value() { throw new DOMException("denied", "SecurityError"); } });
        if (kind === "locks") Object.defineProperty(navigator, "locks", { value:undefined });
        window.qaWrites = 0;
        Object.defineProperty(Storage.prototype, "setItem", { value() { window.qaWrites++; throw Error("Persistent write forbidden in fallback test"); } });
        Object.defineProperty(Storage.prototype, "removeItem", { value() { window.qaWrites++; throw Error("Persistent removal forbidden in fallback test"); } });
        Object.defineProperty(Storage.prototype, "clear", { value() { window.qaWrites++; throw Error("Persistent clear forbidden in fallback test"); } });
      }, { kind:blocked, initial });
      const p = await sandbox.newPage(); await p.goto(server.url, { waitUntil:"networkidle" });
      await p.getByRole("button", { name:"Mes listes", exact:true }).click();
      await p.locator("#handle").fill("qa_not_saved");
      await p.getByRole("button", { name:"Ajouter à ma liste", exact:true }).click();
      await expect(p.locator("#notice")).toContainText(/inaccessible|indisponible|illisibles/);
      assert.equal(await p.locator("#handle").inputValue(), "qa_not_saved");
      assert.equal(await p.evaluate(() => qaReadPersistent()), initial);
      await p.getByRole("button", { name:"Réglages", exact:true }).click();
      p.once("dialog", dialog => dialog.dismiss()); await p.locator("#session-mode").click();
      await expect(p.locator("#session-warning")).toBeHidden();
      p.once("dialog", dialog => dialog.accept()); await p.locator("#session-mode").click();
      await expect(p.locator("#session-warning")).toContainText(/temporaire|mémoire/i);
      await p.getByRole("button", { name:"Accueil", exact:true }).click(); await setup(p);
      await add(p, "local", "sources", "source-avoid", "Note temporaire");
      await expect(p.locator("#flow-items > li")).toHaveCount(1); assert.equal(await p.evaluate(() => qaWrites), 0);
      assert.equal(await p.evaluate(() => qaReadPersistent()), initial);
      await axe(p, "temporary-" + blocked);
      const [download] = await Promise.all([p.waitForEvent("download"), p.locator("#session-export").click()]);
      const path = join(temp, blocked + ".json"); await download.saveAs(path);
      assert.equal(JSON.parse(await readFile(path, "utf8")).flows.items[0].target, "Note temporaire");
      await p.reload({ waitUntil:"networkidle" }); await expect(p.locator("#session-warning")).toBeHidden();
      assert.equal(await p.evaluate(() => qaWrites), 0);
      assert.equal(await p.evaluate(() => qaReadPersistent()), initial); await sandbox.close();
    });
  }
  await check("anciennes listes: aucun bouton de blocage vidéo ou sourdine générique pour YouTube", async () => {
    const isolated = await browser.newContext(); const p = await isolated.newPage();
    await p.goto(server.url, { waitUntil:"networkidle" });
    await p.getByRole("button", { name:"Mes listes", exact:true }).click();
    await p.locator("#network").selectOption("youtube"); await p.locator("#handle").fill("qa_synthetic_channel");
    await p.getByRole("button", { name:"Ajouter à ma liste", exact:true }).click();
    await expect(p.locator("#accounts > li")).toHaveCount(1);
    await expect(p.locator('#accounts button[data-action="blocked"], #accounts button[data-action="muted"]')).toHaveCount(0);
    await isolated.close();
  });
  const profiles = launched.name === "webkit" ? ["iPhone 13", "iPad Pro 11"] : launched.name === "chromium" ? ["Pixel 7"] : [];
  for (const profile of profiles) {
    await check(`${profile}: parcours tactile émulé sans Google ni installation`, async () => {
      const mobile = await browser.newContext(devices[profile]); const p = await mobile.newPage();
      await p.goto(server.url, { waitUntil:"networkidle" }); await setup(p);
      await add(p, "local", "topics", "topic-less", "Sujet synthétique tactile");
      await expect(p.locator("#flow-items > li")).toHaveCount(1); await bounds(p); await mobile.close();
    });
  }
} catch (error) {
  checks.push({ name:"universal flow continuation", result:"FAIL", error:error.stack });
} finally {
  if (browser) await browser.close(); await server.close(); await rm(temp, { recursive:true, force:true });
}
for (const check of checks) console.log(JSON.stringify(check));
console.log(`Universal flows: ${checks.filter(c => c.result === "PASS").length}/${checks.length} checks passed; emulation only, no provider action or full WCAG claim.`);
if (checks.some(c => c.result === "FAIL")) process.exitCode = 1;
