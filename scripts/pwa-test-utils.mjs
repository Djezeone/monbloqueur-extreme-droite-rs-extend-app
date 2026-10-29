import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
import { chromium, firefox, webkit } from "@playwright/test";

const files = new Set(["index.html", "app.js", "core.js", "flow-core.js", "platforms.js", "flows.js", "actions.js", "effects.js", "register-view.js", "guided-core.js", "guided.js", "help-data.js", "help.js", "support-config.js","persistence.js", "styles.css", "sw.js", "privacy.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"]);
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png" };

export async function servePwa() {
  const root = resolve("pwa");
  const requests = [];
  const server = createServer(async (req, res) => {
    let relative;
    try { relative = decodeURIComponent(new URL(req.url, "http://localhost").pathname).slice(1) || "index.html"; }
    catch { res.writeHead(400); res.end(); return; }
    requests.push(relative);
    if (["oauth/callback", "api/qa-profile", "unrelated.json"].includes(relative)) {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "private, no-store" });
      res.end(JSON.stringify({ syntheticFixture: true }));
      return;
    }
    if (!files.has(relative)) { res.writeHead(404); res.end(); return; }
    try {
      const content = await readFile(join(root, relative));
      res.writeHead(200, { "Content-Type": mime[extname(relative)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(content);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(done => server.listen(0, "localhost", done));
  const port = server.address().port;
  // app.js registers its worker for localhost; 127.0.0.1 would skip registration.
  const close = () => new Promise(done => server.close(done));
  return { url:"http://localhost:" + port, requests, close, pause:close,
    listening:() => server.listening,
    resume:() => new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "localhost", () => { server.removeListener("error", reject); resolve(); });
    }) };
}

export async function launchPwaBrowser() {
  const name = process.env.PWA_BROWSER || "chromium";
  const type = { chromium, firefox, webkit }[name];
  if (!type) throw Error("PWA_BROWSER must be chromium, firefox or webkit.");
  const options = { headless: true };
  if (process.env.PWA_EXECUTABLE_PATH) options.executablePath = process.env.PWA_EXECUTABLE_PATH;
  // Explicitly opt in only on containers where Firefox user namespaces are denied.
  if (name === "firefox" && process.env.PWA_FIREFOX_NO_SANDBOX === "1") {
    options.firefoxUserPrefs = { "security.sandbox.content.level": 0 };
    options.env = { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: "1" };
  }
  const browser = await type.launch(options);
  return { browser, name, version: browser.version() };
}

export async function waitForShell(page) {
  await page.evaluate(async () => {
    let timer;
    try {
      await Promise.race([
        (async () => {
          await navigator.serviceWorker.ready;
          if (!navigator.serviceWorker.controller) {
            await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
          }
        })(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(Error("Service worker did not install and control this page within 10 seconds.")), 10000); })
      ]);
    } finally { clearTimeout(timer); }
  });
}
