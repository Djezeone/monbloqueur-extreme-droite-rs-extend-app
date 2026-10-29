import { test } from "node:test";
import assert from "node:assert/strict";
const support = await import("../pwa/support-config.js").catch(()=>({}));
const help = await import("../pwa/help-data.js").catch(()=>({}));

test("support defaults to no destination and fails closed for unreviewed or unsafe URLs",()=>{
  assert.equal(support.supportDestination(),null);
  const valid={url:"https://contrib.example/projects/fil-clair",validatedAt:"2026-10-29"};
  assert.equal(support.supportDestination(valid),valid.url);
  for(const url of ["http://contrib.example/x","javascript:alert(1)","https://user:secret@contrib.example/x","https://contrib.example/x?target=private","https://contrib.example/x#secret","https://localhost/x","https://127.0.0.1/x","https://contrib.example:8443/x"," https://contrib.example/x","https://contrib.example/a/../x"]) assert.equal(support.supportDestination({...valid,url}),null,url);
  for(const validatedAt of [null,"","2026-02-31","later"]) assert.equal(support.supportDestination({...valid,validatedAt}),null);
  assert.equal(support.supportDestination({url:valid.url}),null);
});
test("local FAQ covers six action states and offers relevant device guidance without AI",()=>{
  assert.ok(help.FAQ.length>=8);
  const text=help.FAQ.map(x=>x.question+" "+x.answer).join(" ");
  for(const fragment of ["bloquer","masquer","manuelle","iPhone","annuler","vérifier","Non disponible"]) assert.match(text,new RegExp(fragment,"i"));
  assert.ok(help.searchHelp("iphone","ios").some(x=>x.id==="install-ios"));
  assert.ok(!help.searchHelp("","android").some(x=>x.id==="install-ios"));
  assert.equal(help.searchHelp("absolutely-no-match","all").length,0);
  assert.deepEqual(help.searchHelp("vérifier","all"),help.searchHelp("VERIFIER","all"));
  const first=help.searchHelp("","all"); first.pop(); assert.ok(help.FAQ.length>first.length);
});
