import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { once } from "node:events";
import { servePwa } from "../scripts/pwa-test-utils.mjs";

for (const [name, bytes] of [
  ["idle preconnection", null],
  ["unfinished request headers", "GET / HTTP/1.1\r\nHost: localhost\r\n"]
]) test(`the owned PWA server stops and resumes with ${name}`, async () => {
  const server = await servePwa(), url = new URL(server.url);
  const peer = net.createConnection({ host:url.hostname, port:Number(url.port) });
  const peerErrors = [];
  peer.on("error", error => peerErrors.push(error.code));
  const peerClosed = new Promise(resolve => peer.once("close", resolve));
  let stopping, timer;
  try {
    await once(peer, "connect");
    if (bytes) peer.write(bytes);
    await new Promise(setImmediate);
    stopping = server.pause();
    await Promise.race([
      stopping,
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error("The test server cannot stop while an owned client socket stays open")), 1500); })
    ]);
    clearTimeout(timer);
    await peerClosed;
    assert.ok(peerErrors.every(code => code === "ECONNRESET"), "Only the expected forced-close reset may be emitted");
    assert.equal(server.listening(), false);
    await server.resume();
    const response = await fetch(server.url, { headers:{ Connection:"close" } });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /FIL CLAIR/);
  } finally {
    clearTimeout(timer);
    peer.destroy();
    await stopping;
    if (server.listening()) await server.close();
  }
});
