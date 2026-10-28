import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { chromium } from "@playwright/test";

const root=resolve("pwa");
const mime={".html":"text/html",".css":"text/css",".js":"text/javascript",".webmanifest":"application/manifest+json",".svg":"image/svg+xml",".png":"image/png"};
const known=new Set(["index.html","app.js","core.js","styles.css","sw.js","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png"]);
const server=createServer(async(req,res)=>{
  const relative=decodeURIComponent(new URL(req.url,"http://localhost").pathname).replace(/^\//,"")||"index.html";
  if(!known.has(relative)) {res.writeHead(404);res.end();return;}
  try {const content=await readFile(join(root,relative)); const ext=relative.substring(relative.lastIndexOf("."));res.writeHead(200,{"Content-Type":mime[ext]||"application/octet-stream","Cache-Control":"no-store"});res.end(content);}
  catch {res.writeHead(404);res.end();}
});
const browser=await chromium.launch({headless:true});
const temp=await mkdtemp(join(tmpdir(),"fil-clair-"));
let failed=false;
try {
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const url="http://127.0.0.1:"+server.address().port;
  const context=await browser.newContext({acceptDownloads:true});
  const page=await context.newPage();
  await page.goto(url,{waitUntil:"networkidle"});
  await assert.doesNotReject(()=>page.getByRole("heading",{name:"Un fil qui vous ressemble."}).waitFor());
  await page.getByRole("button",{name:"Mes listes"}).click();
  await page.locator("#handle").fill("qa_profil");
  await page.getByRole("button",{name:"Ajouter à ma liste"}).click();
  assert.equal(await page.locator(".account-id strong").first().textContent(),"@qa_profil");
  await page.locator('button[data-action="review"]').click();
  assert.match(await page.locator(".status").first().textContent(),/vérifier/i);
  await page.getByRole("button",{name:"Historique"}).click();
  assert.match(await page.locator("#history").textContent(),/qa_profil/);
  await page.getByRole("button",{name:"Mes listes"}).click();
  await page.locator('button[data-action="todo"]').first().click();
  assert.match(await page.locator(".status").first().textContent(),/faire/i);
  await page.reload();
  await page.getByRole("button",{name:"Mes listes"}).click();
  assert.equal(await page.locator(".account-id strong").first().textContent(),"@qa_profil");
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
  await page.getByRole("button",{name:"Mes listes"}).click();
  assert.equal(await page.locator("#accounts li").count(),0);
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#file").setInputFiles(backupFile);
  await page.getByRole("button",{name:"Mes listes"}).click();
  assert.equal(await page.locator(".account-id strong").first().textContent(),"@qa_profil");
  await context.close();

  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobilePage=await mobile.newPage();
  await mobilePage.goto(url,{waitUntil:"domcontentloaded"});
  await mobilePage.getByRole("button",{name:"Mes listes"}).click();
  assert.equal(await mobilePage.locator("#add-account").count(),1);
  await mobile.close();
  console.log("E2E FIL CLAIR : ajout, à vérifier, historique, annulation, persistance, sauvegarde corrompue, export/effacement/restauration, viewport mobile PASS");
} catch(error) {failed=true; console.error(error);}
finally {await browser.close();await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
if(failed)process.exitCode=1;
