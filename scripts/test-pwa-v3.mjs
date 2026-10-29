import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { servePwa, launchPwaBrowser, waitForShell } from "./pwa-test-utils.mjs";
import { parseBackup } from "../pwa/core.js";

const server=await servePwa(), temp=await mkdtemp(join(tmpdir(),"fil-clair-v3-"));
const checks=[]; let browser;
async function check(name,work){ await work(); checks.push({name,result:"PASS"}); }
async function scan(page,phase){
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).analyze();
  console.log(JSON.stringify({phase,violations:result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),incomplete:result.incomplete.map(v=>v.id)}));
  assert.equal(result.violations.length,0);
}
const snapshot=page=>page.evaluate(()=>localStorage.getItem("fil-clair-v1"));
try {
  const launched=await launchPwaBrowser(); browser=launched.browser;
  console.log(JSON.stringify({suite:"universal-v3",engine:launched.name,version:launched.version,physicalDevice:false}));
  const context=await browser.newContext({viewport:{width:320,height:850},acceptDownloads:true});
  const external=[],errors=[];
  context.on("request",request=>{if(new URL(request.url()).origin!==server.url)external.push(request.url());});
  const page=await context.newPage(); page.on("pageerror",e=>errors.push(e.message));
  await page.goto(server.url,{waitUntil:"networkidle"}); await waitForShell(page);
  await check("accueil : question universelle, quatre accès de44px sans récompense de blocage",async()=>{
    await expect(page.getByRole("heading",{name:"Que souhaitez-vous maîtriser dans votre fil ?"})).toBeVisible({timeout:2000});
    for(const category of ["accounts","sources","topics","recommendations"]){
      const button=page.locator(`[data-home-category="${category}"]`);
      await expect(button).toBeVisible(); const box=await button.boundingBox(); assert.ok(box.height>=44);
      assert.ok(box.y+box.height<=850,"Les quatre accès doivent précéder les réglages et tenir dans la première vue 320×850 : "+JSON.stringify(box));
    }
    assert.equal(await page.locator("#metric-stars").count(),0); await scan(page,"home-v3-320");
  });
  await check("source : une entrée ouvre le carnet local sans fournisseur ni inscription",async()=>{
    await page.locator('[data-home-category="sources"]').click();
    await expect(page.locator("#flow-workspace")).toBeVisible();
    await expect(page.locator("#flow-category")).toHaveValue("sources");
    assert.deepEqual(JSON.parse(await snapshot(page)).flows.platforms,[]);
    await page.locator("#flow-target").fill("Source sensible <script>rien</script>");
    await page.locator("#flow-add-button").click();
    await expect(page.locator("#flow-items > li")).toHaveCount(1);
    await expect(page.locator("#flow-items script")).toHaveCount(0);
  });
  await check("registre : documentation séparée des preuves, modules tiers secondaires",async()=>{
    await page.locator("#effects-register > summary").click();
    await expect(page.locator("#registry-items > li")).toHaveCount(5);
    await page.locator("#registry-service").selectOption("*");
    await expect(page.locator("#registry-items > li")).toHaveCount(43);
    const x=page.locator('#registry-items > li[data-effect="x/mute"]');
    await x.locator("summary").click(); await expect(x).toContainText("Aucun effet fournisseur testé");
    await expect(x).toContainText("2026-10-28"); await expect(x).toContainText("Retour");
    const links=await page.locator("#registry-items a").evaluateAll(els=>els.map(el=>el.href));
    assert.ok(links.every(url=>!url.includes("sensible")&&!url.includes("script")));
    await page.locator("#registry-service").selectOption("");
    await expect(page.locator("#registry-items > li")).toHaveCount(5);
    await page.locator("#effects-register > summary").click();
  });
  await check("X : sources figées, composants divergents, aucune action de signalement",async()=>{
    await page.locator("#effects-register > summary").click();
    await page.locator("#x-code-evidence > summary").click();
    await expect(page.locator("#x-code-evidence")).toContainText("−52,272");
    await expect(page.locator("#x-code-evidence")).toContainText("−47,52");
    await expect(page.locator("#x-code-evidence")).toContainText("probabilités prédites");
    await expect(page.locator("#x-code-evidence")).toContainText("ne prouve ni infraction ni sanction");
    assert.equal(await page.getByRole("button",{name:/^signaler|report/i}).count(),0);
    await scan(page,"register-x-v3-320");
    await page.locator("#effects-register > summary").click();
  });
  await check("guide : service facultatif ajouté sans perdre la source",async()=>{
    await page.locator("#flow-edit").click(); await page.locator('#flow-platforms input[value="x"]').check();
    await page.locator("#flow-next").click(); await page.locator("#flow-next").click(); await page.locator("#flow-finish").click();
    await page.locator("#flow-platform").selectOption("x"); await page.locator("#flow-category").selectOption("accounts");
    await page.locator("#flow-control").selectOption("mute"); await page.locator("#flow-target").fill("Compte de test synthétique");
    await page.locator("#flow-add-button").click(); await expect(page.locator("#flow-items > li")).toHaveCount(2);
  });
  const guide=page.locator('#flow-items > li').filter({hasText:"Compte de test synthétique"});
  await check("déclaration refusée puis consentie sans confirmation API",async()=>{
    const before=await snapshot(page); page.once("dialog",d=>d.dismiss());
    await guide.locator('[data-flow-action="declare"]').click(); assert.equal(await snapshot(page),before);
    page.once("dialog",d=>{assert.match(d.message(),/vous-même/);return d.accept();});
    await guide.locator('[data-flow-action="declare"]').click(); await expect(guide.locator(".flow-status")).toContainText("Déclaré");
    await expect(guide).toContainText("Déclaration personnelle"); await expect(page.locator("#flow-count")).toContainText("0 confirmation API");
  });
  await check("états et historique : revue, échec, annulation et retour uniquement locaux",async()=>{
    await guide.locator(".flow-advanced > summary").click();
    await guide.locator('[data-flow-action="review"]').click(); await expect(guide.locator(".flow-status")).toContainText("vérifier");
    await guide.locator('[data-flow-action="failed"]').click(); await expect(guide.locator(".flow-status")).toContainText("échec");
    await guide.locator('[data-flow-action="cancelled"]').click(); await expect(guide.locator(".flow-status")).toContainText("annulé");
    page.once("dialog",d=>{assert.match(d.message(),/aucune action|Aucune action/);return d.accept();});
    await guide.locator('[data-flow-action="undo"]').click(); await expect(guide.locator(".flow-status")).toContainText("échec");
    const item=JSON.parse(await snapshot(page)).flows.items.find(i=>i.platform==="x");
    assert.deepEqual(item.events.map(e=>e.status),["planned","declared","review","failed","cancelled","failed"]);
    await expect(guide.locator(".flow-events > li")).toHaveCount(6); await scan(page,"action-history-v3-320");
  });
  await check("indicateurs : choix, déclarations, reprises, jamais comptes pénalisés",async()=>{
    await page.getByRole("button",{name:"Accueil",exact:true}).click();
    await expect(page.locator("#metric-total")).toHaveText("2"); await expect(page.locator("#metric-done")).toHaveText("0");
    await expect(page.locator("#home-followup")).toContainText("1 en échec");
  });
  await check("catégories modifiables : masquer Comptes ne supprime aucune fiche",async()=>{
    await page.locator("#start-flows").click(); await page.locator("#flow-next").click();
    await page.locator('#flow-categories input[value="accounts"]').uncheck();
    await page.locator("#flow-next").click(); await page.locator("#flow-finish").click();
    await expect(page.locator("#flow-items > li")).toHaveCount(2);
    await page.getByRole("button",{name:"Accueil",exact:true}).click();
    await expect(page.locator('[data-home-category="accounts"]')).toBeHidden();
    await expect(page.locator('[data-home-category="sources"]')).toBeVisible();
  });
  let file;
  await check("sauvegarde V3 complète et restore conservent les états/historiques",async()=>{
    await page.getByRole("button",{name:"Réglages",exact:true}).click();
    const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#export-all").click()]);
    file=join(temp,"v3.json"); await download.saveAs(file); const backup=await readFile(file,"utf8");
    const state=parseBackup(backup); assert.equal(state.flows.items.length,2); assert.equal(state.flows.items[1].events.length,6);
    page.once("dialog",d=>d.accept()); await page.locator("#erase").click();
    await page.getByRole("button",{name:"Réglages",exact:true}).click();
    const chooser=page.waitForEvent("filechooser"); await page.locator("#restore-all").click();
    page.once("dialog",d=>d.accept()); await (await chooser).setFiles(file);
    await expect(page.locator("#notice")).toContainText("restaurée");
    assert.deepEqual(parseBackup(await snapshot(page)).flows,state.flows);
  });
  await check("hors ligne réel : registre, quatre accès et suivi restent disponibles",async()=>{
    await waitForShell(page); await context.setOffline(true); await server.pause(); assert.equal(server.listening(),false);
    try {
      await page.reload({waitUntil:"domcontentloaded"}); await page.locator('[data-home-category="sources"]').click();
      await page.locator("#effects-register > summary").click();
      await page.locator("#registry-service").selectOption("*"); await expect(page.locator("#registry-items > li")).toHaveCount(43);
      await page.locator("#flow-target").fill("Source hors ligne"); await page.locator("#flow-add-button").click();
      await expect(page.locator("#flow-items > li")).toHaveCount(3);
    } finally {await server.resume();await context.setOffline(false);}
  });
  await check("sécurité : aucune donnée de cible transmise, aucune erreur JavaScript",async()=>{
    assert.deepEqual(external,[]); assert.deepEqual(errors,[]);
  });
  await context.close();
} finally { if(browser)await browser.close();await server.close();await rm(temp,{recursive:true,force:true}); }
checks.forEach(c=>console.log(JSON.stringify(c)));
console.log(`Universal V3: ${checks.length}/${checks.length} checks passed; emulation only, no provider action or full WCAG claim.`);
