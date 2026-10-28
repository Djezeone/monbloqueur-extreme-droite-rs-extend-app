// Internal adapter contract. No HTTP implementation or credentials live in this module.
const implementations = new WeakMap();

export class ConnectorError extends Error {
  constructor(code, detail = {}) {
    super(code);
    this.name = "ConnectorError";
    this.code = code;
    Object.assign(this, detail);
  }
}

export function decimalId(value) {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,39}$/.test(value)) throw new ConnectorError("invalid-account-id");
  return value;
}

export function atprotoDid(value) {
  if (typeof value !== "string" || value.length > 2048 || !/^did:(plc:[a-z2-7]{24}|web:[A-Za-z0-9._:%-]+)$/.test(value) || /%(?![0-9A-Fa-f]{2})/.test(value)) {
    throw new ConnectorError("invalid-did");
  }
  return value;
}

export function recordKey(value) {
  // app.bsky.graph.block uses TID keys, supplied by the caller's qualified SDK.
  if (typeof value !== "string" || !/^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/.test(value)) throw new ConnectorError("invalid-record-key");
  return value;
}

function httpsOrigin(value) {
  if (typeof value !== "string") throw new ConnectorError("invalid-origin");
  let url;
  try { url = new URL(value); } catch { throw new ConnectorError("invalid-origin"); }
  const host = url.hostname;
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash ||
      !host.includes(".") || /^[0-9.]+$/.test(host) || host.includes(":") || /(^|\.)(localhost|local|internal)$/.test(host) ||
      !host.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new ConnectorError("invalid-origin");
  }
  return url.origin;
}

export function captureSession(options, provider, scopes, validateAccount) {
  const { session, transport, allowedOrigins, timeoutMs = 15_000 } = options || {};
  if (!session || session.type !== "official-oauth" || session.provider !== provider || typeof transport !== "function") throw new ConnectorError("official-session-required");
  if (!Array.isArray(allowedOrigins) || !allowedOrigins.length) throw new ConnectorError("origin-not-allowed");
  const origin = httpsOrigin(session.origin);
  if (!allowedOrigins.map(httpsOrigin).includes(origin)) throw new ConnectorError("origin-not-allowed");
  const accountId = validateAccount(session.accountId);
  if (!Array.isArray(session.scopes) || session.scopes.length !== scopes.length || new Set(session.scopes).size !== scopes.length || !scopes.every(scope => session.scopes.includes(scope))) {
    throw new ConnectorError("minimal-scopes-required");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new ConnectorError("invalid-timeout");
  // Capture scalar values; later changes to the caller's session cannot switch accounts.
  return Object.freeze({ provider, origin, accountId, transport, timeoutMs });
}

function headerValue(headers, name) {
  if (headers && typeof headers.get === "function") return headers.get(name);
  const entry = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return entry ? entry[1] : null;
}

export function cooldownTime(headers, now) {
  const value = headerValue(headers, "Retry-After");
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const seconds = Number(value);
    if (Number.isSafeInteger(seconds) && Number.isSafeInteger(now + seconds * 1000)) return Math.max(now + 1000, now + seconds * 1000);
  }
  const date = typeof value === "string" ? Date.parse(value) : NaN;
  if (Number.isFinite(date) && date >= now) return Math.max(now + 1000, date);
  const reset = headerValue(headers, "X-RateLimit-Reset");
  const resetDate = typeof reset === "string" ? Date.parse(reset) : NaN;
  return Number.isFinite(resetDate) && resetDate > now ? resetDate : now + 60_000;
}

export async function request(session, path, { method = "GET", body, signal, query } = {}) {
  if (signal?.aborted) throw new ConnectorError("cancelled", { sent:false });
  const url = new URL(path, session.origin);
  if (url.origin !== session.origin || !path.startsWith("/")) throw new ConnectorError("invalid-endpoint");
  if (query) for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const controller = new AbortController();
  const mutation = method === "POST";
  let sent = false;
  let timer;
  let onAbort;
  try {
    const interrupted = new Promise((resolve, reject) => {
      onAbort = () => {
        controller.abort();
        reject(new ConnectorError("cancelled", { sent, mutation, uncertain:sent && mutation }));
      };
      signal?.addEventListener("abort", onAbort, { once:true });
      timer = setTimeout(() => {
        controller.abort();
        reject(new ConnectorError("timeout", { sent, mutation, uncertain:sent && mutation }));
      }, session.timeoutMs);
    });
    if (signal?.aborted) onAbort();
    else sent = true;
    const remote = sent ? Promise.resolve().then(() => {
      // A cancelled microtask must not start an authenticated request.
      if (controller.signal.aborted) throw new ConnectorError("cancelled", { sent:false, mutation });
      return session.transport({ url:url.href, method, ...(body === undefined ? {} : { body }), redirect:"error", credentials:"omit", signal:controller.signal });
    }) : new Promise(() => {});
    const response = await Promise.race([remote, interrupted]);
    if (!response || response.url !== url.href || !Number.isInteger(response.status) || response.status < 100 || response.status > 599) throw new ConnectorError("invalid-response", { sent:true, mutation, uncertain:mutation });
    if (response.status !== 200) {
      // A gateway/server error or an unexpected protocol response can arrive
      // after the provider applied the mutation. Only documented client refusals
      // are deterministic; never turn a 5xx/timeout/redirect into replay permission.
      const deterministic = [400, 401, 403, 404, 405, 409, 410, 415, 422, 429].includes(response.status);
      const code = response.status === 401 ? "unauthorized" : response.status === 403 ? "forbidden" : response.status === 429 ? "rate-limited" : response.body?.error === "InvalidSwap" ? "record-conflict" : "provider-rejected";
      throw new ConnectorError(code, { status:response.status, headers:response.headers, sent:true, mutation, uncertain:mutation && !deterministic });
    }
    return response.body;
  } catch (error) {
    if (error instanceof ConnectorError) throw error;
    // Never expose provider messages, URLs, token values or arbitrary exception text.
    throw new ConnectorError("network-error", { sent, mutation, uncertain:sent && mutation });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

export function registerConnector(session, implementation) {
  const handle = Object.freeze({
    provider:session.provider,
    accountId:session.accountId,
    origin:session.origin,
    async inspect(input, { signal } = {}) {
      const target = implementation.normalizeTarget(input);
      await implementation.readIdentity({ signal });
      return structuredClone(await implementation.readState(target, { signal }));
    }
  });
  implementations.set(handle, implementation);
  return handle;
}

export function connectorImplementation(handle) {
  const implementation = implementations.get(handle);
  if (!implementation) throw new ConnectorError("official-connector-required");
  return implementation;
}
