import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {generateKeyPairSync,createHash} from 'node:crypto';
export function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const tag=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([tag,data])));return Buffer.concat([size,tag,data,crc]);}
function polygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
function icon(size){
 const raw=Buffer.alloc(size*(size*4+1));
 const shield=[[.5,.13],[.83,.25],[.79,.62],[.67,.78],[.5,.88],[.33,.78],[.21,.62],[.17,.25]];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const color=[0,0,0,0];
  for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){
   const px=(x+(sx+.5)/4)/size,py=(y+(sy+.5)/4)/size;
   const rounded=Math.hypot(Math.max(Math.abs(px-.5)-.32,0),Math.max(Math.abs(py-.5)-.32,0))<.16;
   let c=rounded?[23,63,53,255]:[0,0,0,0];
   if(polygon(px,py,shield))c=[244,241,232,255];
   const radius=Math.hypot(px-.5,py-.48);
   if((radius<.165&&radius>.116)||(Math.abs((px-.5)+(py-.48))<.035&&radius<.15))c=[165,53,53,255];
   for(let k=0;k<4;k++)color[k]+=c[k]/16;
  }
  const offset=y*(size*4+1)+1+x*4;for(let k=0;k<4;k++)raw[offset+k]=Math.round(color[k]);
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
const extension=new URL('../extension/',import.meta.url);
await mkdir(new URL('icons/',extension),{recursive:true});
for(const size of [16,32,48,128])await writeFile(new URL(`icons/icon${size}.png`,extension),icon(size));
const manifest=JSON.parse(await readFile(new URL('manifest.json',extension),'utf8'));
if(!manifest.key){
 const {publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 manifest.key=publicKey.export({type:'spki',format:'der'}).toString('base64');
}
manifest.icons=Object.fromEntries([16,32,48,128].map(size=>[size,`icons/icon${size}.png`]));
manifest.action.default_icon=manifest.icons;
await writeFile(new URL('manifest.json',extension),JSON.stringify(manifest,null,2)+'\n');
const id=Array.from(createHash('sha256').update(Buffer.from(manifest.key,'base64')).digest().subarray(0,16)).map(byte=>String.fromCharCode(97+(byte>>4),97+(byte&15))).join('');
console.log(`Icônes générées. Identifiant Chrome de développement : ${id}`);
