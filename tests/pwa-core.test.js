import test from "node:test";
import assert from "node:assert/strict";
import { normalise, profileUrl, accountKey, uniqueAccounts, parseImport, restoreState, newState, markDecision, progress, parseBackup, MAX_BACKUP_BYTES } from "../pwa/core.js";

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
  assert.equal(restoreState("bad").lists.length,1);
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
