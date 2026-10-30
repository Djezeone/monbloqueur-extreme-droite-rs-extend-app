import { BlockList, isIP } from "node:net";
import { ConnectorError, decimalId } from "../../pwa/connectors/internal.js";

const fail = code => { throw new ConnectorError(code); };
const abortedGetter = Object.getOwnPropertyDescriptor(AbortSignal.prototype, "aborted").get;

// Conservative IANA special-purpose policy: even globally reachable special
// assignments are excluded. Multicast is separate from that registry.
// https://www.iana.org/assignments/iana-ipv4-special-registry/
const blockedV4 = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.31.196.0", 24], ["192.52.193.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
  ["192.175.48.0", 24], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4]
]) blockedV4.addSubnet(address, prefix, "ipv4");
const allowedV6 = new BlockList();
allowedV6.addSubnet("2000::", 3, "ipv6");
const blockedV6 = new BlockList();
for (const [address, prefix] of [
  ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["2620:4f:8000::", 48], ["3fff::", 20]
]) blockedV6.addSubnet(address, prefix, "ipv6");

// Snapshot enumerable data properties only; inspecting caller getters would
// execute unqualified code and could turn a checked value into another value.
function record(value, required, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length < required.length || keys.length > required.length + optional.length ||
      !required.every(key => keys.includes(key))) return null;
  const result = Object.create(null);
  for (const key of keys) {
    if (!required.includes(key) && !optional.includes(key)) return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, "value")) return null;
    result[key] = descriptor.value;
  }
  return result;
}

export function normalizeOrigin(value) {
  try {
    if (typeof value !== "string") fail("server-invalid-origin");
    // Parse the original authority as well as the URL: URL alone silently
    // removes empty queries, default ports, userinfo and dot-path aliases.
    const match = /^https:\/\/([a-z0-9.-]+)(?::443)?\/?$/i.exec(value);
    if (!match) fail("server-invalid-origin");
    const host = match[1].toLowerCase();
    if (host.length > 253 || !host.includes(".") || host.endsWith(".") ||
        !host.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
        /(^|\.)(localhost|local|internal|onion|lan|home)$/.test(host) ||
        host === "home.arpa" || host.endsWith(".home.arpa")) fail("server-invalid-origin");
    const url = new URL(value);
    if (url.hostname !== host || isIP(url.hostname) !== 0) fail("server-invalid-origin");
    return url.origin;
  } catch { fail("server-invalid-origin"); }
}

export function isPublicAddress(address) {
  if (typeof address !== "string" || address.includes("%")) return false;
  const family = isIP(address);
  if (family === 4) return !blockedV4.check(address, "ipv4");
  return family === 6 && allowedV6.check(address, "ipv6") && !blockedV6.check(address, "ipv6");
}

export function selectPublicAddress(results) {
  try {
    if (!Array.isArray(results) || Object.getPrototypeOf(results) !== Array.prototype) fail("server-invalid-addresses");
    const length = Object.getOwnPropertyDescriptor(results, "length").value;
    if (length < 1 || length > 16 || Reflect.ownKeys(results).length !== length + 1) fail("server-invalid-addresses");
    let selected;
    for (let index = 0; index < length; index++) {
      const entry = Object.getOwnPropertyDescriptor(results, String(index));
      if (!entry || !entry.enumerable || !Object.hasOwn(entry, "value")) fail("server-invalid-addresses");
      const answer = record(entry.value, ["address", "family"]);
      if (!answer || ![4, 6].includes(answer.family) || !isPublicAddress(answer.address) ||
          isIP(answer.address) !== answer.family) fail("server-invalid-addresses");
      if (!selected) selected = { address:answer.address, family:answer.family };
    }
    return selected;
  } catch { fail("server-invalid-addresses"); }
}

export function normalizeMastodonRequest(input, origin) {
  try {
    const request = record(input, ["url", "method", "redirect", "credentials"], ["body", "signal"]);
    if (!request || request.redirect !== "error" || request.credentials !== "omit" ||
        !["GET", "POST"].includes(request.method) || typeof request.url !== "string") fail("server-invalid-request");
    if (request.signal !== undefined) abortedGetter.call(request.signal);
    const url = new URL(request.url);
    if (request.url !== url.href || url.origin !== normalizeOrigin(origin) || url.username || url.password ||
        request.url.includes("#") || (url.search === "" && request.url.includes("?"))) fail("server-invalid-request");
    let targetId = null, action = null;
    if (request.method === "GET") {
      if (Object.hasOwn(request, "body")) fail("server-invalid-request");
      if (url.pathname === "/api/v1/accounts/verify_credentials") {
        if (url.search) fail("server-invalid-request");
      } else if (url.pathname === "/api/v1/accounts/relationships") {
        const entries = [...url.searchParams];
        if (entries.length !== 2 || url.searchParams.getAll("id[]").length !== 1 ||
            url.searchParams.getAll("with_suspended").length !== 1 || url.searchParams.get("with_suspended") !== "true" ||
            url.search !== `?${url.searchParams.toString()}`) fail("server-invalid-request");
        targetId = decimalId(url.searchParams.get("id[]"));
      } else fail("server-invalid-request");
    } else {
      const match = /^\/api\/v1\/accounts\/([^/]+)\/(block|unblock)$/.exec(url.pathname);
      if (!match || url.search || !record(request.body, [])) fail("server-invalid-request");
      targetId = decimalId(match[1]);
      action = match[2];
    }
    return { url:request.url, method:request.method, path:url.pathname + url.search, targetId, action };
  } catch { fail("server-invalid-request"); }
}
