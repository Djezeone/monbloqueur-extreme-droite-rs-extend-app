import { accounts, sitePage } from "../tests/fixtures/site.mjs";
import { chromium, expect } from "@playwright/test";
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
const sendTestMessage=chrome.tabs.sendMessage.bind(chrome.tabs);
chrome.tabs.sendMessage=async(id,message)=>{
 if(['navigate','block'].includes(message.type)){
  const {testCommands=[]}=await chrome.storage.session.get('testCommands');
  testCommands.push({type:message.type,jobId:message.jobId,username:message.account.username});
  await chrome.storage.session.set({testCommands});
 }
 return sendTestMessage(id,message);
};
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
let activeOwner = "CompteDeTest";
let fixtureOptions = {};
const blockedByOwner = new Map();
context.on("page", (page) =>
  page.on("pageerror", (error) => errors.push(error.message)),
);
await context.route("https://pbs.twimg.com/**", async (route) =>
  route.fulfill({
    contentType: "image/png",
    body: await readFile(new URL("extension/icons/icon16.png", root)),
  }),
);

await context.route("https://x.com/**", async (route) => {
  const url = new URL(route.request().url());
  if (route.request().resourceType() === "document") documents++;
  if (url.pathname === "/__test__/blocked") {
    const owner = url.searchParams.get("owner");
    const username = url.searchParams.get("username");
    blocked.push({ owner, username });
    if (!blockedByOwner.has(owner)) blockedByOwner.set(owner, new Set());
    blockedByOwner.get(owner).add(username);
    return route.fulfill({ body: "ok" });
  }
  return route.fulfill({
    contentType: "text/html; charset=utf-8",
    body: sitePage(url.href, activeOwner, {
      ...fixtureOptions,
      blocked: [...(blockedByOwner.get(activeOwner) || [])],
    }),
  });
});
try {
  const worker =
    context.serviceWorkers()[0] ||
    (await context.waitForEvent("serviceworker"));
  const id = new URL(worker.url()).host;
  let page = await context.newPage();
  await page.goto(`chrome-extension://${id}/popup.html`);
  await page.getByText("3 comptes dans la liste.", { exact: true }).waitFor();
  const readJob = () =>
    worker.evaluate(async () => (await chrome.storage.local.get("job")).job);
  const navigateCommands = (job) =>
    worker.evaluate(async (jobId) => {
      const { testCommands = [] } =
        await chrome.storage.session.get("testCommands");
      return testCommands
        .filter(
          (command) => command.jobId === jobId && command.type === "navigate",
        )
        .map((command) => command.username);
    }, job.id);
  const run = async (button = "start", status = "done") => {
    const previous = (await readJob())?.id;
    const before = documents;
    const started = Date.now();
    if (button === "rescan" && !(await page.locator("#rescan").isVisible()))
      await page.locator("summary").click();
    await page.locator("#" + button).click();
    await expect
      .poll(
        async () => {
          const job = await readJob();
          return job?.id !== previous && job?.status === status;
        },
        { timeout: 30000, intervals: [50, 100, 200] },
      )
      .toBe(true);
    const job = await readJob();
    if (status === "done") {
      assert.equal(
        documents - before,
        1,
        "Un seul chargement complet de X pour tout le lot",
      );
      assert.equal(
        await worker.evaluate(async (tabId) => {
          try {
            await chrome.tabs.get(tabId);
            return false;
          } catch {
            return true;
          }
        }, job.tabId),
        true,
        "L’onglet de travail doit se fermer",
      );
      await expect(page.locator("#start")).toBeEnabled();
    }
    return { job, duration: Date.now() - started };
  };
  const first = await run();
  const { job } = first;
  assert.equal(job.confirmed, 2);
  assert.equal(job.failed.length, 1);
  assert.equal(job.status, "done");
  assert.equal(job.owner, "CompteDeTest");
  assert.match(job.ownerKey, /^[a-f0-9]{64}$/);
  assert.equal(job.created, 1);
  assert.equal(job.already, 1);
  assert.equal(job.cached, 0);
  await expect.poll(() => blocked.length).toBe(1);
  assert.deepEqual(blocked, [
    { owner: "CompteDeTest", username: "CompteTest_A" },
  ]);
  assert.deepEqual(await navigateCommands(job), [
    "CompteTest_A",
    "CompteTest_B",
    "CompteTest_C",
  ]);
  assert.equal(
    documents,
    1,
    "Un seul chargement complet de X pour tout le lot",
  );
  const elapsed = first.duration;
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
  page = await context.newPage();
  await page.goto(`chrome-extension://${id}/popup.html`);
  await expect(page.locator("#owner")).toContainText("@CompteDeTest");
  assert.equal((await readJob()).id, job.id);
  await mkdir(new URL("verification/", root), { recursive: true });
  await page.screenshot({
    path: fileURLToPath(
      new URL("verification/interface-minimaliste.png", root),
    ),
    fullPage: true,
  });
  // Le cache est volontairement une mémoire locale, pas une lecture de l’état actuel de X.
  // On simule un déblocage manuel : seul « Tout revérifier » doit repasser sur ce profil.
  blockedByOwner.get(activeOwner).delete("CompteTest_A");
  const cached = await run();
  assert.equal(cached.job.cached, 2);
  assert.equal(cached.job.created, 0);
  assert.equal(cached.job.already, 0);
  assert.equal(cached.job.failed.length, 1);
  assert.deepEqual(await navigateCommands(cached.job), ["CompteTest_C"]);
  assert.equal(blocked.length, 1);
  const rescan = await run("rescan");
  assert.equal(rescan.job.force, true);
  assert.equal(rescan.job.cached, 0);
  assert.equal(rescan.job.created, 1);
  assert.equal(rescan.job.already, 1);
  assert.deepEqual(await navigateCommands(rescan.job), [
    "CompteTest_A",
    "CompteTest_B",
    "CompteTest_C",
  ]);
  await expect.poll(() => blocked.length).toBe(2);
  // Changer de compte ne doit jamais réutiliser le cache du précédent.
  activeOwner = "AutreCompte";
  const other = await run();
  assert.equal(other.job.owner, activeOwner);
  assert.match(other.job.ownerKey, /^[a-f0-9]{64}$/);
  assert.notEqual(other.job.ownerKey, job.ownerKey);
  assert.equal(other.job.cached, 0);
  assert.equal(other.job.created, 1);
  assert.equal(other.job.already, 1);
  await expect.poll(() => blocked.length).toBe(3);
  const history = await worker.evaluate(
    async () =>
      (await chrome.storage.local.get("processedHistory")).processedHistory,
  );
  assert.deepEqual(
    new Set(history.map((row) => row.username)),
    new Set(["CompteDeTest", "AutreCompte"]),
  );
  assert.ok(history.every((row) => row.ids.length === 2));
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
  const invalid = await run("start", "paused");
  assert.equal(invalid.job.confirmed, 0);
  await expect(page.locator("#status")).toContainText("vérifier l’identité");
  assert.equal(blocked.length, 3);
  await page.getByRole("button", { name: "Vérifier X", exact: true }).click();
  // A DOM click does not await the background handler's asynchronous tab API.
  // Observe the exact paused job's tab; a permanent activation failure must fail.
  await expect
    .poll(() => worker.evaluate(async tabId => (await chrome.tabs.get(tabId)).active, invalid.job.tabId))
    .toBe(true);
  await page.getByRole("button", { name: "Arrêter", exact: true }).click();
  await page
    .getByText("Arrêté. Les blocages déjà faits restent actifs.", {
      exact: true,
    })
    .waitFor();
  assert.equal((await readJob()).status, "cancelled");
  fixtureOptions = {
    profileIds: { CompteTest_A: "999" },
    articleFollowIds: { CompteTest_A: "11" },
  };
  await worker.evaluate(async () =>
    chrome.storage.session.set({
      testList: {
        schemaVersion: 1,
        version: "IDENTITE-ARTICLE",
        accounts: [{ id: "11", username: "CompteTest_A" }],
      },
    }),
  );
  const article = await run("rescan", "paused");
  assert.equal(article.job.confirmed, 0);
  await expect(page.locator("#status")).toContainText("vérifier l’identité");
  assert.equal(
    blocked.length,
    3,
    "Un identifiant présent dans un article ne valide pas le profil",
  );
  await page.locator("#cancel").click();
  await expect.poll(async () => (await readJob()).status).toBe("cancelled");
  // X n’affiche pas toujours l’identifiant numérique sur les profils déjà bloqués.
  // Ce profil doit être sauté sans action et sans certifier l’ID dans l’historique.
  activeOwner = "CompteSansCache";
  fixtureOptions = { genericUnblockHandles: ["CompteTest_B"] };
  await worker.evaluate(async () =>
    chrome.storage.session.set({
      testList: {
        schemaVersion: 1,
        version: "DEJA-BLOQUE-SANS-ID",
        accounts: [{ id: "12", username: "CompteTest_B" }],
      },
    }),
  );
  const generic = await run();
  assert.equal(generic.job.owner, activeOwner);
  assert.equal(generic.job.confirmed, 1);
  assert.equal(generic.job.already, 1);
  assert.equal(generic.job.created, 0);
  assert.equal(generic.job.cached, 0);
  assert.equal(generic.job.failed.length, 0);
  assert.deepEqual(await navigateCommands(generic.job), ["CompteTest_B"]);
  assert.equal(blocked.length, 3);
  const genericHistory = await worker.evaluate(
    async () =>
      (await chrome.storage.local.get("processedHistory")).processedHistory,
  );
  assert.ok(
    !genericHistory.some(
      (row) =>
        row.key === generic.job.ownerKey || row.username === activeOwner,
    ),
    "Un profil bloqué sans identifiant confirmé ne doit pas alimenter le cache",
  );
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
        cachedBatchDurationMs: cached.duration,
        rescanDurationMs: rescan.duration,
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
          "identité locale cloisonnée par compte connecté",
          "profil valide sans publication traité correctement",
          "second passage : deux comptes confirmés sautés sans navigation",
          "Tout revérifier réapplique un blocage retiré manuellement",
          "autre compte X : aucun cache partagé",
          "identifiant trouvé dans un article refusé comme identité du profil",
          "profil déjà bloqué sans identifiant numérique sauté sans action et sans cache",
        ],
        result: "21 contrôles réussis",
      },
      null,
      2,
    ),
  );
  console.log(
    "21 contrôles navigateur réussis. Durée du lot simulé : " +
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
