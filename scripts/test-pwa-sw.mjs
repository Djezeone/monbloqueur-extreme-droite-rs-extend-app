import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../pwa/sw.js", import.meta.url), "utf8");
const scope = "https://fil-clair.example/pwa/";
const assets = ["", "index.html", "styles.css", "app.js", "core.js", "privacy.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];

function worker({ networkResponse } = {}) {
  const handlers = new Map();
  const stores = new Map();
  const network = [];
  const keyOf = input => new URL(typeof input === "string" ? input : input.url, scope).href;
  const fetch = async input => {
    const request = typeof input === "string" ? new Request(new URL(input, scope)) : input;
    network.push(request);
    return networkResponse ? networkResponse(request) : new Response("shell", { headers: { "content-type": "text/plain" } });
  };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(inputs) {
          const entries = await Promise.all(inputs.map(async input => {
            const response = await fetch(typeof input === "string" ? new Request(new URL(input, scope)) : input);
            if (!response.ok || response.redirected) throw TypeError("Cache.addAll rejected a failed or redirected fetch.");
            return [keyOf(input), response];
          }));
          for (const [key, response] of entries) store.set(key, response);
        },
        async put(input, response) { store.set(keyOf(input), response); },
        async match(input) { return store.get(keyOf(input))?.clone(); },
        async keys() { return [...store.keys()].map(url => new Request(url)); }
      };
    },
    async match(input) {
      for (const store of stores.values()) if (store.has(keyOf(input))) return store.get(keyOf(input)).clone();
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); }
  };
  const self = {
    location: new URL("sw.js", scope),
    registration: { scope },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener: (name, handler) => handlers.set(name, handler)
  };
  runInNewContext(source, { self, caches, fetch, URL, Request, Response });
  return {
    network,
    stores,
    async install() {
      let pending;
      handlers.get("install")({ waitUntil: work => { pending = work; } });
      await pending;
    },
    async activate() {
      let pending;
      handlers.get("activate")({ waitUntil: work => { pending = work; } });
      await pending;
    },
    async fetch(path, { navigation = false, ...options } = {}) {
      const request = new Request(new URL(path, scope), options);
      if (navigation) Object.defineProperty(request, "mode", { value: "navigate" });
      let intercepted = false;
      let response;
      handlers.get("fetch")({ request, respondWith: work => { intercepted = true; response = work; } });
      return { intercepted, response: await response };
    }
  };
}

test("only exact shell URLs are precached with credentials omitted", async () => {
  const sw = worker();
  await sw.install();
  const cached = [...sw.stores.values()].flatMap(store => [...store.keys()]);
  assert.deepEqual(cached.sort(), assets.map(path => new URL(path, scope).href).sort());
  assert.ok(sw.network.every(request => request.credentials === "omit"));
});

test("OAuth callbacks, token URLs, API replies and foreign resources bypass the worker", async () => {
  const sw = worker();
  await sw.install();
  for (const path of [
    "oauth/callback?code=synthetic-code&state=synthetic-state",
    "?access_token=synthetic-token", "index.html?code=synthetic-code",
    "styles.css?token=synthetic-token", "api/profile", "auth/session",
    "connectors/bluesky.js", "unrelated.json", "../private.html",
    "https://foreign.example/styles.css"
  ]) assert.equal((await sw.fetch(path)).intercepted, false, path);
});

test("authenticated requests and writes bypass even shell URLs", async () => {
  const sw = worker();
  await sw.install();
  for (const options of [
    { headers: { Authorization: "Bearer synthetic-token" } },
    { headers: { Cookie: "synthetic-session=true" } },
    { credentials: "include" },
    { method: "POST", body: "synthetic-only" }
  ]) assert.equal((await sw.fetch("index.html", options)).intercepted, false);
});

test("browser navigations may load the public cached shell with include credentials", async () => {
  const sw = worker();
  await sw.install();
  const result = await sw.fetch("", { navigation: true, credentials: "include" });
  assert.equal(result.intercepted, true);
  assert.equal(await result.response.text(), "shell");
  assert.equal((await sw.fetch("oauth/callback?code=synthetic", { navigation: true, credentials: "include" })).intercepted, false);
});

test("installed shell requests are served without a runtime network write", async () => {
  const sw = worker();
  await sw.install();
  const count = sw.network.length;
  for (const path of assets) {
    const { intercepted, response } = await sw.fetch(path);
    assert.equal(intercepted, true, path);
    assert.equal(await response.text(), "shell", path);
  }
  assert.equal(sw.network.length, count);
});

test("a redirect while installing cannot persist a sign-in response", async () => {
  const sw = worker({ networkResponse: () => Response.redirect("https://fil-clair.example/login") });
  await assert.rejects(() => sw.install());
  assert.ok([...sw.stores.values()].every(store => store.size === 0));
});

test("activation purges the old permissive cache and preserves unrelated app caches", async () => {
  const sw = worker();
  sw.stores.set("fil-clair-shell-v2", new Map([[scope + "oauth/callback?code=synthetic", new Response("synthetic private reply")]]));
  sw.stores.set("unrelated-app", new Map());
  await sw.install();
  await sw.activate();
  assert.equal(sw.stores.has("fil-clair-shell-v2"), false);
  assert.equal(sw.stores.has("unrelated-app"), true);
  assert.ok([...sw.stores.keys()].some(key => key.startsWith("fil-clair-")));
});

test("a missing shell entry is fetched without persisting the network reply", async () => {
  const sw = worker();
  await sw.install();
  const store = [...sw.stores.values()][0];
  const key = new URL("app.js", scope).href;
  store.delete(key);
  const count = sw.network.length;
  const result = await sw.fetch("app.js");
  assert.equal(await result.response.text(), "shell");
  assert.equal(sw.network.length, count + 1);
  assert.equal(store.has(key), false);
});
