import test from "node:test";
import assert from "node:assert/strict";
import { ConnectorError } from "../pwa/connectors/internal.js";

const policy = await import("../server/connectors/network-policy.js").catch(error => {
  if (error.code === "ERR_MODULE_NOT_FOUND") return {};
  throw error;
});
const origin = "https://social.example";
const identity = `${origin}/api/v1/accounts/verify_credentials`;
const relationship = `${origin}/api/v1/accounts/relationships?id%5B%5D=42&with_suspended=true`;
const block = `${origin}/api/v1/accounts/42/block`;
const input = (url = identity, method = "GET", extra = {}) => ({ url, method, redirect:"error", credentials:"omit", ...extra });
function implementation(name) {
  assert.equal(typeof policy[name], "function", `${name} network policy must exist`);
  return policy[name];
}
function rejectsSafely(run, code) {
  assert.throws(run, error => {
    assert.ok(error instanceof ConnectorError);
    assert.equal(error.code, code);
    assert.equal(error.message, code);
    assert.deepEqual(Object.keys(error).sort(), ["code", "name"]);
    return true;
  });
}

test("server origins normalize HTTPS case, port 443 and a single optional slash", () => {
  const normalize = implementation("normalizeOrigin");
  for (const value of [origin, `${origin}/`, "HTTPS://SOCIAL.Example", "https://social.example:443/"]) {
    assert.equal(normalize(value), origin);
  }
  assert.equal(normalize("https://xn--bcher-kva.example"), "https://xn--bcher-kva.example");
  const longest = `${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`;
  assert.equal(normalize(`https://${longest}`), `https://${longest}`);
});

test("server origins reject IP literals, numeric aliases and local DNS suffixes", () => {
  const normalize = implementation("normalizeOrigin");
  for (const value of [
    "https://127.0.0.1", "https://8.8.8.8", "https://127.1", "https://2130706433",
    "https://0x7f000001", "https://0177.0.0.1", "https://[::1]", "https://[2606:4700::1111]",
    "https://localhost", "https://instance.localhost", "https://instance.local", "https://instance.internal",
    "https://instance.onion", "https://instance.lan", "https://instance.home", "https://home.arpa", "https://instance.home.arpa"
  ]) rejectsSafely(() => normalize(value), "server-invalid-origin");
});

test("server origins reject URL features and parser spelling aliases", () => {
  const normalize = implementation("normalizeOrigin");
  for (const value of [
    null, undefined, 42, new URL(origin), "http://social.example", "https://social.example:444",
    "https://social.example:0443", "https://social.example:", "https://social.example.",
    "https://user:SECRET@social.example", "https://@social.example", "https://social.example/path",
    "https://social.example/.", "https://social.example/api/..", "https://social.example//",
    "https://social.example?", "https://social.example?token=SECRET", "https://social.example#", "https://social.example#SECRET",
    " https://social.example", "https://social.example\n", "https:\\social.example", "https://%73ocial.example", "https://sociál.example"
  ]) rejectsSafely(() => normalize(value), "server-invalid-origin");
});

test("server DNS host labels enforce LDH and total 253 character bounds", () => {
  const normalize = implementation("normalizeOrigin");
  for (const host of [
    "social", "social..example", "-social.example", "social-.example", "social_example.com",
    `${"a".repeat(64)}.example`, `${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(62)}`
  ]) rejectsSafely(() => normalize(`https://${host}`), "server-invalid-origin");
});

test("IPv4 public selection excludes every special prefix and multicast", () => {
  const isPublic = implementation("isPublicAddress");
  const cases = [
    ["0.0.0.0", false], ["0.255.255.255", false], ["1.0.0.0", true],
    ["9.255.255.255", true], ["10.0.0.0", false], ["10.255.255.255", false], ["11.0.0.0", true],
    ["100.63.255.255", true], ["100.64.0.0", false], ["100.127.255.255", false], ["100.128.0.0", true],
    ["126.255.255.255", true], ["127.0.0.0", false], ["127.255.255.255", false], ["128.0.0.0", true],
    ["169.253.255.255", true], ["169.254.0.0", false], ["169.254.255.255", false], ["169.255.0.0", true],
    ["172.15.255.255", true], ["172.16.0.0", false], ["172.31.255.255", false], ["172.32.0.0", true],
    ["192.0.0.0", false], ["192.0.0.9", false], ["192.0.0.255", false], ["192.0.1.0", true],
    ["192.0.2.0", false], ["192.0.2.255", false], ["192.0.3.0", true],
    ["192.31.195.255", true], ["192.31.196.0", false], ["192.31.196.255", false], ["192.31.197.0", true],
    ["192.52.192.255", true], ["192.52.193.0", false], ["192.52.193.255", false], ["192.52.194.0", true],
    ["192.88.98.255", true], ["192.88.99.0", false], ["192.88.99.255", false], ["192.88.100.0", true],
    ["192.167.255.255", true], ["192.168.0.0", false], ["192.168.255.255", false], ["192.169.0.0", true],
    ["192.175.47.255", true], ["192.175.48.0", false], ["192.175.48.255", false], ["192.175.49.0", true],
    ["198.17.255.255", true], ["198.18.0.0", false], ["198.19.255.255", false], ["198.20.0.0", true],
    ["198.51.99.255", true], ["198.51.100.0", false], ["198.51.100.255", false], ["198.51.101.0", true],
    ["203.0.112.255", true], ["203.0.113.0", false], ["203.0.113.255", false], ["203.0.114.0", true],
    ["223.255.255.255", true], ["224.0.0.0", false], ["239.255.255.255", false],
    ["240.0.0.0", false], ["255.255.255.254", false], ["255.255.255.255", false], ["8.8.8.8", true]
  ];
  for (const [address, want] of cases) assert.equal(isPublic(address), want, address);
});

test("IPv6 public selection enforces global unicast and the special prefix boundaries", () => {
  const isPublic = implementation("isPublicAddress");
  const cases = [
    ["1fff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", false], ["2000::", true],
    ["2001::", false], ["2001:1ff:ffff:ffff:ffff:ffff:ffff:ffff", false], ["2001:200::", true],
    ["2001:db7:ffff:ffff:ffff:ffff:ffff:ffff", true], ["2001:db8::", false],
    ["2001:db8:ffff:ffff:ffff:ffff:ffff:ffff", false], ["2001:db9::", true],
    ["2001:4860:4860::8888", true], ["2002::", false], ["2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff", false], ["2003::", true],
    ["2620:4f:7fff:ffff:ffff:ffff:ffff:ffff", true], ["2620:4f:8000::", false],
    ["2620:4f:8000:ffff:ffff:ffff:ffff:ffff", false], ["2620:4f:8001::", true],
    ["2606:4700:4700::1111", true], ["3ffe:ffff:ffff:ffff:ffff:ffff:ffff:ffff", true],
    ["3fff::", false], ["3fff:fff:ffff:ffff:ffff:ffff:ffff:ffff", false], ["3fff:1000::", true],
    ["3fff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", true], ["4000::", false],
    ["::", false], ["::1", false], ["::ffff:8.8.8.8", false], ["::ffff:127.0.0.1", false],
    ["64:ff9b::808:808", false], ["100::1", false], ["fc00::1", false], ["fe80::1", false], ["ff02::1", false]
  ];
  for (const [address, want] of cases) assert.equal(isPublic(address), want, address);
});

test("public addresses reject ambiguous text, scoped IPv6 and malformed inputs", () => {
  const isPublic = implementation("isPublicAddress");
  for (const address of [
    null, undefined, 4, {}, "", "8.8.8.8 ", " 8.8.8.8", "8.8.8.8\n", "08.8.8.8", "8.8.8", "0x08080808", "134744072",
    "256.0.0.1", "social.example", "[2606:4700::1111]", "2001:4860::1%eth0", "2001:4860::1%1", "2001:::1", "2001:4860::g"
  ]) assert.equal(isPublic(address), false, String(address));
});

test("DNS selection returns the first public address after validating up to 16 answers", () => {
  const select = implementation("selectPublicAddress");
  const first = { address:"2606:4700:4700::1111", family:6 };
  const results = [first, { address:"8.8.8.8", family:4 }];
  const selected = select(results);
  assert.deepEqual(selected, { address:"2606:4700:4700::1111", family:6 });
  assert.notEqual(selected, first);
  first.address = "::1";
  assert.equal(selected.address, "2606:4700:4700::1111");
  assert.deepEqual(select(Array.from({ length:16 }, () => ({ address:"8.8.8.8", family:4 }))), { address:"8.8.8.8", family:4 });
  assert.deepEqual(select([Object.assign(Object.create(null), { address:"8.8.8.8", family:4 })]), { address:"8.8.8.8", family:4 });
});

test("DNS selection fails closed when any answer is private, mapped, special or mismatched", () => {
  const select = implementation("selectPublicAddress");
  const publicAnswer = { address:"8.8.8.8", family:4 };
  for (const bad of [
    { address:"127.0.0.1", family:4 }, { address:"192.31.196.1", family:4 }, { address:"::ffff:8.8.8.8", family:6 },
    { address:"2620:4f:8000::1", family:6 }, { address:"fe80::1", family:6 },
    { address:"8.8.8.8", family:6 }, { address:"2606:4700::1111", family:4 }, { address:"8.8.8.8", family:"IPv4" }
  ]) {
    rejectsSafely(() => select([publicAnswer, bad]), "server-invalid-addresses");
    rejectsSafely(() => select([bad, publicAnswer]), "server-invalid-addresses");
  }
});

test("DNS selection accepts only bounded arrays of exact safe data records", () => {
  const select = implementation("selectPublicAddress");
  let accessed = 0;
  const accessor = { family:4, get address() { accessed++; return "8.8.8.8"; } };
  const hidden = { address:"8.8.8.8", family:4 };
  Object.defineProperty(hidden, "SECRET", { value:"hidden" });
  const symbol = { address:"8.8.8.8", family:4, [Symbol("SECRET")]:true };
  const arrayAccessor = [{ address:"8.8.8.8", family:4 }];
  Object.defineProperty(arrayAccessor, "0", { get() { accessed++; return { address:"8.8.8.8", family:4 }; } });
  for (const results of [
    null, {}, [], Array(1), Array.from({ length:17 }, () => ({ address:"8.8.8.8", family:4 })), arrayAccessor,
    [null], [[]], [{ address:"8.8.8.8" }], [{ address:"8.8.8.8", family:4, extra:"SECRET" }], [hidden], [symbol], [accessor],
    [Object.create({ address:"8.8.8.8", family:4 })]
  ]) rejectsSafely(() => select(results), "server-invalid-addresses");
  assert.equal(accessed, 0, "DNS getters cannot execute at the policy boundary");
});

test("Mastodon requests normalize exactly the four qualified routes and literal query", () => {
  const normalize = implementation("normalizeMastodonRequest");
  assert.deepEqual(normalize(input(), origin), {
    url:identity, method:"GET", path:"/api/v1/accounts/verify_credentials", targetId:null, action:null
  });
  assert.deepEqual(normalize(input(relationship), origin), {
    url:relationship, method:"GET", path:"/api/v1/accounts/relationships?id%5B%5D=42&with_suspended=true", targetId:"42", action:null
  });
  const reverse = `${origin}/api/v1/accounts/relationships?with_suspended=true&id%5B%5D=42`;
  assert.deepEqual(normalize(input(reverse), origin), {
    url:reverse, method:"GET", path:"/api/v1/accounts/relationships?with_suspended=true&id%5B%5D=42", targetId:"42", action:null
  });
  assert.deepEqual(normalize(input(block, "POST", { body:{} }), origin), {
    url:block, method:"POST", path:"/api/v1/accounts/42/block", targetId:"42", action:"block"
  });
  assert.deepEqual(normalize(input(`${origin}/api/v1/accounts/42/unblock`, "POST", { body:Object.create(null) }), origin), {
    url:`${origin}/api/v1/accounts/42/unblock`, method:"POST", path:"/api/v1/accounts/42/unblock", targetId:"42", action:"unblock"
  });
});

test("Mastodon requests preserve strict decimal ID bounds", () => {
  const normalize = implementation("normalizeMastodonRequest");
  for (const id of ["1", "9".repeat(40)]) {
    assert.equal(normalize(input(`${origin}/api/v1/accounts/${id}/block`, "POST", { body:{} }), origin).targetId, id);
    assert.equal(normalize(input(`${origin}/api/v1/accounts/relationships?id%5B%5D=${id}&with_suspended=true`), origin).targetId, id);
  }
  for (const id of ["", "0", "01", "-1", "1e2", "9".repeat(41), "%34%32", "42%2F43", "42%0A"]) {
    rejectsSafely(() => normalize(input(`${origin}/api/v1/accounts/${id}/block`, "POST", { body:{} }), origin), "server-invalid-request");
    rejectsSafely(() => normalize(input(`${origin}/api/v1/accounts/relationships?id%5B%5D=${id}&with_suspended=true`), origin), "server-invalid-request");
  }
});

test("Mastodon URLs reject alternate origins, path aliases, fragments and query on non-query routes", () => {
  const normalize = implementation("normalizeMastodonRequest");
  for (const url of [
    "/api/v1/accounts/verify_credentials", "http://social.example/api/v1/accounts/verify_credentials",
    "https://evil.example/api/v1/accounts/verify_credentials", "https://SOCIAL.example/api/v1/accounts/verify_credentials",
    "HTTPS://social.example/api/v1/accounts/verify_credentials", "https://social.example:443/api/v1/accounts/verify_credentials",
    "https://social.example./api/v1/accounts/verify_credentials", "https://user:SECRET@social.example/api/v1/accounts/verify_credentials",
    "https://@social.example/api/v1/accounts/verify_credentials", `${origin}/api/v1/accounts/a/../verify_credentials`,
    `${origin}/api/v1/accounts/%2e/verify_credentials`, `${origin}/api/v1/accounts/%76erify_credentials`,
    `${origin}/api/v1/accounts//verify_credentials`, `${origin}/api/v1/accounts/verify_credentials/`,
    `${identity}?`, `${identity}?x=SECRET`, `${identity}#`, `${identity}#SECRET`, ` ${identity}`, `${identity}\n`,
    `${origin}/api/v1/timelines/home`, `${origin}/api/v2/accounts/verify_credentials`
  ]) rejectsSafely(() => normalize(input(url), origin), "server-invalid-request");
  for (const suffix of ["?", "?x=SECRET", "#", "#SECRET", "/"]) {
    rejectsSafely(() => normalize(input(`${block}${suffix}`, "POST", { body:{} }), origin), "server-invalid-request");
  }
});

test("Mastodon relationships require exactly one canonical ID and with_suspended=true", () => {
  const normalize = implementation("normalizeMastodonRequest");
  for (const query of [
    "", "?", "?id%5B%5D=42", "?with_suspended=true", "?id=42&with_suspended=true",
    "?id[]=42&with_suspended=true", "?id%5b%5d=42&with_suspended=true", "?id%255B%255D=42&with_suspended=true",
    "?id%5B%5D=42&id%5B%5D=43&with_suspended=true", "?id%5B%5D=42&with_suspended=true&with_suspended=true",
    "?id%5B%5D=42&with_suspended=false", "?id%5B%5D=42&with_suspended=True", "?id%5B%5D=42&with_suspended=1",
    "?id%5B%5D=42&with_suspended=true&token=SECRET", "?id%5B%5D=%34%32&with_suspended=true",
    "?id%5B%5D=42&with_suspended=%74rue", "?id%5B%5D=42&%77ith_suspended=true", "?id%5B%5D=42&with_suspended=true&",
    "?id%5B%5D=42&with_suspended=true#", "?id%5B%5D=42+&with_suspended=true"
  ]) rejectsSafely(() => normalize(input(`${origin}/api/v1/accounts/relationships${query}`), origin), "server-invalid-request");
});

test("Mastodon methods and bodies admit only bodyless GET and empty-object POST", () => {
  const normalize = implementation("normalizeMastodonRequest");
  for (const body of [undefined, null, {}, "", "{}", []]) {
    rejectsSafely(() => normalize(input(identity, "GET", { body }), origin), "server-invalid-request");
    rejectsSafely(() => normalize(input(relationship, "GET", { body }), origin), "server-invalid-request");
  }
  for (const body of [undefined, null, "{}", [], new Date(), { id:"42" }, { [Symbol("SECRET")]:true }, Object.create({ inherited:true })]) {
    rejectsSafely(() => normalize(input(block, "POST", { body }), origin), "server-invalid-request");
  }
  const hidden = {};
  Object.defineProperty(hidden, "SECRET", { value:true });
  rejectsSafely(() => normalize(input(block, "POST", { body:hidden }), origin), "server-invalid-request");
  rejectsSafely(() => normalize(input(block, "POST"), origin), "server-invalid-request");
  for (const request of [
    input(identity, "POST", { body:{} }), input(relationship, "POST", { body:{} }), input(block, "GET"),
    input(identity, "get"), input(identity, "HEAD"), input(block, "DELETE", { body:{} })
  ]) rejectsSafely(() => normalize(request, origin), "server-invalid-request");
});

test("Mastodon transport options require exact data-only keys and a real optional AbortSignal", () => {
  const normalize = implementation("normalizeMastodonRequest");
  const controller = new AbortController();
  assert.equal(normalize(input(identity, "GET", { signal:controller.signal }), origin).url, identity);
  controller.abort();
  assert.equal(normalize(input(identity, "GET", { signal:controller.signal }), origin).url, identity);
  assert.equal(normalize(input(identity, "GET", { signal:undefined }), origin).url, identity);
  for (const key of ["url", "method", "redirect", "credentials"]) {
    const request = input();
    delete request[key];
    rejectsSafely(() => normalize(request, origin), "server-invalid-request");
  }
  let accessed = 0;
  const accessor = input();
  Object.defineProperty(accessor, "url", { enumerable:true, get() { accessed++; return identity; } });
  const hidden = input();
  Object.defineProperty(hidden, "SECRET", { value:true });
  for (const request of [
    null, [], Object.create(input()), accessor, hidden,
    input(identity, "GET", { headers:{ Authorization:"Bearer SECRET" } }), input(identity, "GET", { agent:{} }),
    input(identity, "GET", { timeout:1 }), input(identity, "GET", { [Symbol("SECRET")]:true }),
    input(identity, "GET", { redirect:"follow" }), input(identity, "GET", { credentials:"include" }),
    input(identity, "GET", { signal:null }), input(identity, "GET", { signal:{ aborted:false, addEventListener() {}, removeEventListener() {} } }),
    input(identity, "GET", { signal:Object.create(AbortSignal.prototype) })
  ]) rejectsSafely(() => normalize(request, origin), "server-invalid-request");
  assert.equal(accessed, 0, "request getters cannot execute at the policy boundary");
});

test("policy errors discard thrown input messages and arbitrary error details", () => {
  const normalize = implementation("normalizeMastodonRequest");
  const select = implementation("selectPublicAddress");
  const hostile = new Proxy({}, { getPrototypeOf() { throw new Error("SECRET token"); } });
  rejectsSafely(() => normalize(hostile, origin), "server-invalid-request");
  rejectsSafely(() => normalize(input(), "https://SECRET@social.example"), "server-invalid-request");
  rejectsSafely(() => select([hostile]), "server-invalid-addresses");
});
