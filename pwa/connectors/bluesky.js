import { atprotoDid, captureSession, ConnectorError, recordKey, registerConnector, request } from "./internal.js";

const collection = "app.bsky.graph.block";
const blockScope = "repo:app.bsky.graph.block?action=create&action=delete";

export function createBlueskyConnector(options) {
  const session = captureSession(options, "bluesky", ["atproto", blockScope], atprotoDid);
  const maxPages = options.maxPages ?? 100;
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) throw new ConnectorError("invalid-page-budget");
  function normalizeTarget(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new ConnectorError("invalid-target");
    return Object.freeze({ did:atprotoDid(input.did), rkey:recordKey(input.rkey) });
  }
  async function readIdentity({ signal } = {}) {
    const body = await request(session, "/xrpc/com.atproto.server.getSession", { signal });
    if (!body || body.did !== session.accountId) throw new ConnectorError("identity-mismatch");
  }
  async function readState(input, { signal } = {}) {
    const target = normalizeTarget(input);
    const matches = [];
    const cursors = new Set();
    const recordsSeen = new Map();
    let cursor;
    let occupiedRkey = false;
    for (let page = 0; page < maxPages; page++) {
      const body = await request(session, "/xrpc/com.atproto.repo.listRecords", { signal, query:{ repo:session.accountId, collection, limit:"100", ...(cursor ? { cursor } : {}) } });
      if (!body || !Array.isArray(body.records) || body.records.length > 100) throw new ConnectorError("invalid-record-page");
      for (const record of body.records) {
        const prefix = `at://${session.accountId}/${collection}/`;
        if (!record || typeof record.uri !== "string" || !record.uri.startsWith(prefix) || typeof record.cid !== "string" || !record.cid || record.cid.length > 256 || record.value?.$type !== collection) throw new ConnectorError("invalid-block-record");
        const key = recordKey(record.uri.slice(prefix.length));
        const subject = atprotoDid(record.value.subject);
        if (typeof record.value.createdAt !== "string" || !Number.isFinite(Date.parse(record.value.createdAt))) throw new ConnectorError("invalid-block-record");
        if (recordsSeen.has(record.uri)) {
          if (recordsSeen.get(record.uri) !== record.cid) throw new ConnectorError("inconsistent-record-page");
          continue;
        }
        recordsSeen.set(record.uri, record.cid);
        if (key === target.rkey && subject !== target.did) occupiedRkey = true;
        if (subject === target.did) matches.push({ uri:record.uri, cid:record.cid, rkey:key });
      }
      if (body.cursor === undefined) return { target, blocked:matches.length > 0, records:matches, occupiedRkey };
      if (typeof body.cursor !== "string" || !body.cursor || body.cursor.length > 2048 || cursors.has(body.cursor)) throw new ConnectorError("incomplete-block-read");
      cursors.add(body.cursor);
      cursor = body.cursor;
    }
    // Budget exhaustion is never evidence of absence.
    throw new ConnectorError("incomplete-block-read");
  }
  async function write(input, action, state, { signal, beforeWrite, now } = {}) {
    const target = normalizeTarget(input);
    let accepted = false;
    try {
      if (action === "block") {
        if (state.occupiedRkey) throw new ConnectorError("record-key-conflict");
        beforeWrite();
        const body = await request(session, "/xrpc/com.atproto.repo.createRecord", { method:"POST", signal, body:{
          repo:session.accountId, collection, rkey:target.rkey, validate:true,
          record:{ $type:collection, subject:target.did, createdAt:new Date(now()).toISOString() }
        } });
        if (body?.uri !== `at://${session.accountId}/${collection}/${target.rkey}` || typeof body.cid !== "string" || !body.cid) throw new ConnectorError("invalid-write-response", { sent:true, mutation:true, uncertain:true });
        accepted = true;
      } else {
        for (const record of state.records) {
          beforeWrite();
          await request(session, "/xrpc/com.atproto.repo.deleteRecord", { method:"POST", signal, body:{ repo:session.accountId, collection, rkey:record.rkey, swapRecord:record.cid } });
          accepted = true;
        }
      }
      return { accepted };
    } catch (error) {
      if (error instanceof ConnectorError) error.partialAccepted = accepted;
      throw error;
    }
  }
  return registerConnector(session, { normalizeTarget, targetKey:target => target.did, readIdentity, readState, write });
}
