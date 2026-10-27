import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// ZIP sans dépendance de production. Les fichiers sont stockés avec CRC-32.
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
const root=new URL('../',import.meta.url),extension=new URL('extension/',root);
const {CONFIG}=await import(new URL('config.js',extension));
const development=process.argv.includes('--development');
if(!CONFIG.listUrl)throw new Error('Adresse de la liste manquante.');
if(!development){const response=await fetch(CONFIG.listUrl,{redirect:'error',signal:AbortSignal.timeout(20000)});const {readListResponse}=await import(new URL('core.js',extension));const list=await readListResponse(response);if(!list.accounts.length)throw new Error('La liste distante est vide.');}
async function files(folder,prefix=''){
 const result=[];
 for(const entry of await readdir(folder,{withFileTypes:true})){
  if(entry.isDirectory())result.push(...await files(new URL(entry.name+'/',folder),prefix+entry.name+'/'));
  else result.push({name:prefix+entry.name,data:await readFile(new URL(entry.name,folder))});
 }return result;
}
const locals=[],central=[];let offset=0;
for(const file of await files(extension)){
 const name=Buffer.from(file.name),crc=crc32(file.data),header=Buffer.alloc(30);
 header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt32LE(crc,14);header.writeUInt32LE(file.data.length,18);header.writeUInt32LE(file.data.length,22);header.writeUInt16LE(name.length,26);
 locals.push(header,name,file.data);
 const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x800,8);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(file.data.length,20);directory.writeUInt32LE(file.data.length,24);directory.writeUInt16LE(name.length,28);directory.writeUInt32LE(offset,42);central.push(directory,name);offset+=header.length+name.length+file.data.length;
}
const end=Buffer.alloc(22),index=Buffer.concat(central);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(central.length/2,8);end.writeUInt16LE(central.length/2,10);end.writeUInt32LE(index.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...locals,index,end]);
await mkdir(new URL('dist/',root),{recursive:true});
const name=development?'extension-developpement.zip':'extension-chrome.zip';
await writeFile(new URL('dist/'+name,root),zip);
await writeFile(new URL('dist/'+name+'.sha256',root),createHash('sha256').update(zip).digest('hex')+'  '+name+'\n');
console.log(`Paquet créé : dist/${name}`);
