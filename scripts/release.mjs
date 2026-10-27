import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import assert from "node:assert/strict";
import { manifestFor } from "./manifests.mjs";

const root = new URL("../", import.meta.url);
const source = new URL("extension/", root);
const manifest = JSON.parse(
  await readFile(new URL("manifest.json", source), "utf8"),
);
const project = JSON.parse(
  await readFile(new URL("package.json", root), "utf8"),
);
const version = manifest.version;
if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version))
  throw Error("Version du manifeste incorrecte.");
assert.equal(
  project.version,
  version,
  "package.json et manifest.json doivent avoir la même version.",
);
const tag = "v" + version;
if (process.argv.includes("--tag")) {
  const requested = process.argv[process.argv.indexOf("--tag") + 1];
  assert.equal(
    requested,
    tag,
    "Le tag doit correspondre à la version du manifeste.",
  );
}

async function files(folder, prefix = "") {
  const entries = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), folder);
    if (entry.isDirectory())
      entries.push(...(await files(path, prefix + entry.name + "/")));
    else entries.push([prefix + entry.name, await readFile(path)]);
  }
  return entries;
}

function unpack(bytes) {
  let end = -1;
  for (
    let offset = bytes.length - 22;
    offset >= Math.max(0, bytes.length - 65557);
    offset--
  ) {
    if (
      bytes.readUInt32LE(offset) === 0x06054b50 &&
      offset + 22 + bytes.readUInt16LE(offset + 20) === bytes.length
    ) {
      end = offset;
      break;
    }
  }
  if (end < 0) throw Error("Archive ZIP invalide.");
  const count = bytes.readUInt16LE(end + 10);
  let offset = bytes.readUInt32LE(end + 16);
  const entries = new Map();
  for (let index = 0; index < count; index++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50)
      throw Error("Répertoire ZIP invalide.");
    const method = bytes.readUInt16LE(offset + 10);
    const packedSize = bytes.readUInt32LE(offset + 20);
    const size = bytes.readUInt32LE(offset + 24);
    const nameSize = bytes.readUInt16LE(offset + 28);
    const name = bytes
      .subarray(offset + 46, offset + 46 + nameSize)
      .toString("utf8");
    if (entries.has(name) || size > 2 * 1024 * 1024)
      throw Error("Entrée ZIP incorrecte : " + name);
    const local = bytes.readUInt32LE(offset + 42);
    if (bytes.readUInt32LE(local) !== 0x04034b50)
      throw Error("En-tête ZIP invalide.");
    const start =
      local +
      30 +
      bytes.readUInt16LE(local + 26) +
      bytes.readUInt16LE(local + 28);
    if (start + packedSize > bytes.length) throw Error("Archive ZIP tronquée.");
    const packed = bytes.subarray(start, start + packedSize);
    const data =
      method === 0
        ? packed
        : method === 8
          ? inflateRawSync(packed, { maxOutputLength: 2 * 1024 * 1024 })
          : null;
    if (!data || data.length !== size)
      throw Error("Compression ZIP incorrecte.");
    entries.set(name, data);
    offset +=
      46 +
      nameSize +
      bytes.readUInt16LE(offset + 30) +
      bytes.readUInt16LE(offset + 32);
  }
  if (offset !== end) throw Error("Fin du répertoire ZIP incorrecte.");
  return entries;
}

const expected = new Map(await files(source));
const prepared = [];
for (const browser of ["chrome", "edge", "firefox"]) {
  const name = "extension-" + browser + ".zip";
  const bytes = await readFile(new URL("dist/" + name, root));
  const entries = unpack(bytes);
  assert.deepEqual(
    [...entries.keys()].sort(),
    [...expected.keys()].sort(),
    name + " doit contenir uniquement les fichiers de l’extension.",
  );
  assert.deepEqual(
    JSON.parse(entries.get("manifest.json").toString("utf8")),
    manifestFor(manifest, browser),
    "Manifeste incorrect dans " + name,
  );
  for (const [path, data] of expected) {
    if (path !== "manifest.json")
      assert.ok(
        data.equals(entries.get(path)),
        name + " contient un fichier périmé : " + path,
      );
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  const checksum = digest + "  " + name + "\n";
  assert.equal(
    await readFile(new URL("dist/" + name + ".sha256", root), "utf8"),
    checksum,
    "Empreinte incorrecte pour " + name,
  );
  prepared.push({ name, bytes, checksum, digest });
}

const directory = "dist/releases/" + tag + "/";
const destination = new URL(directory, root);
await mkdir(destination, { recursive: true });
for (const asset of prepared) {
  await writeFile(new URL(asset.name, destination), asset.bytes);
  await writeFile(new URL(asset.name + ".sha256", destination), asset.checksum);
}
await writeFile(
  new URL("SHA256SUMS.txt", destination),
  prepared.map((asset) => asset.checksum).join(""),
);
const notes = `# ${tag}\n\nTrois paquets pour Chrome, Edge et Firefox.\n\n- Télécharger le ZIP de son navigateur, puis suivre le [guide d’installation](https://github.com/LaRosette/bloquer-extreme-droite-x/blob/main/INSTALLATION.md).\n- La liste de comptes continue de se mettre à jour sans réinstaller l’extension.\n- Le paquet Firefox est non signé et se charge temporairement. Une signature Mozilla reste nécessaire pour une installation permanente.\n\nLes empreintes des trois ZIP sont dans \`SHA256SUMS.txt\`.\n`;
await writeFile(new URL("NOTES.md", destination), notes);
await writeFile(
  new URL("dist/release.json", root),
  JSON.stringify(
    {
      version,
      tag,
      directory,
      assets: prepared.map((asset) => ({
        name: asset.name,
        sha256: asset.digest,
        bytes: asset.bytes.length,
      })),
    },
    null,
    2,
  ) + "\n",
);
console.log(`Release préparée : ${tag}, trois ZIP vérifiés dans ${directory}`);
