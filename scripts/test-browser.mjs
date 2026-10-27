import { accounts, sitePage } from "../tests/fixtures/site.mjs";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { cp, mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url),
  scratch = new URL(
    `../../../work/browser-test-${Date.now()}/`,
    import.meta.url,
  );
const fixture = new URL("extension/", scratch),
  profile = new URL("profile/", scratch);
await mkdir(scratch, { recursive: true });
await cp(new URL("extension/", root), fixture, { recursive: true });
const original = await readFile(new URL("background.js", fixture), "utf8");
await writeFile(
  new URL("background.js", fixture),
  `
const createTestTab=chrome.tabs.create.bind(chrome.tabs);
chrome.windows.create=async()=>{throw Error('Le traitement ne doit pas ouvrir de fenêtre');};
chrome.tabs.create=async options=>{
 const tab=await createTestTab({...options,url:'about:blank'});
 await new Promise(resolve=>setTimeout(resolve,500));
 const state=await chrome.tabs.get(tab.id);
 const {testTabs=[]}=await chrome.storage.session.get('testTabs');
 testTabs.push({id:tab.id,windowId:state.windowId,active:state.active,requested:options});
 await chrome.storage.session.set({testTabs});
 return chrome.tabs.update(tab.id,{url:options.url});
};
globalThis.fetch=async()=>{
 const {testList}=await chrome.storage.session.get('testList');
 return new Response(JSON.stringify(testList||{schemaVersion:1,version:'DEMONSTRATION',accounts:${JSON.stringify(accounts)}}));
};
${original}`,
);
const path = fileURLToPath(fixture);
const channel = process.env.TEST_BROWSER_CHANNEL || "chromium";
const headed = process.env.TEST_BROWSER_HEADED === "1";
const context = await chromium.launchPersistentContext(fileURLToPath(profile), {
  channel,
  headless: !headed,
  ignoreDefaultArgs: ["--disable-extensions"],
  viewport: headed ? null : { width: 330, height: 650 },
  args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`],
});
const blocked = [],
  errors = [];
let documents = 0;

await context.route("https://x.com/**", async (route) => {
  const url = new URL(route.request().url());
  if (route.request().resourceType() === "document") documents++;
  if (url.pathname === "/__test__/blocked") {
    blocked.push(url.searchParams.get("username"));
    return route.fulfill({ body: "ok" });
  }
  return route.fulfill({
    contentType: "text/html; charset=utf-8",
    body: sitePage(url.href),
  });
});
try {
  const worker =
    context.serviceWorkers()[0] ||
    (await context.waitForEvent("serviceworker"));
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`chrome-extension://${id}/popup.html`);
  await page.getByText("3 comptes dans la liste.", { exact: true }).waitFor();
  const started = Date.now();
  await page
    .getByRole("button", { name: "Bloquer l’Extrême-droite", exact: true })
    .click();
  await page
    .getByText("2 compte(s) bloqué(s), 1 compte(s) indisponible(s).", {
      exact: true,
    })
    .waitFor({ timeout: 30000 });
  const job = await worker.evaluate(
    async () => (await chrome.storage.local.get("job")).job,
  );
  assert.equal(job.confirmed, 2);
  assert.equal(job.failed.length, 1);
  assert.equal(job.status, "done");
  assert.deepEqual(blocked, ["CompteTest_A"]);
  assert.equal(
    documents,
    1,
    "Un seul chargement complet de X pour tout le lot",
  );
  const elapsed = Date.now() - started;
  const { testTabs } = await worker.evaluate(
    async () => await chrome.storage.session.get("testTabs"),
  );
  assert.equal(testTabs.length, 1);
  assert.equal(testTabs[0].active, false);
  assert.equal(testTabs[0].requested.active, false);
  const popupWindow = await worker.evaluate(
    async () =>
      (await chrome.tabs.query({ url: chrome.runtime.getURL("popup.html") }))[0]
        .windowId,
  );
  assert.equal(testTabs[0].windowId, popupWindow);

  assert.equal(
    context.pages().filter((p) => p.url().startsWith("https://x.com/")).length,
    0,
  );
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(`chrome-extension://${id}/popup.html`);
  await reopened
    .getByText("2 compte(s) bloqué(s), 1 compte(s) indisponible(s).", {
      exact: true,
    })
    .waitFor();
  await mkdir(new URL("verification/", root), { recursive: true });
  await reopened.screenshot({
    path: fileURLToPath(
      new URL("verification/interface-minimaliste.png", root),
    ),
    fullPage: true,
  });
  // Une identité incohérente doit suspendre, sans cliquer sur Bloquer.
  await worker.evaluate(async () => {
    await chrome.storage.session.set({
      testList: {
        schemaVersion: 1,
        version: "IDENTITE-INCORRECTE",
        accounts: [{ id: "999", username: "CompteTest_A" }],
      },
    });
  });
  await reopened
    .getByRole("button", { name: "Bloquer l’Extrême-droite", exact: true })
    .click();
  await reopened
    .getByText(
      "X ne permet pas de vérifier l’identité de ce profil. Le blocage est en pause.",
      { exact: true },
    )
    .waitFor({ timeout: 15000 });
  assert.deepEqual(blocked, ["CompteTest_A"]);
  await reopened
    .getByRole("button", { name: "Vérifier X", exact: true })
    .click();
  assert.equal(
    await worker.evaluate(async () => {
      const { job } = await chrome.storage.local.get("job");
      return (await chrome.tabs.get(job.tabId)).active;
    }),
    true,
  );
  await reopened.getByRole("button", { name: "Arrêter", exact: true }).click();
  await reopened
    .getByText("Arrêté. Les blocages déjà faits restent actifs.", {
      exact: true,
    })
    .waitFor();
  assert.deepEqual(errors, []);
  await writeFile(
    new URL(`verification/${channel}.json`, root),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        browser: channel,
        version: context.browser()?.version(),
        headed,
        network: "Pages X et liste simulées, aucun compte réel modifié",
        batchDurationMs: elapsed,
        checks: [
          "manifeste MV3 et scripts de contenu chargés",
          "un clic sur le bouton principal",
          "détection du compte déjà connecté",
          "menu de profil et confirmation de blocage",
          "compte déjà bloqué ignoré sans déblocage",
          "compte indisponible conservé au bilan",
          "onglet de travail fermé à la fin",
          "progression conservée après fermeture du popup",
          "identifiant incorrect : arrêt sans blocage",
          "bouton Arrêter et aucune erreur JavaScript",
          "un seul onglet dans la fenêtre courante pour toute la liste",
          "onglet créé sans activation et aucune fenêtre popup",
          "bouton Vérifier X réservé à une opération en pause",
          "navigation interne : un seul chargement complet pour tout le lot",
        ],
        result: "14 contrôles réussis",
      },
      null,
      2,
    ),
  );
  console.log(
    "14 contrôles navigateur réussis. Durée du lot simulé : " +
      elapsed +
      " ms. Capture : verification/interface-minimaliste.png",
  );
} catch (error) {
  const worker = context.serviceWorkers()[0];
  console.error(
    "État au moment de l’échec :",
    await worker?.evaluate(async () => await chrome.storage.local.get("job")),
  );
  for (const page of context.pages())
    console.error(
      "Page :",
      page.url(),
      (
        await page
          .locator("body")
          .innerText()
          .catch(() => "")
      ).slice(0, 1800),
    );
  throw error;
} finally {
  await context.close();
}
