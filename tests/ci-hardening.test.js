import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, cp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const names = ["fil-clair-pwa.yml", "verification.yml", "release.yml", "tableau.yml"];
const workflows = await Promise.all(names.map(async name => ({
  name, text: await readFile(new URL(`.github/workflows/${name}`, root), "utf8")
})));

test("every third-party workflow action is pinned to a full commit", () => {
  for (const {name, text} of workflows) {
    const uses = [...text.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map(match => match[1]);
    assert.ok(uses.length, name);
    for (const action of uses) assert.match(action, /^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/, `${name}: ${action}`);
  }
});

test("workflow checkouts never retain credentials", () => {
  for (const {name, text} of workflows) {
    // Bound checkout options at the next step, rather than accept an option elsewhere.
    const lines = text.split("\n");
    for (let index=0; index<lines.length; index++) if (/uses:\s*actions\/checkout@/.test(lines[index])) {
      const indent = lines[index].match(/^ */)[0].length;
      const options = [];
      for (let cursor=index+1; cursor<lines.length; cursor++) {
        const line=lines[cursor];
        const currentIndent=line.match(/^ */)[0].length;
        if (line.trim() && (currentIndent<indent || (currentIndent===indent && /^ *- /.test(line)))) break;
        options.push(line);
      }
      assert.match(options.join("\n"), /persist-credentials:\s*false\b/, name);
    }
  }
});

test("all workflow tokens remain read-only", () => {
  for (const {name, text} of workflows) {
    assert.match(text, /^permissions:\s*\n\s+contents:\s*read\b/m, name);
    assert.doesNotMatch(text, /^\s*[\w-]+:\s*write\b/m, name);
  }
});

test("workflows allocate no Actions cache or artifact storage", () => {
  for (const {name, text} of workflows) {
    assert.doesNotMatch(text, /actions\/(?:upload-artifact|download-artifact|cache)@|^\s*cache:\s*(?:npm|true)\b/m, name);
  }
});

test("package preparation is manual and cannot publish a release or tag", () => {
  const text=workflows.find(x=>x.name==="release.yml").text;
  assert.match(text, /^on:\s*\n\s+workflow_dispatch:/m);
  assert.doesNotMatch(text, /^\s+(?:push|pull_request|schedule):/m);
  assert.doesNotMatch(text, /\bgh\s+(?:release|api)|\bgit\s+push|GH_TOKEN|contents:\s*write/);
  assert.match(text, /node scripts\/release\.mjs --tag "\$RELEASE_TAG"/);
});

test("table validation checks the generated document without pushing Git", () => {
  const text=workflows.find(x=>x.name==="tableau.yml").text;
  assert.match(text, /run:\s*node scripts\/update-readme\.mjs --check\b/);
  assert.doesNotMatch(text, /\bgit\s+(?:push|commit|config|add)\b|contents:\s*write/);
});

for (const name of ["vercel.json", "pwa/vercel.json"]) {
  test(`${name} disables Git deployments for every branch until costs are verified`, async () => {
    const config=JSON.parse(await readFile(new URL(name, root), "utf8"));
    assert.equal(config.git?.deploymentEnabled, false);
  });
}

test("the real table checker accepts fresh content and rejects stale content without rewriting it", async () => {
  const dir=await mkdtemp(join(tmpdir(),"fil-clair-table-check-"));
  try {
    await mkdir(join(dir,"scripts"));
    for (const name of ["extension","liste"]) await cp(new URL(name, root),join(dir,name),{recursive:true});
    await cp(new URL("scripts/update-readme.mjs",root),join(dir,"scripts/update-readme.mjs"));
    await writeFile(join(dir,"package.json"),JSON.stringify({type:"module"}));
    const original=await readFile(new URL("README.md",root),"utf8");
    await writeFile(join(dir,"README.md"),original);
    const run=()=>spawnSync(process.execPath,["scripts/update-readme.mjs","--check"],{cwd:dir,encoding:"utf8"});
    const good=run();
    assert.equal(good.status,0,good.stderr);
    assert.equal(await readFile(join(dir,"README.md"),"utf8"),original);
    const stale=original.replace("<!-- comptes:debut -->","<!-- comptes:debut -->\nSTALE");
    assert.notEqual(stale,original);
    await writeFile(join(dir,"README.md"),stale);
    const bad=run();
    assert.equal(bad.status,1);
    assert.match(bad.stderr,/npm run update:table/);
    assert.equal(await readFile(join(dir,"README.md"),"utf8"),stale);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
