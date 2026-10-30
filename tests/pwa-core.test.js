import test from "node:test";
import assert from "node:assert/strict";
import { normalise, profileUrl, accountKey, uniqueAccounts, parseImport, restoreState, newState, markDecision, progress, parseBackup, MAX_BACKUP_BYTES } from "../pwa/core.js";
import * as core from "../pwa/core.js";

test("10 réseaux, URL HTTPS officielle et dédoublonnage", () => {
  const cases = [
    ["x", "https://x.com/Alice"],
    ["bluesky", "https://bsky.app/profile/Alice"],
    ["instagram", "https://www.instagram.com/Alice/"],
    ["threads", "https://www.threads.com/@Alice"],
    ["tiktok", "https://www.tiktok.com/@Alice"],
    ["facebook", "https://www.facebook.com/Alice"],
    ["youtube", "https://www.youtube.com/@Alice"],
    ["reddit", "https://www.reddit.com/user/Alice/"],
    ["linkedin", "https://www.linkedin.com/in/Alice/"]
  ];
  for (const [network, expected] of cases) assert.equal(profileUrl({network,handle:"Alice"}),expected);
  assert.equal(profileUrl({network:"mastodon",handle:"Alice",instance:"mastodon.social"}),"https://mastodon.social/@Alice");
  assert.equal(uniqueAccounts([{network:"x",handle:"Alice"},{network:"x",handle:"alice"}]).length,1);
  assert.equal(accountKey({network:"x",handle:"Alice"}),accountKey({network:"x",handle:"alice"}));
});
test("refus des chemins, pseudo invalide, mauvais domaines Mastodon et XSS", () => {
  for (const input of [
    {network:"x",handle:"alice/other"},
    {network:"x",handle:"this_handle_is_far_too_long"},
    {network:"instagram",handle:"<img src=x onerror=alert(1)>"},
    {network:"mastodon",handle:"alice",instance:"bad.test/path"},
    {network:"mastodon",handle:"alice",instance:"127.0.0.1"},
    {network:"mastodon",handle:"alice",instance:"site.com:444"}
  ]) assert.throws(() => normalise(input));
  assert.throws(()=>normalise({network:"unknown",handle:"alice"}));
});
test("import liste X v1, import autonome v1, limite de taille", () => {
  const x=parseImport(JSON.stringify({schemaVersion:1,version:"x",accounts:[{id:"1",username:"Alice"},{id:"2",username:"alice"}]}));
  assert.equal(x.accounts.length,1);
  const local=parseImport(JSON.stringify({format:"fil-clair-v1",title:"Test",accounts:[{network:"tiktok",handle:"bob"}]}));
  assert.equal(local.accounts[0].network,"tiktok");
  assert.throws(()=>parseImport("not json"));
  assert.throws(()=>parseImport("x".repeat(2_000_001)));
});
test("historique explicite réversible et progression séparée par liste", () => {
  const a={network:"x",handle:"alice"};
  let s=newState();
  s.lists[0].accounts=[a];
  s=markDecision(s,"personal",a,"blocked",1000);
  assert.deepEqual(progress(s,s.lists[0]),{total:1,blocked:1,muted:0,skipped:0,remaining:0});
  assert.equal(s.history.length,1);
  s=markDecision(s,"personal",a,"todo",2000);
  assert.equal(progress(s,s.lists[0]).remaining,1);
  assert.equal(s.history.length,2);
  assert.equal(restoreState(JSON.stringify(s)).history.length,2);
  assert.throws(() => restoreState("bad"));
});

test("seule l'absence de stockage crée un état neuf au démarrage", () => {
  assert.deepEqual(restoreState(null), newState());
  assert.deepEqual(restoreState(undefined), newState());
  for (const text of ["", " ", "null", "[]", "{}", "{broken"]) {
    assert.throws(() => restoreState(text), "Une donnée existante illisible doit rester récupérable.");
  }
});

test("le démarrage refuse une structure corrompue au lieu de réparer et perdre des données", () => {
  const a = { network:"x", handle:"alice" };
  const base = newState();
  base.lists[0].accounts = [a];
  const corruptions = [
    { ...base, activeList:"missing" },
    { ...base, lists:[{ ...base.lists[0], id:"bad|id" }] },
    { ...base, lists:[base.lists[0], base.lists[0]] },
    { ...base, decisions:{ "personal|x::alice":{ status:"blocked", at:null } } },
    { ...base, history:[{ key:"personal|x::alice", status:"blocked", at:null }] },
    { ...base, history:Array.from({ length:1001 }, () => ({ key:"personal|x::alice", status:"review", at:1000 })) }
  ];
  for (const input of corruptions) assert.throws(() => restoreState(JSON.stringify(input)));
});

test("loadState rend la corruption originale exportable sans proposer un état vide à enregistrer", () => {
  assert.equal(typeof core.loadState, "function");
  const text = '{"version":1,"lists":[{"id":"personal","title":"Données à récupérer"}]}';
  const loaded = core.loadState(text);
  assert.equal(loaded.ok, false);
  assert.equal(loaded.state, null);
  assert.equal(loaded.raw, text);
  assert.equal(typeof loaded.error, "string");
  assert.ok(loaded.error.length > 0);
  assert.deepEqual(core.loadState(null), { ok:true, state:newState() });
  const valid = core.loadState(JSON.stringify(newState()));
  assert.equal(valid.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(valid.state)), newState());
});

test("une sauvegarde corrompue ne peut pas déclencher une restauration vide", () => {
  assert.throws(() => parseBackup("{not json"));
  assert.throws(() => parseBackup("{}"));
  assert.throws(() => parseBackup(JSON.stringify({version:1, lists:[], activeList:"personal", decisions:{}, history:[]})));
  assert.throws(() => parseBackup("x".repeat(MAX_BACKUP_BYTES+1)));
  const valid=newState();
  const restored=parseBackup(JSON.stringify(valid));
  assert.equal(restored.activeList,"personal");
  assert.equal(restored.lists.length,1);
  const poisoned={...valid, activeList:"missing"};
  assert.throws(()=>parseBackup(JSON.stringify(poisoned)));
  const dup={...valid,lists:[valid.lists[0],valid.lists[0]]};
  assert.throws(()=>parseBackup(JSON.stringify(dup)));
});
test("un statut à vérifier ne compte pas comme blocage confirmé", () => {
  const a={network:"x",handle:"alice"};
  let s=newState();
  s.lists[0].accounts=[a];
  s=markDecision(s,"personal",a,"review");
  assert.equal(progress(s,s.lists[0]).remaining,1);
  assert.equal(parseBackup(JSON.stringify(s)).decisions["personal|x::alice"].status,"review");
});

test("les révisions et provenances de listes survivent à import, export et sauvegarde v1", () => {
  assert.equal(typeof core.exportList, "function");
  const provenance = { label:"Sélection collective", url:"https://example.org/liste.json", retrievedAt:1793145600000 };
  const source = { format:"fil-clair-v1", title:"À examiner", accounts:[{ network:"x", handle:"alice" }], revision:"2026-10-28.2", provenance };
  const imported = parseImport(JSON.stringify(source));
  assert.equal(imported.revision, "2026-10-28.2");
  assert.deepEqual(imported.provenance, provenance);
  const state = newState();
  state.lists[0] = { id:"personal", ...imported };
  const restored = parseBackup(JSON.stringify(state));
  const exported = core.exportList(restored.lists[0]);
  assert.deepEqual(exported, source);
  assert.deepEqual(parseImport(JSON.stringify(exported)), imported);
  assert.equal(restoreState(JSON.stringify(state)).lists[0].revision, "2026-10-28.2");
  assert.deepEqual(core.exportList({ id:"personal", title:"Ancienne liste", accounts:[] }), { format:"fil-clair-v1", title:"Ancienne liste", accounts:[] });
});

test("la version X v1 devient une révision de liste déclarée sans preuve fournisseur", () => {
  const imported = parseImport(JSON.stringify({ schemaVersion:1, version:"2026-10-27.5", accounts:[{ username:"alice", confirmed:true }] }));
  assert.equal(imported.revision, "2026-10-27.5");
  assert.deepEqual(imported.accounts, [{ network:"x", handle:"alice" }]);
  assert.equal(Object.hasOwn(imported, "confirmed"), false);
  assert.deepEqual(parseImport(JSON.stringify({ schemaVersion:1, accounts:[] })), { title:"Liste X importée", accounts:[] });
});

test("les métadonnées optionnelles sont bornées et ne partagent pas l'objet importé", () => {
  assert.equal(typeof core.listMetadata, "function");
  const source = { revision:"r".repeat(80), provenance:{ label:"l".repeat(160), retrievedAt:1000 } };
  const metadata = core.listMetadata(source);
  assert.deepEqual(metadata, source);
  metadata.provenance.label = "Autre";
  assert.equal(source.provenance.label, "l".repeat(160));
  assert.deepEqual(core.listMetadata({ title:"Aucune métadonnée" }), {});
  for (const invalid of [
    { revision:1 }, { revision:"" }, { revision:"r".repeat(81) },
    { provenance:null }, { provenance:[] }, { provenance:{} },
    { provenance:{ label:"" } }, { provenance:{ label:"l".repeat(161) } },
    { provenance:{ label:"Source\nInjected" } },
    { provenance:{ label:"Source", retrievedAt:0 } },
    { provenance:{ label:"Source", retrievedAt:1.5 } },
    { provenance:{ label:"Source", retrievedAt:8_640_000_000_000_001 } },
    { provenance:{ label:"Source", confirmed:true } },
    { provenance:{ url:"http://example.org/liste" } },
    { provenance:{ url:"https://user:password@example.org/liste" } },
    { provenance:{ url:"https://example.org/liste?token=secret" } },
    { provenance:{ url:"https://example.org/liste#secret" } },
    { provenance:{ url:"https://example.org/" + "x".repeat(2048) } }
  ]) {
    assert.throws(() => core.listMetadata(invalid));
    assert.throws(() => parseImport(JSON.stringify({ format:"fil-clair-v1", title:"Liste", accounts:[], ...invalid })));
    const state = newState();
    state.lists[0] = { ...state.lists[0], ...invalid };
    assert.throws(() => parseBackup(JSON.stringify(state)));
  }
});

test("les champs importés de confirmation ne deviennent jamais des preuves fournisseur", () => {
  const input = newState();
  input.lists[0].accounts = [{ network:"x", handle:"alice", confirmed:true, providerEvidence:{ at:1000 } }];
  input.decisions["personal|x::alice"] = { status:"blocked", at:1000, confirmed:true, providerEvidence:{ at:1000 } };
  input.history = [{ key:"personal|x::alice", status:"blocked", at:1000, providerEvidence:{ at:1000 } }];
  const restored = parseBackup(JSON.stringify(input));
  assert.deepEqual(restored.lists[0].accounts, [{ network:"x", handle:"alice" }]);
  assert.deepEqual(restored.decisions["personal|x::alice"], { status:"blocked", at:1000 });
  assert.deepEqual(restored.history, [{ key:"personal|x::alice", status:"blocked", at:1000 }]);
  for (const status of ["confirmed", "provider-confirmed"]) {
    input.decisions["personal|x::alice"].status = status;
    assert.throws(() => parseBackup(JSON.stringify(input)));
  }
});

test("un profil retiré puis réajouté ne retrouve pas son ancienne décision", () => {
  assert.equal(typeof core.removeAccount, "function");
  const account = { network:"x", handle:"Alice" };
  let state = newState();
  state.lists[0].accounts = [account, { network:"x", handle:"bob" }];
  state.lists.push({ id:"other", title:"Autre", accounts:[account] });
  state = markDecision(state, "personal", account, "blocked", 1000);
  state = markDecision(state, "other", account, "muted", 2000);
  const before = JSON.stringify(state);
  const removed = core.removeAccount(state, "personal", { network:"x", handle:"alice" });
  assert.equal(JSON.stringify(state), before);
  assert.deepEqual(removed.lists[0].accounts, [{ network:"x", handle:"bob" }]);
  assert.equal(Object.hasOwn(removed.decisions, "personal|x::alice"), false);
  assert.deepEqual(removed.decisions["other|x::alice"], { status:"muted", at:2000 });
  assert.deepEqual(removed.history, state.history);
  removed.lists[0] = { ...removed.lists[0], accounts:[...removed.lists[0].accounts, account] };
  assert.deepEqual(progress(removed, removed.lists[0]), { total:2, blocked:0, muted:0, skipped:0, remaining:2 });
  assert.equal(parseBackup(JSON.stringify(removed)).history.length, 2);
});

test("supprimer une liste purge seulement ses décisions et conserve son historique", () => {
  assert.equal(typeof core.removeList, "function");
  const a = { network:"x", handle:"alice" };
  let state = newState();
  state.lists[0].accounts = [a];
  state.lists.push({ id:"personal-extra", title:"Autre", accounts:[a] });
  state = markDecision(state, "personal", a, "blocked", 1000);
  state = markDecision(state, "personal-extra", a, "muted", 2000);
  const before = JSON.stringify(state);
  const removed = core.removeList(state, "personal");
  assert.equal(JSON.stringify(state), before);
  assert.equal(removed.activeList, "personal-extra");
  assert.deepEqual(removed.lists.map(list => list.id), ["personal-extra"]);
  assert.equal(Object.hasOwn(removed.decisions, "personal|x::alice"), false);
  assert.deepEqual(removed.decisions["personal-extra|x::alice"], { status:"muted", at:2000 });
  assert.deepEqual(removed.history, state.history);
  const final = core.removeList(removed, "personal-extra");
  assert.deepEqual(final.lists, newState().lists);
  assert.equal(final.activeList, "personal");
  assert.deepEqual(Object.keys(final.decisions), []);
  assert.deepEqual(final.history, state.history);
  final.lists[0].accounts.push(a);
  assert.equal(progress(final, final.lists[0]).blocked, 0);
  assert.equal(parseBackup(JSON.stringify(final)).history.length, 2);
});

test("retirer une liste inactive préserve la sélection et une cible absente ne détruit rien", () => {
  assert.equal(typeof core.removeList, "function");
  assert.equal(typeof core.removeAccount, "function");
  const state = newState();
  state.lists.push({ id:"other", title:"Autre", accounts:[] });
  assert.equal(core.removeList(state, "other").activeList, "personal");
  assert.deepEqual(core.removeList(state, "missing"), state);
  assert.deepEqual(core.removeAccount(state, "missing", { network:"x", handle:"alice" }), state);
});

test("une sauvegarde accepte les clés Mastodon valides longues sans supprimer la déclaration", () => {
  const account = { network:"mastodon", instance:["a".repeat(63), "b".repeat(63), "c".repeat(63), "d".repeat(61)].join("."), handle:"a".repeat(80) };
  let state = newState();
  state.lists[0] = { id:"l".repeat(80), title:"Instance longue", accounts:[account] };
  state.activeList = "l".repeat(80);
  state = markDecision(state, state.activeList, account, "review", 1000);
  const restored = parseBackup(JSON.stringify(state));
  assert.deepEqual(JSON.parse(JSON.stringify(restored)), state);
});

test("une sauvegarde refuse les clés non canoniques et les titres ou doublons à perte", () => {
  for (const key of ["personal|x::alice|trailing", "personal|unknown::alice", "personal|x::Alice", "personal|mastodon:bad.test/path:alice"]) {
    const state = newState();
    state.decisions[key] = { status:"blocked", at:1000 };
    assert.throws(() => parseBackup(JSON.stringify(state)));
    state.decisions = {};
    state.history = [{ key, status:"blocked", at:1000 }];
    assert.throws(() => parseBackup(JSON.stringify(state)));
  }
  for (const title of [42, {}, "x".repeat(71)]) {
    const state = newState();
    state.lists[0].title = title;
    assert.throws(() => parseBackup(JSON.stringify(state)));
  }
  const state = newState();
  state.lists[0].accounts = [{ network:"x", handle:"alice" }, { network:"x", handle:"Alice" }];
  assert.throws(() => parseBackup(JSON.stringify(state)));
});

test("les dates impossibles ne créent pas de décisions ou de sauvegardes illisibles", () => {
  const account = { network:"x", handle:"alice" };
  const state = newState();
  state.lists[0].accounts = [account];
  for (const at of [0, -1, 1.5, NaN, Infinity, 8_640_000_000_000_001]) {
    assert.throws(() => markDecision(state, "personal", account, "blocked", at));
  }
  for (const at of [1.5, 8_640_000_000_000_001]) {
    assert.throws(() => parseBackup(JSON.stringify({ ...state, decisions:{ "personal|x::alice":{ status:"blocked", at } } })));
    assert.throws(() => parseBackup(JSON.stringify({ ...state, history:[{ key:"personal|x::alice", status:"todo", at }] })));
  }
  const marked = markDecision(state, "personal", account, "review", 8_640_000_000_000_000);
  assert.equal(parseBackup(JSON.stringify(marked)).history[0].at, 8_640_000_000_000_000);
  assert.deepEqual(state.decisions, {});
});

test("une décision ne peut pas viser une liste ou un profil absent", () => {
  const state = newState();
  const account = { network:"x", handle:"alice" };
  assert.throws(() => markDecision(state, "missing", account, "blocked", 1000));
  assert.throws(() => markDecision(state, "personal", account, "blocked", 1000));
  assert.deepEqual(state.decisions, {});
  assert.deepEqual(state.history, []);
});

test("le plafond de décisions refuse un ajout sans perdre les déclarations existantes", () => {
  const accounts = Array.from({ length:5000 }, (_, index) => ({ network:"x", handle:"u" + index }));
  let state = newState();
  state.lists = [
    { id:"personal", title:"Première", accounts },
    { id:"other", title:"Seconde", accounts },
    { id:"extra", title:"Nouvelle", accounts:[{ network:"x", handle:"alice" }] }
  ];
  for (const id of ["personal", "other"])
    for (let index = 0; index < 5000; index++) state.decisions[id + "|x::u" + index] = { status:"blocked", at:1000 };
  assert.throws(() => markDecision(state, "extra", { network:"x", handle:"alice" }, "review", 2000));
  assert.equal(Object.keys(state.decisions).length, 10_000);
  state = markDecision(state, "personal", accounts[0], "muted", 2000);
  assert.equal(state.decisions["personal|x::u0"].status, "muted");
  state = markDecision(state, "personal", accounts[0], "todo", 3000);
  state = markDecision(state, "extra", { network:"x", handle:"alice" }, "review", 4000);
  assert.equal(Object.keys(parseBackup(JSON.stringify(state)).decisions).length, 10_000);
});

test("les limites acceptent 5000 profils par liste et 30 listes mais refusent les dépassements", () => {
  const accounts = Array.from({ length:5000 }, (_, index) => ({ network:"x", handle:"u" + index }));
  assert.equal(parseImport(JSON.stringify({ format:"fil-clair-v1", title:"Maximum", accounts })).accounts.length, 5000);
  assert.throws(() => parseImport(JSON.stringify({ format:"fil-clair-v1", title:"Trop", accounts:[...accounts, { network:"x", handle:"extra" }] })));
  const state = newState();
  state.lists = Array.from({ length:30 }, (_, index) => ({ id:index === 0 ? "personal" : "list-" + index, title:"Liste " + index, accounts:[] }));
  assert.equal(parseBackup(JSON.stringify(state)).lists.length, 30);
  state.lists.push({ id:"overflow", title:"Trop", accounts:[] });
  assert.throws(() => restoreState(JSON.stringify(state)));
  assert.throws(() => restoreState("x".repeat(MAX_BACKUP_BYTES + 1)));
});

test("les titres texte v1 déjà acceptés restent exportables et restaurables", () => {
  const title = "Sélection\nà examiner";
  const imported = parseImport(JSON.stringify({ format:"fil-clair-v1", title, accounts:[] }));
  const state = newState();
  state.lists[0] = { id:"personal", ...imported };
  assert.equal(parseBackup(JSON.stringify(state)).lists[0].title, title);
  assert.equal(core.exportList(state.lists[0]).title, title);
});
