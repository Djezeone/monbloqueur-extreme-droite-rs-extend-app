const CACHE = "fil-clair-shell-v8";
// Only this public application shell may enter Cache Storage. OAuth callbacks,
// queries, API replies and future connector resources must bypass this worker.
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./core.js", "./flow-core.js", "./platforms.js", "./flows.js", "./actions.js", "./effects.js", "./register-view.js", "./guided-core.js", "./guided.js", "./help-data.js", "./help.js", "./support-config.js", "./persistence.js", "./privacy.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];
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
  // Native styles/images use include credentials even without an authenticated
  // fetch. They may read only the exact public precache; runtime replies are
  // never persisted. Explicit fetches, auth headers and private URLs still bypass.
  const publicSubresource = request.mode === "no-cors" &&
    ((request.destination === "style" && url.pathname.endsWith("/styles.css")) ||
     (request.destination === "image" && /\/(?:icon\.svg|icon-192\.png|icon-512\.png)$/.test(url.pathname)));
  if (request.method !== "GET" || url.origin !== self.location.origin || url.search
      // Browser navigations use include credentials; they may read the public
      // precache, but their network responses are never written to it.
      || (request.credentials === "include" && request.mode !== "navigate" && !publicSubresource) || request.headers.has("authorization")
      || request.headers.has("cookie") || !SHELL.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request))
    .then(hit => hit || fetch(request))
    .catch(() => Response.error()));
});
