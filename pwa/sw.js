const CACHE = "fil-clair-shell-v5";
// Only this public application shell may enter Cache Storage. OAuth callbacks,
// queries, API replies and future connector resources must bypass this worker.
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./core.js", "./flow-core.js", "./platforms.js", "./flows.js", "./actions.js", "./effects.js", "./register-view.js", "./privacy.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];
const SHELL = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
self.addEventListener("install", event => {
  const requests = [...SHELL].map(url => new Request(url, {
    credentials: "omit", redirect: "error", cache: "no-store"
  }));
  // Native addAll is atomic and rejects failed or redirected asset fetches.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(requests)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("fil-clair-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.search
      // Browser navigations use include credentials; they may read the public
      // precache, but their network responses are never written to it.
      || (request.credentials === "include" && request.mode !== "navigate") || request.headers.has("authorization")
      || request.headers.has("cookie") || !SHELL.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request))
    .then(hit => hit || fetch(request))
    .catch(() => Response.error()));
});
