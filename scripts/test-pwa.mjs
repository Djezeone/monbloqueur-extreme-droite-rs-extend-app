import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { expect } from "@playwright/test";
import { servePwa, launchPwaBrowser, waitForShell } from "./pwa-test-utils.mjs";

const server=await servePwa();
let browser;
const temp=await mkdtemp(join(tmpdir(),"fil-clair-"));
let failed=false;
try {
  const launched=await launchPwaBrowser();
  browser=launched.browser;
  console.log(`PWA E2E engine: ${launched.name} ${launched.version}`);
  const url=server.url;
  const context=await browser.newContext({acceptDownloads:true});
  const page=await context.newPage();
  await page.goto(url,{waitUntil:"networkidle"});
  await waitForShell(page);
  await assert.doesNotReject(()=>page.getByRole("heading",{name:"Que souhaitez-vous maîtriser dans votre fil ?"}).waitFor());
  await page.getByRole("button",{name:"Mes listes",exact:true}).click();
  await page.locator("#handle").fill("qa_profil");
  await page.getByRole("button",{name:"Ajouter à ma liste"}).click();
  await expect(page.locator(".account-id strong").first()).toHaveText("@qa_profil");
  await page.locator('button[data-action="review"]').click();
  await expect(page.locator(".status").first()).toContainText(/vérifier/i);
  await page.getByRole("button",{name:"Historique"}).click();
  assert.match(await page.locator("#history").textContent(),/qa_profil/);
  await page.getByRole("button",{name:"Mes listes",exact:true}).click();
  await page.locator('button[data-action="todo"]').first().click();
  await expect(page.locator(".status").first()).toContainText(/faire/i);
  await page.reload();
  await page.getByRole("button",{name:"Mes listes",exact:true}).click();
  assert.equal(await page.locator(".account-id strong").first().textContent(),"@qa_profil");
  // Only synthetic same-origin fixtures are fetched. Their contents and token
  // query URLs must never enter Cache Storage.
  const cacheUrls=await page.evaluate(async()=>{
    for(const path of ["/oauth/callback?code=synthetic-code&state=synthetic-state","/api/qa-profile","/unrelated.json","/index.html?access_token=synthetic-token"]){
      const response=await fetch(path,{credentials:"omit",headers:{Authorization:"Bearer synthetic-token"}});
      if(!response.ok) throw Error("QA fixture unavailable");
    }
    const keys=await caches.keys();
    const urls=[];
    for(const key of keys){const cache=await caches.open(key);urls.push(...(await cache.keys()).map(request=>new URL(request.url).pathname+new URL(request.url).search));}
    return urls;
  });
  assert.deepEqual(cacheUrls.sort(),["/","/index.html","/styles.css","/app.js","/core.js","/flow-core.js","/platforms.js","/flows.js","/actions.js","/effects.js","/register-view.js","/guided-core.js","/guided.js","/help-data.js","/help.js","/support-config.js","/privacy.html","/manifest.webmanifest","/icon.svg","/icon-192.png","/icon-512.png"].sort());
  // Firefox may revalidate sw.js outside Playwright's page network emulation.
  // Stop the origin too: offline success must not rely on a reachable server.
  await server.pause();
  assert.equal(server.listening(), false);
  const beforeOffline=server.requests.length;
  await context.setOffline(true);
  assert.equal(await page.evaluate(() => navigator.onLine), false, "Browser must report offline for this scenario");
  console.log("offline transport: HTTP origin stopped and navigator.onLine=false");
  await page.reload({waitUntil:"domcontentloaded"});
  await page.getByRole("button",{name:"Mes listes",exact:true}).click();
  assert.equal(await page.locator(".account-id strong").first().textContent(),"@qa_profil");
  await page.locator("#handle").fill("qa_offline");
  await page.getByRole("button",{name:"Ajouter à ma liste"}).click();
  await expect(page.locator("#accounts li")).toHaveCount(2);
  await page.goto(url+"/privacy.html",{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"Vos données, vos choix",exact:true}).waitFor();
  await page.goto(url,{waitUntil:"domcontentloaded"});
  await page.getByRole("button",{name:"Mes listes",exact:true}).click();
  assert.equal(await page.locator("#accounts li").count(),2);
  assert.equal(server.requests.length,beforeOffline,"Offline shell interactions must not reach the HTTP server: " + JSON.stringify(server.requests.slice(beforeOffline)));
  await server.resume();
  await context.setOffline(false);
  // La sauvegarde malformée doit laisser intactes les données existantes.
  await page.locator("#file").setInputFiles({name:"backup.json",mimeType:"application/json",buffer:Buffer.from('{"version":1,"lists":[]}')});
  await page.locator("#notice").getByText(/impossible|format/i).waitFor();
  assert.equal(await page.locator(".account-id strong").first().textContent(),"@qa_profil");
  await page.getByRole("button",{name:"Historique"}).click();
  const [download]=await Promise.all([page.waitForEvent("download"),page.getByRole("button",{name:"Exporter mes données"}).click()]);
  const backupFile=join(temp,"backup.json");await download.saveAs(backupFile);
  const backup=JSON.parse(await readFile(backupFile,"utf8"));
  assert.equal(backup.lists[0].accounts[0].handle,"qa_profil");
  await page.getByRole("button",{name:"Réglages"}).click();
  page.once("dialog",d=>d.accept());
  await page.getByRole("button",{name:"Effacer toutes mes données"}).click();
  await expect(page.locator("#notice")).toContainText(/locaux effacés/);
  await page.getByRole("button",{name:"Mes listes",exact:true}).click();
  assert.equal(await page.locator("#accounts li").count(),0);
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#file").setInputFiles(backupFile);
  await expect(page.locator("#notice")).toContainText(/Sauvegarde locale restaurée/);
  await page.getByRole("button",{name:"Mes listes",exact:true}).click();
  assert.equal(await page.locator(".account-id strong").first().textContent(),"@qa_profil");
  // A local declaration must disappear when its profile is removed. Re-adding
  // the same synthetic identifier must not restore the old declaration.
  page.once("dialog",dialog=>dialog.accept());
  await page.locator('button[data-action="blocked"]').first().click();
  await expect(page.locator(".status").first()).toContainText(/déclaré/i);
  await page.locator('button[data-action="delete"]').first().focus();
  page.once("dialog",dialog=>dialog.accept());
  await page.keyboard.press("Enter");
  await expect(page.locator("#accounts li")).toHaveCount(1);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.account),"x::qa_offline");
  await page.locator("#handle").fill("qa_profil");
  await page.getByRole("button",{name:"Ajouter à ma liste",exact:true}).click();
  await expect(page.locator("#accounts li")).toHaveCount(2);
  await expect(page.locator(".status").last()).toContainText(/faire/i);
  page.once("dialog",dialog=>dialog.accept());
  await page.locator('button[data-action="blocked"]').last().click();
  await expect(page.locator(".status").last()).toContainText(/déclaré/i);
  page.once("dialog",dialog=>dialog.accept());
  await page.getByRole("button",{name:"Supprimer la liste",exact:true}).click();
  await expect(page.locator("#accounts li")).toHaveCount(0);
  await page.locator("#handle").fill("qa_profil");
  await page.getByRole("button",{name:"Ajouter à ma liste",exact:true}).click();
  await expect(page.locator(".status")).toContainText(/faire/i);
  // List provenance is declared metadata, displayed and exported without any
  // fetch of the synthetic source URL.
  const listFixture={format:"fil-clair-v1",title:"Fixture de provenance",revision:"qa-2026-10-28",provenance:{label:"Source synthétique QA",url:"https://example.org/qa-list.json",retrievedAt:Date.UTC(2026,9,28)},accounts:[{network:"x",handle:"qa_meta"}]};
  await page.locator("#file").setInputFiles({name:"list-metadata.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(listFixture))});
  await page.locator("#list-metadata").getByText(/qa-2026-10-28/).waitFor();
  assert.match(await page.locator("#list-metadata").textContent(),/Source synthétique QA/);
  await page.getByRole("button",{name:"Réglages",exact:true}).click();
  const [listDownload]=await Promise.all([page.waitForEvent("download"),page.getByRole("button",{name:"Exporter la liste active",exact:true}).click()]);
  const listPath=join(temp,"list-with-metadata.json");
  await listDownload.saveAs(listPath);
  const listExport=JSON.parse(await readFile(listPath,"utf8"));
  assert.equal(listExport.revision,listFixture.revision);
  assert.deepEqual(listExport.provenance,listFixture.provenance);
  assert.deepEqual(listExport.accounts,listFixture.accounts);
  await context.close();

  const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  const mobilePage=await mobile.newPage();
  await mobilePage.goto(url,{waitUntil:"domcontentloaded"});
  await mobilePage.getByRole("button",{name:"Mes listes",exact:true}).click();
  assert.equal(await mobilePage.locator("#add-account").count(),1);
  await mobile.close();
  console.log("E2E FIL CLAIR : ajout, à vérifier, historique, annulation, persistance, sauvegarde corrompue, export/effacement/restauration, SW installé et contrôlant, cache allowlist, reload et écriture hors ligne, confidentialité hors ligne, suppression/réajout profil et dernière liste sans résurrection, focus voisin, métadonnées affichées et exportées, viewport tactile PASS");
} catch(error) {failed=true; console.error(error);}
finally {if(browser)await browser.close();await server.close();await rm(temp,{recursive:true,force:true});}
if(failed)process.exitCode=1;
