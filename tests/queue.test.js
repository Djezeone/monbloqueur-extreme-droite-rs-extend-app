import { test } from "node:test";
import assert from "node:assert/strict";
import { createRunner } from "../extension/runner.js";
const accounts = [
  { id: "11", username: "CompteTest_A" },
  { id: "12", username: "CompteTest_B" },
];
function fixture() {
  const local = {},
    alarms = new Map(),
    tabs = new Map(),
    createdTabs = [];
  const currentWindow = { id: 1, type: "normal", focused: true };
  let id = 0;
  const api = {
    storage: {
      local: {
        get: async (keys) =>
          Object.fromEntries(
            (Array.isArray(keys) ? keys : [keys]).map((key) => [
              key,
              structuredClone(local[key]),
            ]),
          ),
        set: async (value) => Object.assign(local, structuredClone(value)),
      },
    },
    alarms: {
      create: async (name, options) => alarms.set(name, options),
      clear: async (name) => alarms.delete(name),
    },
    tabs: {
      create: async (options) => {
        createdTabs.push(options);
        const tab = { id: ++id, ...options, status: "complete", windowId: 1 };
        tabs.set(id, tab);
        return tab;
      },
      get: async (id) => {
        if (!tabs.has(id)) throw Error("closed");
        return tabs.get(id);
      },
      remove: async (id) => tabs.delete(id),
      update: async (id, change) => {
        if (!tabs.has(id)) throw Error("closed");
        Object.assign(tabs.get(id), change);
        return tabs.get(id);
      },
      sendMessage: async (id, msg) => {
        f.sent = msg;
        return { accepted: true };
      },
    },
    windows: {
      create: async () => {
        throw Error("Ne doit pas créer une fenêtre");
      },
      update: async (id, change) => Object.assign(currentWindow, change),
    },
  };
  const f = {
    local,
    alarms,
    tabs,
    createdTabs,
    sent: null,
    fetcher: async () =>
      new Response(
        JSON.stringify({ schemaVersion: 1, version: "test", accounts }),
      ),
  };
  f.runner = createRunner(
    api,
    { listUrl: "https://list.example/list.json" },
    (...args) => f.fetcher(...args),
    () => {},
  );
  f.result = (type, data = {}, tabId = local.job.tabId) =>
    f.runner.dispatch(
      { type, jobId: local.job.id, attempt: local.job.attempt, ...data },
      { tab: { id: tabId }, frameId: 0 },
    );
  f.begin = async () => {
    await f.runner.dispatch({ type: "start" });
    await f.runner.tick();
    await f.result("sessionResult", { owner: "CompteTest" });
  };
  return f;
}

test("un clic ouvre un seul onglet sans le rendre actif", async () => {
  const f = fixture();
  await f.begin();
  assert.equal(f.local.job.phase, "blocking");
  assert.equal(f.sent.type, "block");
  assert.equal(f.sent.account.username, "CompteTest_A");
  assert.equal(f.local.job.owner, "CompteTest");
  assert.deepEqual(f.createdTabs, [
    { url: "https://x.com/home", active: false },
  ]);
  assert.equal(f.tabs.get(f.local.job.tabId).muted, true);
  assert.equal(f.tabs.get(f.local.job.tabId).autoDiscardable, false);
});
test("succès et compte déjà bloqué comptent sans jamais débloquer", async () => {
  const f = fixture();
  await f.begin();
  await f.result("blockResult", { outcome: "blocked" });
  f.local.job.nextAt = 0;
  await f.runner.tick();
  await f.result("blockResult", { outcome: "already" });
  assert.equal(f.local.job.status, "done");
  assert.equal(f.local.job.confirmed, 2);
  assert.equal(f.tabs.size, 0);
});
test("un compte indisponible est conservé dans le bilan et les suivants continuent", async () => {
  const f = fixture();
  await f.begin();
  await f.result("blockResult", { outcome: "unavailable" });
  assert.equal(f.local.job.index, 1);
  assert.equal(f.local.job.confirmed, 0);
  assert.equal(f.local.job.failed.length, 1);
});
test("refuse les résultats venant d’un autre onglet ou d’une tentative ancienne", async () => {
  const f = fixture();
  await f.begin();
  await f.result("blockResult", { outcome: "blocked" }, 999);
  assert.equal(f.local.job.index, 0);
  await f.result("blockResult", { outcome: "blocked", attempt: "old" });
  assert.equal(f.local.job.index, 0);
});
test("erreur de X met en pause et un clic reprend sans perdre la progression", async () => {
  const f = fixture();
  await f.begin();
  await f.result("blockResult", {
    outcome: "error",
    error: "Vérification X nécessaire",
  });
  assert.equal(f.local.job.status, "paused");
  await f.runner.dispatch({ type: "start" });
  await f.runner.tick();
  await f.result("sessionResult", { owner: "CompteTest" });
  assert.equal(f.local.job.index, 0);
  assert.equal(f.local.job.phase, "blocking");
  assert.equal(f.createdTabs.length, 1);
});
test("un changement de compte X bloque la reprise", async () => {
  const f = fixture();
  await f.begin();
  await f.result("blockResult", { outcome: "error" });
  await f.runner.dispatch({ type: "start" });
  await f.runner.tick();
  await f.result("sessionResult", { owner: "AutreCompte" });
  assert.equal(f.local.job.status, "paused");
});
test("le redémarrage de Chrome suspend et l’arrêt ferme seulement l’onglet de travail", async () => {
  const f = fixture();
  await f.begin();
  await f.runner.startup();
  assert.equal(f.local.job.status, "paused");
  await f.runner.dispatch({ type: "cancel" });
  assert.equal(f.local.job.status, "cancelled");
  assert.equal(f.tabs.size, 0);
});
test("une liste invalide ou inaccessible ne lance aucun blocage", async () => {
  const f = fixture();
  f.fetcher = async () => new Response("invalid");
  await assert.rejects(f.runner.dispatch({ type: "start" }));
  assert.equal(f.tabs.size, 0);
});
test("une réponse perdue expire et suspend la file", async () => {
  const f = fixture();
  await f.begin();
  f.local.job.deadline = 0;
  await f.runner.tick();
  assert.equal(f.local.job.status, "paused");
  assert.equal(f.local.job.index, 0);
});
test("le signal du contenu permet de traiter avant le chargement complet", async () => {
  const f = fixture();
  await f.runner.dispatch({ type: "start" });
  const id = f.local.job.tabId;
  f.tabs.get(id).status = "loading";
  await f.runner.dispatch(
    { type: "ready" },
    { tab: { id }, frameId: 0, url: "https://x.com/CompteTest_A" },
  );
  assert.equal(f.local.job.phase, "sessionLoading");
  await f.runner.dispatch(
    { type: "ready" },
    { tab: { id }, frameId: 0, url: "https://x.com/home" },
  );
  assert.equal(f.local.job.phase, "inspecting");
});
test("la pause entre profils est réduite à 250 ms", async () => {
  const f = fixture();
  await f.begin();
  const before = Date.now();
  await f.result("blockResult", { outcome: "blocked" });
  assert.ok(f.local.job.nextAt - before <= 300);
});
test("l’onglet X est activé seulement sur demande en cas de pause", async () => {
  const f = fixture();
  await f.begin();
  const id = f.local.job.tabId;
  await f.runner.dispatch({ type: "inspect" });
  assert.equal(f.tabs.get(id).active, false);
  await f.result("blockResult", { outcome: "error" });
  await f.runner.dispatch({ type: "inspect" });
  assert.equal(f.tabs.get(id).active, true);
  await f.runner.dispatch({ type: "start" });
  assert.equal(f.createdTabs.length, 1);
  assert.equal(f.local.job.tabId, id);
});
