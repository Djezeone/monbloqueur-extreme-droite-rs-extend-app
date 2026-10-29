import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Test-only loopback server. These modules are intentionally absent from the
// production shell and its public precache; no social HTTP route exists here.
export async function serveConnectorLab() {
  const allowed=new Set(["internal","mastodon","bluesky","orchestration","durable-orchestration","operation-journal"].map(name=>`/pwa/connectors/${name}.js`));
  allowed.add("/tests/fixtures/durable-lab.js");
  const requests=[];
  const server=createServer(async(req,res)=>{
    const path=new URL(req.url,"http://localhost").pathname;requests.push(path);
    if(path==="/"){
      res.writeHead(200,{"Content-Type":"text/html","Cache-Control":"no-store"});
      res.end('<!doctype html><html lang="fr"><title>Local connector qualification</title><script type="module" src="/tests/fixtures/durable-lab.js"></script></html>');return;
    }
    if(!allowed.has(path)){res.writeHead(404);res.end();return;}
    try{res.writeHead(200,{"Content-Type":"text/javascript","Cache-Control":"no-store"});res.end(await readFile(resolve("."+path)));}
    catch{res.writeHead(404);res.end();}
  });
  await new Promise(done=>server.listen(0,"localhost",done));
  return {url:`http://localhost:${server.address().port}`,requests,close:()=>new Promise(done=>server.close(done))};
}
