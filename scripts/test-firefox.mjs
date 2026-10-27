import { Builder } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import { createServer } from "node:http";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { manifestFor } from "./manifests.mjs";
import { packageDirectory } from "./package.mjs";
import { accounts, sitePage } from "../tests/fixtures/site.mjs";

const root = new URL("../", import.meta.url);
const scratch = new URL(
  `../../../work/firefox-test-${Date.now()}/`,
  import.meta.url,
);
const fixture = new URL("extension/", scratch);
await mkdir(scratch, { recursive: true });
await cp(new URL("extension/", root), fixture, { recursive: true });
let list = { schemaVersion: 1, version: "DEMONSTRATION", accounts };
let finish;
const reportReady = new Promise((resolve) => (finish = resolve));
const blocked = [];
let documents = 0;
const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/report") {
    let body = "";
    for await (const chunk of request) body += chunk;
    finish(JSON.parse(body));
    response.end("ok");
  } else if (url.pathname === "/mode") {
    list = {
      schemaVersion: 1,
      version: "IDENTITE-INCORRECTE",
      accounts: [{ id: "999", username: "CompteTest_A" }],
    };
    response.end("ok");
  } else if (url.pathname === "/list.json") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(list));
  } else if (url.pathname === "/__test__/blocked") {
    blocked.push(url.searchParams.get("username"));
    response.end("ok");
  } else {
    if (
      url.pathname === "/home" ||
      accounts.some((a) => url.pathname === "/" + a.username)
    )
      documents++;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(sitePage(url.href));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const manifest = manifestFor(
  JSON.parse(await readFile(new URL("manifest.json", fixture), "utf8")),
  "firefox",
);
manifest.host_permissions = ["http://127.0.0.1/*"];
manifest.content_scripts[0].matches = ["http://127.0.0.1/*"];
await writeFile(new URL("manifest.json", fixture), JSON.stringify(manifest));
await writeFile(
  new URL("config.js", fixture),
  `export const CONFIG={listUrl:${JSON.stringify(origin + "/list.json")}};`,
);
// La copie de test utilise un site local. Aucun profil X réel n’est visité.
const runner = (await readFile(new URL("runner.js", fixture), "utf8"))
  .replaceAll("https://x.com", origin)
  .replaceAll('"x.com"', '"127.0.0.1"');
await writeFile(new URL("runner.js", fixture), runner);
let background = await readFile(new URL("background.js", fixture), "utf8");
background = background.replace(
  "/^https:\\/\\/(x\\.com|twitter\\.com)\\//",
  "/^http:\\/\\/127\\.0\\.0\\.1:\\d+\\//",
);
assert.ok(
  background.includes("127\\.0"),
  "Le routage local du test doit être présent.",
);
background += `\napi.tabs.create({url:api.runtime.getURL('popup.html'),active:true});\n`;

await writeFile(new URL("background.js", fixture), background);
const archive = new URL("test.zip", scratch);
await writeFile(archive, await packageDirectory(fixture));

const options = new firefox.Options()
  .setBrowserVersion("stable")
  .addArguments("-headless");
if (process.env.FIREFOX_BINARY) options.setBinary(process.env.FIREFOX_BINARY);
const html = await readFile(new URL("popup.html", fixture), "utf8");
await writeFile(
  new URL("popup.html", fixture),
  html.replace(
    "</body>",
    '<script type="module" src="test-driver.js"></script></body>',
  ),
);
await writeFile(
  new URL("test-driver.js", fixture),
  `
const root=${JSON.stringify(origin)};
const waitText=text=>new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>{observer.disconnect();reject(Error('Texte attendu : '+text));},20000);
 const check=()=>{if(document.getElementById('status').textContent.includes(text)){observer.disconnect();clearTimeout(timeout);resolve();}};
 const observer=new MutationObserver(check);observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true});check();
});
try{
 const refresh=await browser.runtime.sendMessage({type:'refresh'});
 if(!refresh?.ok)throw Error('Chargement de la liste : '+JSON.stringify(refresh));
 await waitText('3 comptes dans la liste.');
 const started=Date.now();document.getElementById('start').click();
 await waitText('2 compte(s) bloqué(s), 1 compte(s) indisponible(s).');
 const {job}=await browser.storage.local.get('job');
 if(job.confirmed!==2||job.failed.length!==1||job.status!=='done')throw Error('Bilan incorrect');
 let closed=false;try{await browser.tabs.get(job.tabId);}catch{closed=true;}
 if(!closed)throw Error('L’onglet de travail est resté ouvert.');
 const duration=Date.now()-started;
 await fetch(root+'/mode',{method:'POST'});
 document.getElementById('start').click();
 await waitText('X ne permet pas de vérifier l’identité');
 document.getElementById('cancel').click();await waitText('Arrêté.');
 await fetch(root+'/report',{method:'POST',body:JSON.stringify({ok:true,duration,job})});
}catch(error){const {job}=await browser.storage.local.get('job');let tab;try{tab=await browser.tabs.get(job.tabId);}catch{}const permissions=await browser.permissions.getAll();await fetch(root+'/report',{method:'POST',body:JSON.stringify({ok:false,error:error.message,text:document.body.innerText,job,tab,permissions})});}
`,
);
await writeFile(archive, await packageDirectory(fixture));
let driver, timeout;
try {
  driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .build();
  await driver.installWebExtension(fileURLToPath(archive), {
    permanent: false,
  });
  const result = await Promise.race([
    reportReady,
    new Promise((_, reject) => {
      timeout = setTimeout(
        () => reject(Error("Le test Firefox ne répond pas.")),
        45000,
      );
    }),
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(blocked, ["CompteTest_A"]);
  assert.equal(
    documents,
    2,
    "Deux lots doivent charger deux documents X au total",
  );
  const report = {
    date: new Date().toISOString(),
    browser: "Firefox",
    version: (await driver.getCapabilities()).get("browserVersion"),
    network: "Site local et profils fictifs, aucun blocage réel",
    batchDurationMs: result.duration,
    checks: [
      "installation du paquet Firefox",
      "module de fond et API browser natives",
      "liste distante",
      "bouton de lancement",
      "confirmation du blocage",
      "compte déjà bloqué",
      "profil indisponible",
      "fermeture de l’onglet de travail",
      "refus d’une identité incorrecte",
      "arrêt du traitement",
      "navigation interne sans recharger X entre les profils",
    ],
    result: "11 contrôles réussis",
  };
  await mkdir(new URL("verification/", root), { recursive: true });
  await writeFile(
    new URL("verification/firefox.json", root),
    JSON.stringify(report, null, 2),
  );
  console.log("11 contrôles Firefox réussis (" + report.version + ").");
} finally {
  clearTimeout(timeout);
  await driver?.quit();
  await new Promise((resolve) => server.close(resolve));
}
