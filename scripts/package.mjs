import { readdir, readFile } from "node:fs/promises";

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function entries(folder, prefix = "") {
  const result = [];
  const sorted = (await readdir(folder, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  );
  for (const entry of sorted) {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), folder);
    if (entry.isDirectory())
      result.push(...(await entries(path, prefix + entry.name + "/")));
    else result.push({ name: prefix + entry.name, data: await readFile(path) });
  }
  return result;
}

// Paquets ZIP standards, sans dépendance ajoutée à l’extension.
export async function packageDirectory(folder) {
  const locals = [],
    central = [];
  let offset = 0;
  for (const file of await entries(folder)) {
    const name = Buffer.from(file.name),
      crc = crc32(file.data),
      header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(file.data.length, 18);
    header.writeUInt32LE(file.data.length, 22);
    header.writeUInt16LE(name.length, 26);
    locals.push(header, name, file.data);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(0x800, 8);
    directory.writeUInt32LE(crc, 16);
    directory.writeUInt32LE(file.data.length, 20);
    directory.writeUInt32LE(file.data.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(offset, 42);
    central.push(directory, name);
    offset += header.length + name.length + file.data.length;
  }
  const end = Buffer.alloc(22),
    index = Buffer.concat(central);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(index.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, index, end]);
}
