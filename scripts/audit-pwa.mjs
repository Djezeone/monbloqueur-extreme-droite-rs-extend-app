import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const html = await readFile("pwa/index.html","utf8");
const app = await readFile("pwa/app.js","utf8");
const core = await readFile("pwa/core.js","utf8");
const flowModules = await Promise.all(["flow-core", "platforms", "flows", "actions", "effects", "register-view", "guided-core", "guided", "help-data", "help", "support-config", "persistence"].map(name => readFile("pwa/" + name + ".js", "utf8")));
const application = [app, core, ...flowModules].join("\n");
const sw = await readFile("pwa/sw.js","utf8");
const manifest = JSON.parse(await readFile("pwa/manifest.webmanifest","utf8"));

assert.match(html, /Content-Security-Policy/,"CSP obligatoire");
for (const directive of ["script-src 'self'","object-src 'none'","base-uri 'none'","form-action 'self'"]) {
  assert.ok(html.includes(directive),"CSP manquante : "+directive);
}
assert.doesNotMatch(html, /<script(?![^>]*src="\.\/)[^>]*>/i,"Scripts inline ou tiers interdits");
assert.doesNotMatch(application, /\b(?:innerHTML|outerHTML|document\.write|eval\s*\()/,"Injection DOM interdite");
assert.doesNotMatch(application, /\b(?:localStorage\.setItem\([^)]*token|document\.cookie|sessionStorage\.setItem\([^)]*token)/i,"Secrets dans stockage interdits");
assert.doesNotMatch(flowModules.join("\n"), /\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage)/,"Modules flux : aucun transport ou stockage parallèle");
assert.match(app, /parseBackup\(text\)/,"Restauration stricte obligatoire");
assert.match(app, /credentials:"omit"/,"Téléchargement de liste sans cookies obligatoire");
assert.ok(!app.includes("fetch(profileUrl") && !sw.includes("https://x.com"),"Le moteur ne doit pas agir sur les comptes sociaux");
// Walk the shell's actual static dependencies. The experimental journal/runners
// must remain unreachable from this user-facing app until B CONNECT qualifies.
const shellModules = new Set();
async function inspectShell(file) {
  if (shellModules.has(file)) return;
  shellModules.add(file);
  assert.ok(!file.includes("/connectors/"), "Connecteur inactif importé dans le shell");
  const source = await readFile(file,"utf8");
  assert.doesNotMatch(source, /\bimport\s*\(/, "Import dynamique non qualifié dans le shell");
  for (const match of source.matchAll(/\bimport\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g)) {
    assert.ok(match[1].startsWith("./"), "Import externe non qualifié");
    await inspectShell(resolve(dirname(file),match[1]));
  }
}
for (const script of html.matchAll(/<script[^>]+src="([^\"]+)"/g)) await inspectShell(resolve("pwa",script[1]));
for (const name of ["internal","mastodon","bluesky","orchestration","operation-journal","durable-orchestration"]) {
  const source = await readFile(`pwa/connectors/${name}.js`,"utf8");
  assert.doesNotMatch(source, /\b(?:fetch\s*\(|XMLHttpRequest\b|WebSocket\b|sendBeacon\b|localStorage\b|sessionStorage\b|document\.cookie\b)/, "Transport réel ou stockage secret non qualifié dans les connecteurs");
}
assert.ok(manifest.icons.some(icon=>icon.sizes==="192x192"),"Icône PWA 192 manquante");
assert.ok(manifest.icons.some(icon=>icon.sizes==="512x512"),"Icône PWA 512 manquante");
// Execute the worker in an isolated Web API harness: text matching cannot prove
// that an OAuth callback or an authenticated response stays out of Cache Storage.
execFileSync(process.execPath,["--test","scripts/test-pwa-sw.mjs"],{stdio:"inherit"});
console.log("FIL CLAIR security invariants: PASS");
console.log(`Inactive connectors: PASS (${shellModules.size} shell modules, no connector reachable)`);
