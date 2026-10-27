import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {cp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),scratch=new URL(`../../../work/browser-test-${Date.now()}/`,import.meta.url);
const fixture=new URL('extension/',scratch),profile=new URL('profile/',scratch);
await mkdir(scratch,{recursive:true});await cp(new URL('extension/',root),fixture,{recursive:true});
const accounts=[{id:'11',username:'CompteTest_A'},{id:'12',username:'CompteTest_B'},{id:'13',username:'CompteTest_C'}];
const original=await readFile(new URL('background.js',fixture),'utf8');
await writeFile(new URL('background.js',fixture),`
const createTestTab=chrome.tabs.create.bind(chrome.tabs);
chrome.tabs.create=async options=>{
 const tab=await createTestTab({...options,url:'about:blank'});
 await new Promise(resolve=>setTimeout(resolve,500));
 return chrome.tabs.update(tab.id,{url:options.url});
};
globalThis.fetch=async()=>{
 const {testList}=await chrome.storage.session.get('testList');
 return new Response(JSON.stringify(testList||{schemaVersion:1,version:'DEMONSTRATION',accounts:${JSON.stringify(accounts)}}));
};
${original}`);
const path=fileURLToPath(fixture);
const channel=process.env.TEST_BROWSER_CHANNEL||'chromium';
const context=await chromium.launchPersistentContext(fileURLToPath(profile),{channel,headless:true,ignoreDefaultArgs:['--disable-extensions'],viewport:{width:330,height:650},args:[`--disable-extensions-except=${path}`,`--load-extension=${path}`]});
const blocked=[],errors=[];
let owner='CompteDeTest';
function sitePage(url){
 const handle=new URL(url).pathname.slice(1),account=accounts.find(a=>a.username===handle);
 if(!account)return `<a href="/${owner}" data-testid="AppTabBar_Profile_Link">Profil</a><main>Accueil de test</main>`;
 if(handle==='CompteTest_C')return `<a href="/${owner}" data-testid="AppTabBar_Profile_Link">Profil</a><main><div data-testid="emptyState">Ce compte n’existe pas</div></main>`;
 const already=handle==='CompteTest_B';
 return `<!doctype html><html><meta charset="utf-8"><body>
 <a href="/${owner}" data-testid="AppTabBar_Profile_Link">Profil</a><main>
 <div data-testid="UserName">Compte de test @${handle}</div>
 <button id="state" data-testid="${account.id}-${already?'unblock':'follow'}">${already?'Bloqué':'Suivre'}</button>
 <button id="more" data-testid="userActions">Plus</button>
 <div id="menu" role="menu" hidden><button id="action" role="menuitem" data-testid="block">${already?'Débloquer':'Bloquer'} @${handle}</button></div>
 <div id="dialog" role="dialog" aria-modal="true" hidden>Bloquer @${handle} ?<button id="confirm" data-testid="confirmationSheetConfirm">Bloquer</button></div></main>
 <script>
 document.getElementById('more').onclick=()=>document.getElementById('menu').hidden=false;
 document.getElementById('action').onclick=()=>{document.getElementById('menu').hidden=true;document.getElementById('dialog').hidden=false;};
 document.getElementById('confirm').onclick=()=>{document.getElementById('dialog').hidden=true;const state=document.getElementById('state');state.dataset.testid='${account.id}-unblock';state.textContent='Bloqué';fetch('/__test__/blocked?username=${handle}');};
 </script></body></html>`;
}
await context.route('https://x.com/**',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname==='/__test__/blocked'){blocked.push(url.searchParams.get('username'));return route.fulfill({body:'ok'});}
 return route.fulfill({contentType:'text/html; charset=utf-8',body:sitePage(url.href)});
});
try {
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
 const id=new URL(worker.url()).host;
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`chrome-extension://${id}/popup.html`);
 await page.getByText('3 comptes dans la liste.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Bloquer l’Extrême-droite',exact:true}).click();
 await page.getByText('2 compte(s) bloqué(s), 1 compte(s) indisponible(s).',{exact:true}).waitFor({timeout:30000});
 const job=await worker.evaluate(async()=> (await chrome.storage.local.get('job')).job);
 assert.equal(job.confirmed,2);assert.equal(job.failed.length,1);assert.equal(job.status,'done');
 assert.deepEqual(blocked,['CompteTest_A']);
 assert.equal(context.pages().filter(p=>p.url().startsWith('https://x.com/')).length,0);
 await page.close();const reopened=await context.newPage();await reopened.goto(`chrome-extension://${id}/popup.html`);
 await reopened.getByText('2 compte(s) bloqué(s), 1 compte(s) indisponible(s).',{exact:true}).waitFor();
 await mkdir(new URL('verification/',root),{recursive:true});
 await reopened.screenshot({path:fileURLToPath(new URL('verification/interface-minimaliste.png',root)),fullPage:true});
 // Une identité incohérente doit suspendre, sans cliquer sur Bloquer.
 await worker.evaluate(async()=>{await chrome.storage.session.set({testList:{schemaVersion:1,version:'IDENTITE-INCORRECTE',accounts:[{id:'999',username:'CompteTest_A'}]}});});
 await reopened.getByRole('button',{name:'Bloquer l’Extrême-droite',exact:true}).click();
 await reopened.getByText('X ne permet pas de vérifier l’identité de ce profil. Le blocage est en pause.',{exact:true}).waitFor({timeout:15000});
 assert.deepEqual(blocked,['CompteTest_A']);
 await reopened.getByRole('button',{name:'Arrêter',exact:true}).click();
 await reopened.getByText('Arrêté. Les blocages déjà faits restent actifs.',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 await writeFile(new URL('verification/navigateur.json',root),JSON.stringify({date:new Date().toISOString(),browser:channel,version:context.browser()?.version(),network:'Pages X et liste simulées, aucun compte réel modifié',checks:['manifeste MV3 et scripts de contenu chargés','un clic sur le bouton principal','détection du compte déjà connecté','menu de profil et confirmation de blocage','compte déjà bloqué ignoré sans déblocage','compte indisponible conservé au bilan','onglet de travail fermé à la fin','progression conservée après fermeture du popup','identifiant incorrect : arrêt sans blocage','bouton Arrêter et aucune erreur JavaScript'],result:'10 contrôles réussis'},null,2));
 console.log('10 contrôles navigateur réussis. Capture : verification/interface-minimaliste.png');
} catch(error) {
 const worker=context.serviceWorkers()[0];
 console.error('État au moment de l’échec :',await worker?.evaluate(async()=>await chrome.storage.local.get('job')));
 for(const page of context.pages())console.error('Page :',page.url(),(await page.locator('body').innerText().catch(()=>'' )).slice(0,1800));
 throw error;
} finally {await context.close();}
