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
let activeOwner = "CompteDeTest";
let fixtureOptions = {};
const blockedByOwner = new Map();
const avatar = await readFile(new URL("extension/icons/icon16.png", root));
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
    const mode = url.searchParams.get("type");
    if (mode === "unblock")
      blockedByOwner.get(activeOwner)?.delete("CompteTest_A");
    else if (mode === "other") activeOwner = "AutreCompte";
    else if (mode === "invalid")
      list = {
        schemaVersion: 1,
        version: "IDENTITE-INCORRECTE",
        accounts: [{ id: "999", username: "CompteTest_A" }],
      };
    else if (mode === "article") {
      fixtureOptions = {
        profileIds: { CompteTest_A: "999" },
        articleFollowIds: { CompteTest_A: "11" },
      };
      list = {
        schemaVersion: 1,
        version: "IDENTITE-ARTICLE",
        accounts: [{ id: "11", username: "CompteTest_A" }],
      };
    } else if (mode === "generic") {
      activeOwner = "CompteSansCache";
      fixtureOptions = { genericUnblockHandles: ["CompteTest_B"] };
      list = {
        schemaVersion: 1,
        version: "DEJA-BLOQUE-SANS-ID",
        accounts: [{ id: "12", username: "CompteTest_B" }],
      };
    }
    response.end("ok");
  } else if (url.pathname === "/list.json") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(list));
  } else if (url.pathname === "/__test__/blocked") {
    const owner = url.searchParams.get("owner"),
      username = url.searchParams.get("username");
    blocked.push({ owner, username });
    if (!blockedByOwner.has(owner)) blockedByOwner.set(owner, new Set());
    blockedByOwner.get(owner).add(username);
    response.end("ok");
  } else if (url.pathname.startsWith("/profile_images/")) {
    response.setHeader("Content-Type", "image/png");
    response.end(avatar);
  } else {
    if (
      url.pathname === "/home" ||
      accounts.some((a) => url.pathname === "/" + a.username)
    )
      documents++;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(
      sitePage(url.href, activeOwner, {
        ...fixtureOptions,
        avatarOrigin: origin,
        blocked: [...(blockedByOwner.get(activeOwner) || [])],
      }),
    );
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
const content = (
  await readFile(new URL("content.js", fixture), "utf8")
).replaceAll('"pbs.twimg.com"', '"127.0.0.1"');
assert.ok(
  content.includes('"127.0.0.1"'),
  "L’avatar de test doit rester sur le serveur local.",
);
await writeFile(new URL("content.js", fixture), content);
let background = await readFile(new URL("background.js", fixture), "utf8");
background = background.replace(
  "/^https:\\/\\/(x\\.com|twitter\\.com)\\//",
  "/^http:\\/\\/127\\.0\\.0\\.1:\\d+\\//",
);
assert.ok(
  background.includes("127\\.0"),
  "Le routage local du test doit être présent.",
);
background =
  `
const testApi=globalThis.browser;
const forwardTestMessage=testApi.tabs.sendMessage.bind(testApi.tabs);
testApi.tabs.sendMessage=async(id,message)=>{
 if(['navigate','block'].includes(message.type)){
  const {testCommands=[]}=await testApi.storage.session.get('testCommands');
  testCommands.push({type:message.type,jobId:message.jobId,username:message.account.username});
  await testApi.storage.session.set({testCommands});
 }
 return forwardTestMessage(id,message);
};
` + background;
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
const ensure=(condition,message)=>{if(!condition)throw Error(message);};
const readJob=async()=> (await browser.storage.local.get('job')).job;
const waitUI=predicate=>new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>{observer.disconnect();reject(Error('L’interface Firefox ne répond pas.'));},20000);
 const check=()=>{if(predicate()){observer.disconnect();clearTimeout(timeout);resolve();}};
 const observer=new MutationObserver(check);observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true});check();
});
const waitJob=predicate=>new Promise((resolve,reject)=>{
 const clean=()=>{clearTimeout(timeout);browser.storage.onChanged.removeListener(check);};
 const check=async()=>{try{const job=await readJob();if(predicate(job)){clean();resolve(job);}}catch(error){clean();reject(error);}};
 const timeout=setTimeout(()=>{clean();reject(Error('Le traitement Firefox ne répond pas.'));},20000);
 browser.storage.onChanged.addListener(check);check();
});
const navigations=async job=>{
 const {testCommands=[]}=await browser.storage.session.get('testCommands');
 return testCommands.filter(command=>command.jobId===job.id&&command.type==='navigate').map(command=>command.username);
};
const waitClosed=tabId=>new Promise((resolve,reject)=>{
 const clean=()=>{clearTimeout(timeout);browser.tabs.onRemoved.removeListener(removed);};
 const removed=id=>{if(id===tabId){clean();resolve();}};
 const timeout=setTimeout(()=>{clean();reject(Error('L’onglet de travail est resté ouvert.'));},5000);
 browser.tabs.onRemoved.addListener(removed);
 browser.tabs.get(tabId).catch(()=>{clean();resolve();});
});
const waitActive=tabId=>new Promise((resolve,reject)=>{
 const clean=()=>{clearTimeout(timeout);browser.tabs.onActivated.removeListener(activated);};
 const activated=info=>{if(info.tabId===tabId){clean();resolve();}};
 const timeout=setTimeout(()=>{clean();reject(Error('Vérifier X n’a pas activé l’onglet de travail'));},5000);
 browser.tabs.onActivated.addListener(activated);
 browser.tabs.get(tabId).then(tab=>{if(tab.active){clean();resolve();}}).catch(error=>{clean();reject(error);});
});
const run=async(button='start',status='done')=>{
 const previous=(await readJob())?.id;
 if(button==='rescan')document.querySelector('details').open=true;
 await waitUI(()=>!document.getElementById(button).disabled);
 const started=Date.now();document.getElementById(button).click();
 const job=await waitJob(value=>value?.id!==previous&&value?.status===status);
 if(status==='done')await waitClosed(job.tabId);
 await waitUI(()=>!document.getElementById('start').disabled);
 return {job,duration:Date.now()-started};
};
const cancel=async()=>{
 await waitUI(()=>!document.getElementById('cancel').disabled&&!document.getElementById('cancel').hidden);
 document.getElementById('cancel').click();
 await waitJob(job=>job?.status==='cancelled');
 await waitUI(()=>!document.getElementById('start').disabled);
};
try{
 const refresh=await browser.runtime.sendMessage({type:'refresh'});
 if(!refresh?.ok)throw Error('Chargement de la liste : '+JSON.stringify(refresh));
 await waitUI(()=>document.getElementById('status').textContent.includes('3 comptes dans la liste.'));
 const first=await run(), job=first.job;
 ensure(job.owner==='CompteDeTest'&&/^[a-f0-9]{64}$/.test(job.ownerKey),'Compte connecté non identifié');
 ensure(job.created===1&&job.already===1&&job.cached===0&&job.failed.length===1,'Premier bilan incorrect');
 ensure(JSON.stringify(await navigations(job))===JSON.stringify(['CompteTest_A','CompteTest_B','CompteTest_C']),'Premier parcours incomplet');
 await fetch(root+'/mode?type=unblock',{method:'POST'});
 const cached=await run();
 ensure(cached.job.cached===2&&cached.job.created===0&&cached.job.already===0&&cached.job.failed.length===1,'Le cache n’a pas sauté les comptes déjà traités');
 ensure(JSON.stringify(await navigations(cached.job))===JSON.stringify(['CompteTest_C']),'Le cache recharge des profils confirmés');
 const rescan=await run('rescan');
 ensure(rescan.job.force&&rescan.job.cached===0&&rescan.job.created===1&&rescan.job.already===1,'Tout revérifier ne réapplique pas le blocage retiré');
 ensure((await navigations(rescan.job)).length===3,'La vérification complète n’a pas parcouru la liste');
 await fetch(root+'/mode?type=other',{method:'POST'});
 const other=await run();
 ensure(other.job.owner==='AutreCompte'&&/^[a-f0-9]{64}$/.test(other.job.ownerKey)&&other.job.ownerKey!==job.ownerKey,'Les comptes connectés ne sont pas cloisonnés');
 ensure(other.job.cached===0&&other.job.created===1&&other.job.already===1,'Le second compte utilise le cache du premier');
 const {processedHistory}=await browser.storage.local.get('processedHistory');
 ensure(processedHistory.length===2&&processedHistory.every(row=>row.ids.length===2),'Historique local incorrect');
 await fetch(root+'/mode?type=invalid',{method:'POST'});
 const invalid=await run('start','paused');
 ensure(invalid.job.confirmed===0&&invalid.job.message.includes('vérifier l’identité'),'L’identifiant incorrect n’a pas été refusé');
 document.getElementById('inspect').click();
 await waitActive(invalid.job.tabId);
 ensure((await browser.tabs.get(invalid.job.tabId)).active,'Vérifier X n’a pas activé l’onglet de travail');
 await cancel();
 await fetch(root+'/mode?type=article',{method:'POST'});
 const article=await run('rescan','paused');
 ensure(article.job.confirmed===0&&article.job.message.includes('vérifier l’identité'),'Un identifiant dans un article a validé le mauvais profil');
 await cancel();
 await fetch(root+'/mode?type=generic',{method:'POST'});
 const generic=await run();
 ensure(generic.job.owner==='CompteSansCache'&&generic.job.confirmed===1&&generic.job.already===1&&generic.job.created===0&&generic.job.cached===0&&generic.job.failed.length===0,'Le profil déjà bloqué sans identifiant n’a pas été sauté sans action');
 ensure(JSON.stringify(await navigations(generic.job))===JSON.stringify(['CompteTest_B']),'Le profil générique n’a pas été consulté');
 const {processedHistory:genericHistory=[]}=await browser.storage.local.get('processedHistory');
 ensure(!genericHistory.some(row=>row.key===generic.job.ownerKey||row.username==='CompteSansCache'),'Le profil déjà bloqué sans identifiant a alimenté le cache');
 await fetch(root+'/report',{method:'POST',body:JSON.stringify({ok:true,duration:first.duration,cachedDuration:cached.duration,rescanDuration:rescan.duration,job})});
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
  assert.deepEqual(blocked, [
    { owner: "CompteDeTest", username: "CompteTest_A" },
    { owner: "CompteDeTest", username: "CompteTest_A" },
    { owner: "AutreCompte", username: "CompteTest_A" },
  ]);
  assert.equal(
    documents,
    7,
    "Chaque lot doit charger un seul document X, même en vérification complète",
  );
  const report = {
    date: new Date().toISOString(),
    browser: "Firefox",
    version: (await driver.getCapabilities()).get("browserVersion"),
    network: "Site local et profils fictifs, aucun blocage réel",
    batchDurationMs: result.duration,
    cachedBatchDurationMs: result.cachedDuration,
    rescanDurationMs: result.rescanDuration,
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
      "identité locale cloisonnée par compte connecté",
      "profil valide sans publication traité correctement",
      "second passage : deux comptes confirmés sautés sans navigation",
      "Tout revérifier réapplique un blocage retiré manuellement",
      "autre compte X : aucun cache partagé",
      "identifiant trouvé dans un article refusé comme identité du profil",
      "profil déjà bloqué sans identifiant numérique sauté sans action et sans cache",
    ],
    result: "18 contrôles réussis",
  };
  await mkdir(new URL("verification/", root), { recursive: true });
  await writeFile(
    new URL("verification/firefox.json", root),
    JSON.stringify(report, null, 2),
  );
  console.log("18 contrôles Firefox réussis (" + report.version + ").");
} finally {
  clearTimeout(timeout);
  await driver?.quit();
  await new Promise((resolve) => server.close(resolve));
}
