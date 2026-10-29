import assert from "node:assert/strict";
import {readFile,mkdir} from "node:fs/promises";
import {expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {servePwa,launchPwaBrowser,waitForShell} from "./pwa-test-utils.mjs";
const server=await servePwa(),checks=[];let browser;
const snapshot=p=>p.evaluate(()=>localStorage.getItem("fil-clair-v1"));
async function check(name,fn){await fn();checks.push(name);console.log("PASS "+name);}
async function scan(page,phase){
  const r=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).analyze();
  console.log(JSON.stringify({axe:phase,violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}));
  assert.equal(r.violations.length,0,phase);
}
try{
  const launched=await launchPwaBrowser();browser=launched.browser;
  console.log(JSON.stringify({suite:"v3.2",engine:launched.name,version:launched.version,physicalDevice:false}));
  const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),page=await context.newPage();
  const external=[],errors=[];context.on("request",r=>{if(new URL(r.url()).origin!==server.url)external.push(r.url());});page.on("pageerror",e=>{errors.push(e.message);console.log(JSON.stringify({pageError:e.message,stack:e.stack}));});
  await page.goto(server.url,{waitUntil:"networkidle"});await waitForShell(page);
  await check("nouveau parcours accessible sans compte, chatbot ou service obligatoire",async()=>{
    await expect(page.locator("#guided-open")).toBeVisible();await page.locator("#guided-open").click();
    await expect(page.locator("#guided-dialog")).toBeVisible();await expect(page.locator("#guided-target")).toBeFocused();
    await page.locator("#guided-next").click();await expect(page.locator("#guided-error")).toContainText("nom");
    await page.locator("#guided-target").fill("CNEWS");await scan(page,"nom");
  });
  await check("aide contextuelle et Retour conservent le nom et rendent le focus",async()=>{
    const button=page.locator('#guided-dialog [data-help="states"]');await button.click();
    await expect(page.locator("#help-dialog")).toBeVisible();await expect(page.locator('[data-help-id="states"]')).toHaveAttribute("open","");
    await page.locator("#help-close").click();await expect(button).toBeFocused();
    await page.locator("#guided-next").click();await page.locator("#guided-back").click();await expect(page.locator("#guided-target")).toHaveValue("CNEWS");
  });
  await check("annuler le parcours ne modifie pas les données",async()=>{
    const before=await snapshot(page);await page.locator("#guided-cancel").click();assert.equal(await snapshot(page),before);await expect(page.locator("#guided-open")).toBeFocused();
  });
  async function choices(name,services,controls){
    await page.getByRole("button",{name:"Accueil",exact:true}).click();await page.locator("#guided-open").click();await page.locator("#guided-target").fill(name);await page.locator("#guided-next").click();
    for(const box of await page.locator('#guided-body input[type="checkbox"]').all())await box.setChecked(services.includes(await box.getAttribute("value")));
    await page.locator("#guided-next").click();for(const control of controls)await page.locator('#guided-body input[value="'+control+'"]').check();
  }
  async function finish(){await page.locator("#guided-save").click();await expect(page.locator("#guided-dialog")).not.toBeVisible();}
  await check("une source sur deux services : choix explicites, contrôles et limites sans identité inventée",async()=>{
    await choices("CNEWS",["discover","youtube","safari"],["discover:hide-source","youtube:dont-recommend-channel"]);
    await expect(page.locator("#guided-body")).toContainText("Non disponible");await scan(page,"actions");
    await page.locator("#guided-next").click();await expect(page.locator("#guided-body")).toContainText("2 nouvelle(s)");await scan(page,"recapitulatif");
    await page.locator("#guided-save").click();await expect(page.locator("#guided-dialog")).not.toBeVisible();await expect(page.locator("#flow-items > li")).toHaveCount(2);
    const state=JSON.parse(await snapshot(page));assert.equal(state.flows.items.length,2);assert.ok(state.flows.items.every(x=>x.target==="CNEWS"&&x.status==="planned"));
    for(const a of await page.locator("#flow-items a").all())assert.ok(!(await a.getAttribute("href")).includes("CNEWS"));
  });
  await check("déclaration reste explicite ; un doublon garde sa date et son historique",async()=>{
    page.once("dialog",d=>d.accept());await page.locator('[data-flow-action="declare"]').first().click();
    await expect.poll(async()=>JSON.parse(await snapshot(page)).flows.items[0].status).toBe("declared");
    const before=JSON.parse(await snapshot(page)).flows.items[0];assert.equal(before.status,"declared");
    await choices("cnews",["discover"],["discover:hide-source"]);await page.locator("#guided-next").click();await expect(page.locator("#guided-body")).toContainText("1 déjà présente");await expect(page.locator("#guided-body li")).toContainText("Déclaré effectué");await finish();
    assert.deepEqual(JSON.parse(await snapshot(page)).flows.items[0],before);
  });
  await check("carnet local sans service tiers et nom libre",async()=>{
    await choices("Ma source personnelle",["local"],["local:source-avoid"]);await page.locator("#guided-next").click();await finish();
    const i=JSON.parse(await snapshot(page)).flows.items.at(-1);assert.equal(i.target,"Ma source personnelle");assert.equal(i.status,"local");
  });
  await check("refus de stockage : aucune fiche partielle et brouillon conservé",async()=>{
    await choices("Source refusée",["local"],["local:source-avoid"]);await page.locator("#guided-next").click();const before=await snapshot(page);
    await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException("synthetic quota","QuotaExceededError");};});
    await page.locator("#guided-save").click();await expect(page.locator("#guided-error")).toContainText("brouillon est conservé");assert.equal(await snapshot(page),before);
    await page.locator("#guided-back").click();await page.locator("#guided-back").click();await page.locator("#guided-back").click();await expect(page.locator("#guided-target")).toHaveValue("Source refusée");await page.locator("#guided-cancel").click();await page.reload();
  });
  await check("FAQ gratuite : boutons, appareil, recherche accentuée et reprise",async()=>{
    await page.locator("#help-open").click();await page.locator("#help-system").selectOption("ios");await page.locator("#help-search").fill("iPhone");
    await expect(page.locator('[data-help-id="install-ios"]')).toBeVisible();await page.locator("#help-search").fill("VERIFIER");await expect(page.locator('[data-help-id="review"]')).toBeVisible();
    await scan(page,"aide");await page.locator("#help-close").click();await expect(page.locator("#help-open")).toBeFocused();
  });
  await check("soutien inactif : une seule entrée, aucun href ni appel à CONTRIB.OS",async()=>{
    await page.locator("footer summary").click();await expect(page.getByRole("button",{name:"Soutenir FIL CLAIR",exact:true})).toBeDisabled();
    assert.equal(await page.locator('[href*="contrib"]').count(),0);assert.deepEqual(external,[]);
  });
  await check("reflow320px, texte espacé et grands contrôles du parcours",async()=>{
    await page.setViewportSize({width:320,height:850});await page.locator("#guided-open").click();
    await page.locator("#guided-dialog p").evaluateAll(elements=>elements.forEach(e=>{e.style.lineHeight="1.5";e.style.letterSpacing=".12em";e.style.wordSpacing=".16em";e.style.marginBottom="2em";}));
    assert.ok(await page.locator("#guided-body p").first().evaluate(e=>parseFloat(getComputedStyle(e).letterSpacing)>0),"Text spacing must really be applied");
    assert.ok(await page.locator("#guided-dialog").evaluate(e=>e.scrollWidth<=e.clientWidth+1));
    for(const id of ["guided-next","guided-cancel"]){const box=await page.locator("#"+id).boundingBox();assert.ok(box.height>=44,id);}
    await scan(page,"reflow");await page.locator("#guided-cancel").click();
  });
  await check("offline réel : carnet, nouveau parcours et aide restent disponibles",async()=>{
    await server.pause();await context.setOffline(true);await page.reload({waitUntil:"load"});assert.equal(await page.evaluate(()=>navigator.onLine),false);
    assert.equal(await page.locator(".skip").evaluate(e=>getComputedStyle(e).position),"absolute","Public CSS must remain available offline, not just HTML and JS");
    await page.locator("#help-open").click();await expect(page.locator("#help-results details")).toHaveCount(13);await page.locator("#help-close").click();
    await choices("Note hors ligne",["local"],["local:source-avoid"]);await page.locator("#guided-next").click();await finish();assert.equal(JSON.parse(await snapshot(page)).flows.items.at(-1).target,"Note hors ligne");
    await context.setOffline(false);await server.resume();
  });
  await check("URL de soutien validée synthétique : destination fixe, pas de référent et panne sans effet local",async()=>{
    const other=await browser.newContext({viewport:{width:390,height:844}}),p=await other.newPage(),out=[];
    await other.route("**/support-config.js",async route=>{
      const source=await readFile("pwa/support-config.js","utf8");await route.fulfill({contentType:"text/javascript",body:source.replace("url:null,validatedAt:null",'url:"https://contrib.example/projects/fil-clair",validatedAt:"2026-10-29"')});
    });
    await other.route("https://contrib.example/**",async route=>{out.push({url:route.request().url(),headers:route.request().headers()});await route.abort();});
    await p.goto(server.url,{waitUntil:"networkidle"});await p.locator("footer summary").click();const raw=await snapshot(p);
    await expect(p.locator("#support-link")).toHaveAttribute("href","https://contrib.example/projects/fil-clair");await expect(p.locator("#support-link")).toHaveAttribute("rel","noopener noreferrer");
    const popupPromise=other.waitForEvent("page");await p.locator("#support-link").click();const popup=await popupPromise;await expect.poll(()=>out.length).toBe(1);
    assert.equal(out[0].headers.referer,undefined);assert.equal(out[0].headers.cookie,undefined);assert.equal(out[0].url,"https://contrib.example/projects/fil-clair");await popup.close();
    await p.locator("#guided-open").click();await expect(p.locator("#guided-dialog")).toBeVisible();assert.equal(await snapshot(p),raw);await other.close();
  });
  await check("remplacement d’espace : recherche d’aide et brouillons de l’ancien espace effacés",async()=>{
    await page.locator("#help-open").click();await page.locator("#help-search").fill("SENSITIVE SYNTHETIC QUERY");await page.locator("#help-close").click();
    await page.getByRole("button",{name:"Réglages",exact:true}).click();page.once("dialog",d=>d.accept());await page.locator("#erase").click();
    await expect(page.locator("#help-search")).toHaveValue("");await expect.poll(async()=>JSON.parse(await snapshot(page)).flows?.items?.length||0).toBe(0);
    await page.locator("#guided-open").click();await expect(page.locator("#guided-target")).toHaveValue("");await page.locator("#guided-cancel").click();
  });
  await check("enregistrement lent : navigation et aide figées jusqu’au résultat, aucun nouveau brouillon perdu",async()=>{
    await choices("Source en cours",["local"],["local:source-avoid"]);await page.locator("#guided-next").click();
    await page.evaluate(()=>{
      const original=navigator.locks.request.bind(navigator.locks);
      navigator.locks.request=(...args)=>new Promise((resolve,reject)=>{window.qaResumeSave=()=>original(...args).then(resolve,reject);});
    });
    await page.locator("#guided-save").click();await expect.poll(()=>page.evaluate(()=>typeof window.qaResumeSave)).toBe("function");
    for(const selector of ["#guided-back","#guided-cancel","#guided-next",'#guided-dialog [data-help]'])await expect(page.locator(selector)).toBeDisabled();
    await page.keyboard.press("Escape");await expect(page.locator("#guided-dialog")).toBeVisible();
    await page.evaluate(()=>window.qaResumeSave());await expect(page.locator("#guided-dialog")).not.toBeVisible();assert.equal(JSON.parse(await snapshot(page)).flows.items.at(-1).target,"Source en cours");
  });
  if(process.env.PWA_CAPTURE_DIR){await mkdir(process.env.PWA_CAPTURE_DIR,{recursive:true});await page.getByRole("button",{name:"Accueil",exact:true}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:process.env.PWA_CAPTURE_DIR+"/home-390.png",fullPage:true});await page.locator("#guided-open").click();await page.locator("#guided-target").fill("CNEWS");await page.screenshot({path:process.env.PWA_CAPTURE_DIR+"/guided-390.png"});}
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await context.close();
  console.log(JSON.stringify({result:"PASS",checks:checks.length,names:checks}));
}finally{await browser?.close();if(server.listening())await server.close();}
