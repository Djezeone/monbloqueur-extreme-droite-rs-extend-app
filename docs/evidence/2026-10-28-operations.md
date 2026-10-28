# Preuve locale — confidentialité et opérations FIL CLAIR

Date : **2026-10-28**. Répertoire d’exécution : `/workspace/scratch/0729b58f0643/fil-clair`. Commit de référence initial : `ee515c17a736ceb865c605eacc9aee37a9776c7a`. Le cœur avait des modifications locales : **l’empreinte du fichier testé ci-dessous identifie le snapshot réellement exercé, pas ce seul commit**.

## FAIT

- Création de `docs/PRIVACY_ASSESSMENT.md`, `docs/OPERATIONS.md` et `pwa/privacy.html`.
- Lecture de la mission, du plan, du code PWA et des sources primaires citées dans les documents. CNIL/EDPB/Vercel vérifiés par recherche puis ouverture des pages officielles. Le texte RGPD a été vérifié sur la reproduction officielle CNIL ; EUR-Lex renvoyait un écran robot. L’index G29 a été ouvert ; son PDF n’a pas pu être lu par l’outil, limite déclarée.
- Aucun compte social, token, secret, compte utilisateur, publication, déploiement, rollback externe, CI GitHub ou achat utilisé dans ces exercices. Aucun script permanent n’a été ajouté au dépôt pour ce drill.

## VÉRIFIÉ COMMENT — drill de données

Commande réellement exécutée, code de sortie **0**. Le script copie le module courant dans un répertoire temporaire et ne modifie pas le dépôt. `Map` simule le stockage de l’application ; il ne s’agit pas d’un accès au `localStorage` d’un utilisateur.

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const sha = value => createHash('sha256').update(value).digest('hex');
const coreBytes = await readFile('pwa/core.js');
const folder = await mkdtemp(join(tmpdir(), 'fil-clair-ops-'));
const snapshot = join(folder, 'core.mjs');
let networkAttempts = 0;
globalThis.fetch = async () => { networkAttempts++; throw Error('NETWORK_FORBIDDEN'); };
console.log('runtime=' + process.version);
console.log('core_sha256=' + sha(coreBytes));
try {
  await writeFile(snapshot, coreBytes);
  const core = await import(pathToFileURL(snapshot));
  const a = { network:'x', handle:'drill_alpha' };
  const b = { network:'mastodon', handle:'drill_beta', instance:'social.example' };
  const at = Date.parse('2026-10-28T00:00:00Z');
  const list = { id:'drill', title:'Exercice synthétique', accounts:[a,b], revision:'drill-1',
    provenance:{ label:'Fixture locale', url:'https://example.invalid/list.json', retrievedAt:at } };
  let state = { ...core.newState(), activeList:'drill', lists:[...core.newState().lists,list] };
  state = core.markDecision(state, 'drill', a, 'blocked', at);
  state = core.markDecision(state, 'drill', b, 'muted', at+1);
  const storage = new Map([['fil-clair-v1',JSON.stringify(state)]]);
  const raw = JSON.stringify(state, null, 2);
  const backupFile = join(folder, 'synthetic-backup.json');
  await writeFile(backupFile, raw);
  const diskBackup = await readFile(backupFile, 'utf8');
  assert.equal(sha(diskBackup),sha(raw));
  console.log('backup_disk_sha256=' + sha(diskBackup));
  const restored = core.parseBackup(diskBackup);
  assert.deepEqual(JSON.parse(JSON.stringify(restored)),JSON.parse(JSON.stringify(state)));
  console.log('restore_roundtrip=verified lists=2 profiles=2 declarations=2 history=2');
  const imported = core.parseImport(JSON.stringify(core.exportList(list)));
  assert.equal(imported.revision,'drill-1');
  assert.deepEqual(imported.provenance,list.provenance);
  assert.deepEqual(imported.accounts,list.accounts);
  assert.equal(Object.hasOwn(imported,'decisions'),false);
  console.log('list_export_import=verified provenance_revision_preserved=true decisions_included=false');
  const before = storage.get('fil-clair-v1');
  const truncated = diskBackup.slice(0,-7);
  const applyBackup = text => {
    const next = core.parseBackup(text);
    storage.set('fil-clair-v1',JSON.stringify(next));
    return next;
  };
  assert.throws(() => applyBackup(truncated), /Sauvegarde JSON illisible/);
  assert.equal(storage.get('fil-clair-v1'),before);
  const failedStartup = core.loadState(truncated);
  assert.equal(failedStartup.ok,false);
  assert.equal(failedStartup.state,null);
  assert.equal(failedStartup.raw,truncated);
  console.log('corruption=refused prior_simulated_storage_unchanged=true raw_recovery_preserved=true');
  const firstKey = core.decisionKey('drill',a);
  const removed = core.removeAccount(restored,'drill',a);
  assert.equal(Object.hasOwn(removed.decisions,firstKey),false);
  assert.equal(Object.keys(removed.decisions).length,1);
  assert.equal(removed.history.length,2);
  const readded = { ...removed, lists:removed.lists.map(item => item.id==='drill' ? { ...item, accounts:[...item.accounts,a] } : item) };
  assert.equal(Object.hasOwn(readded.decisions,firstKey),false);
  const deletedList = core.removeList(readded,'drill');
  assert.equal(Object.keys(deletedList.decisions).length,0);
  assert.equal(deletedList.history.length,2);
  console.log('removal=verified declaration_not_resurrected=true history_retained=2');
  storage.set('fil-clair-v1',JSON.stringify(core.newState()));
  const erased = core.parseBackup(storage.get('fil-clair-v1'));
  assert.equal(erased.lists.reduce((n,item)=>n+item.accounts.length,0),0);
  assert.equal(Object.keys(erased.decisions).length,0);
  assert.equal(erased.history.length,0);
  assert.equal((await readFile(backupFile,'utf8')),diskBackup);
  console.log('global_reset=verified profiles=0 declarations=0 history=0 downloaded_copy_unaffected=true');
  const reapplied = applyBackup(diskBackup);
  assert.deepEqual(JSON.parse(JSON.stringify(reapplied)),JSON.parse(JSON.stringify(state)));
  const fakeConfirmed = JSON.parse(diskBackup);
  fakeConfirmed.decisions[firstKey].status='confirmed';
  assert.throws(()=>core.parseBackup(JSON.stringify(fakeConfirmed)),/Décision de sauvegarde incorrecte/);
  const extraEvidence = JSON.parse(diskBackup);
  extraEvidence.decisions[firstKey].providerConfirmed=true;
  const sanitised = core.parseBackup(JSON.stringify(extraEvidence));
  assert.equal(Object.hasOwn(sanitised.decisions[firstKey],'providerConfirmed'),false);
  console.log('recovery=verified declarations_restored=true imported_confirmation_rejected=true foreign_evidence_removed=true');
  assert.equal(networkAttempts,0);
  console.log('network_attempts=' + networkAttempts);
} finally {
  await rm(folder,{recursive:true,force:true});
  await assert.rejects(access(folder));
  console.log('temporary_files_removed=true');
}
NODE
```

Sortie exacte :

```text
runtime=v24.22.1
core_sha256=7f9273fb801d4a7d3017369ae05f5319677e7286a2aeea38b66e65781f0fbc44
backup_disk_sha256=ffac1ebe4befc3797a152afbcf165cee0e95b729e7b3d31e98407c64061ce069
restore_roundtrip=verified lists=2 profiles=2 declarations=2 history=2
list_export_import=verified provenance_revision_preserved=true decisions_included=false
corruption=refused prior_simulated_storage_unchanged=true raw_recovery_preserved=true
removal=verified declaration_not_resurrected=true history_retained=2
global_reset=verified profiles=0 declarations=0 history=0 downloaded_copy_unaffected=true
recovery=verified declarations_restored=true imported_confirmation_rejected=true foreign_evidence_removed=true
network_attempts=0
temporary_files_removed=true
```

Ce résultat démontre le comportement de ces helpers sur cette fixture : la conservation d’historique au retrait et la survie de l’export lors d’un reset sont **des limites d’effacement documentées**, pas des effacements complets de toutes les copies. Le test n’exécute pas l’interface utilisateur ni une restauration externe. Le remplacement de `fetch` détecte les appels à cette fonction ; le module copié ne contient aucun autre transport réseau.

## VÉRIFIÉ COMMENT — notice sans JavaScript et reflow

Contrôle ciblé de `pwa/privacy.html`, commande exécutée avec code de sortie **0**. Serveur éphémère lié uniquement à `127.0.0.1`. Aucun fichier autre que la page n’est servi ; les tentatives de chargement hors origine sont bloquées et comptées. JavaScript désactivé dans le contexte navigateur. Ce contrôle ne porte pas sur l’application PWA ni sur la protection Vercel.

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const html = await readFile('pwa/privacy.html','utf8');
assert.equal(/<script\b/i.test(html),false);
assert.equal(/<link\b|<img\b|<iframe\b|<form\b/i.test(html),false);
const server = createServer((req,res)=>{
  if(req.url !== '/privacy.html') { res.writeHead(404); res.end(); return; }
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  res.end(html);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({headless:true});
const temporary = await mkdtemp(join(tmpdir(),'fil-clair-privacy-'));
let externalAttempts = 0;
try {
  const context = await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:760}});
  await context.route('**/*',route=>{
    if(!route.request().url().startsWith(base + '/')) { externalAttempts++; return route.abort(); }
    return route.continue();
  });
  const page = await context.newPage();
  await page.goto(base + '/privacy.html',{waitUntil:'networkidle'});
  assert.equal(await page.getAttribute('html','lang'),'fr');
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.getByRole('heading',{name:'Vos données, vos choix'}).isVisible(),true);
  assert.equal(await page.locator('header a').getAttribute('href'),'./');
  assert.equal(await page.locator('a[href="#contenu"]').count(),1);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('href'),'#contenu');
  await page.keyboard.press('Enter');
  assert.equal(new URL(page.url()).hash,'#contenu');
  const widths = await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  assert.equal(widths.document <= widths.viewport,true);
  assert.equal(await page.locator('script').count(),0);
  assert.equal(externalAttempts,0);
  await page.screenshot({path:join(temporary,'privacy-320.png'),fullPage:true});
  await page.setViewportSize({width:1280,height:900});
  const desktop = await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  assert.equal(desktop.document <= desktop.viewport,true);
  console.log('browser=' + browser.version());
  console.log('privacy_page=verified javascript_disabled=true lang=fr h1=1 return_href=./');
  console.log('keyboard_skip_link=verified');
  console.log('reflow_320=' + widths.document + '/' + widths.viewport + ' reflow_1280=' + desktop.document + '/' + desktop.viewport);
  console.log('scripts=0 external_resource_elements=0 external_attempts=' + externalAttempts);
  console.log('screenshot=' + join(temporary,'privacy-320.png'));
  await context.close();
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
NODE
```

Sortie exacte :

```text
browser=156.0.8078.4
privacy_page=verified javascript_disabled=true lang=fr h1=1 return_href=./
keyboard_skip_link=verified
reflow_320=320/320 reflow_1280=1280/1280
scripts=0 external_resource_elements=0 external_attempts=0
screenshot=/tmp/fil-clair-privacy-ihgPl6/privacy-320.png
```

Capture de 320 px ouverte pour inspection visuelle : texte et titres sur fond sombre, notice de statut délimitée, sections et liens visibles, aucune coupure horizontale observée. La capture est un intermédiaire reproductible ; elle ne remplace pas une vérification lecteur d’écran, les contrastes mesurés ou l’audit WCAG 2.2 AA complet.

### Correction sémantique et nettoyage

La revue parallèle a signalé que `aria-labelledby` était porté par un `div` générique. Ajout de `role="note"` sur le seul encadré de statut ; aucun changement de contenu ou géométrie. Le contrôle navigateur ci-dessus précède cette modification. La [preuve QA PWA](2026-10-28-pwa-qa.md) consigne ensuite un scan de la notice après correction sur chacun des trois moteurs : zéro violation et zéro résultat incomplet pour le fichier d’empreinte `03f418f8f0616b825c4d8e23c5c52f37066ec6288718a2a9560cee9ee2d39514`. La microprécision de récupération ajoutée plus bas change l’empreinte de contenu et appelle son contrôle ciblé.

Commande suivante exécutée avec code de sortie **0** pour relire l’empreinte core, vérifier ce rôle et retirer la capture intermédiaire :

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import {readFile,rm,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=v=>createHash('sha256').update(v).digest('hex');
const core=await readFile('pwa/core.js');
const page=await readFile('pwa/privacy.html','utf8');
assert.equal(sha(core),'7f9273fb801d4a7d3017369ae05f5319677e7286a2aeea38b66e65781f0fbc44');
assert.match(page,/class="status" role="note" aria-labelledby="statut"/);
assert.equal(/<script\b|<link\b|<img\b|<iframe\b|<form\b/i.test(page),false);
await rm('/tmp/fil-clair-privacy-ihgPl6',{recursive:true,force:true});
await assert.rejects(access('/tmp/fil-clair-privacy-ihgPl6'));
console.log('core_snapshot_unchanged=true privacy_note_role=verified external_resource_elements=0 screenshot_temp_removed=true');
console.log('privacy_sha256='+sha(page));
NODE
```

Sortie exacte :

```text
core_snapshot_unchanged=true privacy_note_role=verified external_resource_elements=0 screenshot_temp_removed=true
privacy_sha256=03f418f8f0616b825c4d8e23c5c52f37066ec6288718a2a9560cee9ee2d39514
```

`git diff --check -- docs/PRIVACY_ASSESSMENT.md docs/OPERATIONS.md pwa/privacy.html docs/evidence/2026-10-28-operations.md` a aussi retourné **0**, sans sortie, avant cet ajout de preuve. Les fichiers étaient nouveaux et non indexés ; ce contrôle ne constitue pas à lui seul un lint complet de leur contenu.

Contrôle complémentaire des quatre nouveaux fichiers, exécuté avec code de sortie **0** :

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
const files=['docs/PRIVACY_ASSESSMENT.md','docs/OPERATIONS.md','pwa/privacy.html','docs/evidence/2026-10-28-operations.md'];
let localLinks=0;
for(const path of files) {
  const text=await readFile(path,'utf8');
  assert.equal(/[\t ]+$/m.test(text),false,path+' trailing whitespace');
  assert.equal(text.endsWith('\n'),true,path+' missing final newline');
  if(path.endsWith('.md')) for(const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target=match[1];
    if(/^(?:https?:|#)/.test(target)) continue;
    await access(resolve(dirname(path),target.split('#')[0]));
    localLinks++;
  }
}
console.log('documentation_lint=verified files='+files.length+' trailing_whitespace=0 final_newlines=4 local_links='+localLinks+' local_link_errors=0');
NODE
```

Sortie exacte :

```text
documentation_lint=verified files=4 trailing_whitespace=0 final_newlines=4 local_links=3 local_link_errors=0
```

## Concordance relue après intégration applicative

Relecture en lecture seule de `app.js`, `core.js`, `sw.js`, `index.html`, `vercel.json` et de la [preuve QA intégrée](2026-10-28-pwa-qa.md). Le code appelle maintenant `loadState`, préserve la source illisible, bloque les écritures ordinaires pendant la récupération, utilise `exportList` et les helpers de suppression. Le téléchargement public est figé à la révision Git `b7cd31b036cca17b48dbf726c047847191c01a5b`. Le worker v3 utilise `Cache.addAll` et son allowlist exacte, sans ajout dynamique.

Les contrôles locaux d’intégration documentés par le volet QA couvrent Chromium, Firefox et WebKit : données, refus/quota de stockage, récupération brute, shell et notice hors ligne. Les anciens résultats rouges sont conservés comme historique dans ce journal séparé ; ils ne décrivent plus l’intégration testée. Aucune suite de navigateur ni aucun drill n’a été rejoué par ce volet de confidentialité.

Avec accord du parent, seule une microprécision de contenu a été ajoutée à la notice : en cas de corruption, l’export `fil-clair-recuperation.json` conserve un texte brut qui n’est pas une sauvegarde validée. **Le style n’a pas été modifié.** Nouveau SHA-256 de la notice communiqué au volet QA pour contrôle ciblé : `1450ce7a19fb753cafc9336ae1969db4164af52b8dfc423b2ab5b67c0aad8943`.

Commande de concordance et lint exécutée avec code de sortie **0** ; elle ne rejoue pas le drill :

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const hex=value=>createHash('sha256').update(value).digest('hex');
const core=await readFile('pwa/core.js');
assert.equal(hex(core),'7f9273fb801d4a7d3017369ae05f5319677e7286a2aeea38b66e65781f0fbc44');
const privacy=await readFile('pwa/privacy.html','utf8');
const style=privacy.match(/<style>([\s\S]*?)<\/style>/)[1];
const styleHash=createHash('sha256').update(style).digest('base64');
const config=JSON.parse(await readFile('pwa/vercel.json','utf8'));
const csp=config.headers[0].headers.find(header=>header.key==='Content-Security-Policy').value;
assert.equal(csp.includes("'sha256-"+styleHash+"'"),true);
let localLinks=0;
for(const path of ['docs/PRIVACY_ASSESSMENT.md','docs/OPERATIONS.md','pwa/privacy.html','docs/evidence/2026-10-28-operations.md']) {
  const text=await readFile(path,'utf8');
  assert.equal(/[\t ]+$/m.test(text),false);
  assert.equal(text.endsWith('\n'),true);
  if(path.endsWith('.md')) for(const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    if(/^(?:https?:|#)/.test(match[1])) continue;
    await access(resolve(dirname(path),match[1].split('#')[0]));
    localLinks++;
  }
}
console.log('core_drill_snapshot_unchanged=true');
console.log('privacy_sha256='+hex(privacy));
console.log('privacy_style_sha256_base64='+styleHash);
console.log('vercel_csp_style_hash_matches=true');
console.log('documentation_lint=verified files=4 local_links='+localLinks+' local_link_errors=0');
NODE
```

Sortie exacte, avant ajout de la présente section de preuve :

```text
core_drill_snapshot_unchanged=true
privacy_sha256=1450ce7a19fb753cafc9336ae1969db4164af52b8dfc423b2ab5b67c0aad8943
privacy_style_sha256_base64=WgJYcvyeVh7U19+HFV3JagErfGwKnuE7D3Uu/M1Hyk4=
vercel_csp_style_hash_matches=true
documentation_lint=verified files=4 local_links=5 local_link_errors=0
```

## OUVERT

- Identité et coordonnées du responsable, contact droits/support, bases légales et qualification article 9.
- AIPD complète ou décision motivée du responsable ; ce dossier ne prononce aucune exemption ni conformité acquise.
- Contrat, accès, région/transferts et rétention effective des journaux de l’hébergeur ; protection et provenance du déploiement au SHA final.
- OAuth officiel de production et comptes de test ; consentement/révocation testés chez le fournisseur. Aucun résultat réel revendiqué.
- Recette Android/iOS sur appareils physiques et audit WCAG complet. Les scénarios locaux de stockage/cache/quota/récupération intégrés sont désormais consignés dans la preuve QA distincte ; ils ne remplacent pas ces gates physiques et humains.
- Rollback fournisseur et temps de reprise réel ; seuls la procédure et le drill local sont disponibles.
- CI/revue finale à l’exact SHA de livraison. Aucune CI exécutée dans ce lot et aucun Go global prononcé.

## PÉRIMÉ / règle de réexamen

Toute modification de `pwa/core.js` après l’empreinte ci-dessus rend la preuve de drill insuffisante pour ce nouveau fichier. Toute modification de la notice après son contrôle navigateur exige au minimum une relecture des faits et du reflow affecté. Les tests locaux ne sont pas attribuables à un déploiement sans preuve supplémentaire de provenance. Les critères de publication demeurent ouverts.
