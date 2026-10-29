import { atprotoDid, ConnectorError, decimalId, recordKey } from "./internal.js";

const databaseName = "fil-clair-operations-v1";
const storeName = "lanes";
const checkpointKeys = ["version", "operationId", "target", "targetKey", "action", "phase", "attempts", "createdAt", "updatedAt", "retryAt", "reason", "observation"];
const reasons = new Set([null, "completed", "no-write", "provider-refusal", "rate-limited", "session-stopped", "interrupted-before-send",
  "interrupted-after-send", "uncertain", "storage-error", "observed-match", "observed-differs", "read-failed", "stopped"]);
const timestamp = value => Number.isSafeInteger(value) && value >= 0;
const fail = code => { throw new ConnectorError(code); };

function exactObject(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  const ownKeys = Reflect.ownKeys(value);
  return ownKeys.length === keys.length && keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && Object.hasOwn(descriptor, "value") && descriptor.enumerable;
  });
}

function normalizeLane(input) {
  try {
    if (!exactObject(input, ["provider", "accountId", "origin"]) || !["mastodon", "bluesky"].includes(input.provider)) fail("journal-invalid-lane");
    const accountId = input.provider === "mastodon" ? decimalId(input.accountId) : atprotoDid(input.accountId);
    if (typeof input.origin !== "string") fail("journal-invalid-lane");
    const url = new URL(input.origin), host = url.hostname;
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash ||
        !host.includes(".") || /^[0-9.]+$/.test(host) || host.includes(":") || /(^|\.)(localhost|local|internal)$/.test(host) ||
        !host.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) fail("journal-invalid-lane");
    return { provider:input.provider, accountId, origin:url.origin };
  } catch { fail("journal-invalid-lane"); }
}

function checkpoint(input, lane, stored = false) {
  const code = stored ? "journal-corrupt" : "journal-invalid-checkpoint";
  try {
    if (!exactObject(input, stored ? [...checkpointKeys, "revision"] : checkpointKeys) || input.version !== 1 ||
        typeof input.operationId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.operationId) ||
        !["block", "unblock"].includes(input.action) || !["prepared", "sending", "closed", "quarantined"].includes(input.phase) ||
        !Number.isInteger(input.attempts) || input.attempts < 0 || input.attempts > 100 ||
        (input.phase === "prepared" && input.attempts !== 0) || (["sending", "quarantined"].includes(input.phase) && input.attempts < 1) ||
        !timestamp(input.createdAt) || !timestamp(input.updatedAt) || input.updatedAt < input.createdAt ||
        !timestamp(input.retryAt) || !reasons.has(input.reason) ||
        (stored && (!Number.isSafeInteger(input.revision) || input.revision < 1))) fail(code);
    let target;
    if (lane.provider === "mastodon") {
      target = decimalId(input.target);
      if (input.targetKey !== target) fail(code);
    } else {
      if (!exactObject(input.target, ["did", "rkey"])) fail(code);
      target = { did:atprotoDid(input.target.did), rkey:recordKey(input.target.rkey) };
      if (input.targetKey !== target.did) fail(code);
    }
    let observation = null;
    if (input.observation !== null) {
      if (!exactObject(input.observation, ["blocked", "observedAt"]) || typeof input.observation.blocked !== "boolean" || !timestamp(input.observation.observedAt)) fail(code);
      observation = { blocked:input.observation.blocked, observedAt:input.observation.observedAt };
    }
    return { version:1, operationId:input.operationId, target, targetKey:input.targetKey, action:input.action, phase:input.phase,
      attempts:input.attempts, createdAt:input.createdAt, updatedAt:input.updatedAt, retryAt:input.retryAt, reason:input.reason, observation,
      ...(stored ? { revision:input.revision } : {}) };
  } catch { fail(code); }
}

function storedCheckpoint(input, lane, key) {
  try {
    if (!exactObject(input, ["key", "lane", "checkpoint"]) || input.key !== key) fail("journal-corrupt");
    const storedLane = normalizeLane(input.lane);
    if (input.lane.origin !== storedLane.origin || storedLane.provider !== lane.provider || storedLane.accountId !== lane.accountId || storedLane.origin !== lane.origin) fail("journal-corrupt");
    return checkpoint(input.checkpoint, lane, true);
  } catch { fail("journal-corrupt"); }
}

export function createOperationJournal(options = {}) {
  let indexedDB, timeoutMs;
  try {
    timeoutMs = options.timeoutMs === undefined ? 5000 : options.timeoutMs;
    indexedDB = options.indexedDB === undefined ? globalThis.indexedDB : options.indexedDB;
  } catch { indexedDB = null; }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000) fail("journal-invalid-timeout");

  function transact(lane, next, expectedRevision) {
    return new Promise((resolve, reject) => {
      let request, db, transaction, result, ready = false, settled = false;
      const key = JSON.stringify([lane.provider, lane.accountId, lane.origin]);
      const finish = error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error && transaction) { try { transaction.abort(); } catch { /* Already complete or aborted. */ } }
        if (db) { try { db.close(); } catch { /* The connection may already be closed. */ } }
        if (error) reject(error); else resolve(result);
      };
      const refused = code => finish(new ConnectorError(code));
      const timer = setTimeout(() => {
        if (request?.transaction) { try { request.transaction.abort(); } catch { /* Open may already have completed. */ } }
        refused("journal-timeout");
      }, timeoutMs);
      try {
        if (!indexedDB || typeof indexedDB.open !== "function") { refused("journal-unavailable"); return; }
        request = indexedDB.open(databaseName, 1);
        request.onerror = () => refused("journal-storage-error");
        request.onblocked = () => refused("journal-storage-error");
        request.onupgradeneeded = () => {
          if (settled) { try { request.transaction.abort(); } catch { /* Timed out before upgrade. */ } return; }
          try { request.result.createObjectStore(storeName, { keyPath:"key" }); }
          catch { refused("journal-storage-error"); }
        };
        request.onsuccess = () => {
          db = request.result;
          if (settled) { db.close(); return; }
          db.onversionchange = () => refused("journal-storage-error");
          if (db.version !== 1 || db.objectStoreNames.length !== 1 || !db.objectStoreNames.contains(storeName)) { refused("journal-corrupt"); return; }
          try { transaction = db.transaction(storeName, next ? "readwrite" : "readonly", { durability:"strict" }); }
          catch { refused("journal-durability-unavailable"); return; }
          transaction.onabort = () => refused("journal-storage-error");
          transaction.onerror = () => refused("journal-storage-error");
          transaction.oncomplete = () => ready ? finish() : refused("journal-storage-error");
          if (transaction.durability !== "strict") { refused("journal-durability-unavailable"); return; }
          try {
            const store = transaction.objectStore(storeName);
            if (store.keyPath !== "key" || store.autoIncrement) { refused("journal-corrupt"); return; }
            const get = store.get(key);
            get.onerror = () => refused("journal-storage-error");
            get.onsuccess = () => {
              if (settled) return;
              try {
                const previous = get.result === undefined ? null : storedCheckpoint(get.result, lane, key);
                if (!next) { result = previous; ready = true; return; }
                if ((previous?.revision ?? null) !== expectedRevision) { result = null; ready = true; return; }
                if (previous?.operationId === next.operationId && (next.createdAt !== previous.createdAt || next.updatedAt < previous.updatedAt)) fail("journal-invalid-checkpoint");
                const revision = (previous?.revision ?? 0) + 1;
                if (!Number.isSafeInteger(revision)) fail("journal-revision-exhausted");
                const put = () => {
                  result = { ...next, revision };
                  store.put({ key, lane, checkpoint:result });
                  ready = true;
                };
                if (previous) { put(); return; }
                const count = store.count();
                count.onerror = () => refused("journal-storage-error");
                count.onsuccess = () => {
                  if (settled) return;
                  if (count.result >= 128) { refused("journal-capacity"); return; }
                  try { put(); } catch { refused("journal-storage-error"); }
                };
              } catch (error) { finish(error instanceof ConnectorError ? error : new ConnectorError("journal-storage-error")); }
            };
          } catch { refused("journal-storage-error"); }
        };
      } catch { refused("journal-storage-error"); }
    });
  }

  return Object.freeze({
    async read(input) {
      return transact(normalizeLane(input));
    },
    async compareAndSet(input, expectedRevision, next) {
      const lane = normalizeLane(input);
      if (expectedRevision !== null && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)) fail("journal-invalid-revision");
      return transact(lane, checkpoint(next, lane), expectedRevision);
    }
  });
}
