import test from "node:test";
import assert from "node:assert/strict";
import { PLATFORMS } from "../pwa/platforms.js";
const registry = await import("../pwa/effects.js").catch(() => ({}));

test("registre exhaustif des43 contrôles, public/immuable et séparé des preuves d'action", () => {
  assert.equal(typeof registry.registryEntries,"function");
  const entries=registry.registryEntries();
  assert.equal(entries.length,43);
  for(const [service,platform] of Object.entries(PLATFORMS)) for(const control of platform.controls) {
    const e=registry.getEffect(service,control.id);
    assert.ok(e); assert.ok(Object.isFrozen(e)); assert.ok(Object.isFrozen(e.sources));
    assert.equal(e.service,service); assert.equal(e.control,control.id);
    assert.equal(e.personalEffect,control.scope);
    assert.ok(e.algorithmicEffect.length>30);
    assert.equal(e.providerTested,false); assert.equal(e.api.connected,false);
    assert.ok(e.revocation.description.length>20);
    assert.ok(["local-code","official-documentation","official-announcement","partial-documentation"].includes(e.confidence));
    assert.match(e.checkedAt,/^2026-10-2[89]$/); assert.match(e.reviewBy,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(e.restrictions.length);
    assert.equal(Object.hasOwn(e,"target"),false);
    if(service!=="local") assert.ok(e.sources.length);
    for(const source of e.sources) {
      const url=new URL(source.url);
      assert.equal(url.protocol,"https:"); assert.equal(url.username+url.password,"");
      assert.equal(url.hash.includes("token"),false);
      assert.ok(source.kind.length); assert.match(source.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
    }
  }
  assert.equal(registry.getEffect("__proto__","constructor"),null);
  assert.equal(registry.getEffect("youtube","block"),null);
});

test("API documentées mais inactives : aucune permission de production implicitement consentie", () => {
  assert.equal(typeof registry.getEffect,"function");
  const mastodon=registry.getEffect("mastodon","block"), bluesky=registry.getEffect("bluesky","block");
  assert.equal(mastodon.api.status,"documented-inactive");
  assert.deepEqual(mastodon.api.requested,[]); assert.equal(mastodon.api.granted,null);
  assert.ok(mastodon.api.permissions.some(p=>p.includes("write:blocks")));
  assert.equal(bluesky.api.status,"documented-inactive");
  assert.ok(bluesky.api.permissions.some(p=>p.includes("app.bsky.graph.block")));
  assert.match(bluesky.personalEffect,/public/i);
  assert.equal(registry.getEffect("x","mute").api.status,"not-qualified");
  assert.equal(registry.getEffect("reddit","block").confidence,"partial-documentation");
  assert.ok(registry.getEffect("x","block").sources.some(s=>s.url==="https://docs.x.com/x-api/users/block-user"));
  assert.match(registry.getEffect("safari","search-suggestions").algorithmicEffect,/Discover/);
  assert.equal(registry.getEffect("local","source-avoid").revocation.kind,"local-removal");
  assert.equal(registry.getEffect("instagram","reset").revocation.kind,"not-established");
});

test("péremption documentaire déterministe, source ancienne n'est pas disponibilité testée", () => {
  assert.equal(typeof registry.reviewState,"function");
  const effect=registry.getEffect("facebook","snooze");
  assert.equal(effect.confidence,"official-announcement");
  assert.equal(registry.reviewState(effect,"2026-10-29"),"current");
  assert.equal(registry.reviewState(effect,"2030-01-01"),"overdue");
  assert.equal(registry.reviewState(effect,"invalid"),"unknown");
  assert.equal(registry.reviewState({...effect,reviewBy:"2026-02-30"},"2026-10-29"),"unknown");
  assert.equal(registry.reviewState(effect,effect.reviewBy),"current");
});

test("coefficients X figés par composant, probabilités et absence de configuration de production prouvée", () => {
  assert.ok(registry.X_ALGORITHM_EVIDENCE,"Recherche X absente");
  const x=registry.X_ALGORITHM_EVIDENCE;
  assert.match(x.commit,/^[a-f0-9]{40}$/); assert.equal(x.productionVerified,false);
  assert.equal(x.components["home-mixer"].ReportWeight,-234);
  assert.equal(x.components["home-mixer"].NotInterestedWeight,-52.272);
  assert.equal(x.components["vm-ranker"].NotInterestedWeight,-47.52);
  assert.match(x.explanation,/probabilit/); assert.match(x.explanation,/pénalité globale/);
  assert.ok(x.sources.every(s=>s.url.includes(x.commit)));
  assert.equal(x.reportActionAvailable,false);
  assert.match(x.reportingRule,/infraction|sanction/);
});
