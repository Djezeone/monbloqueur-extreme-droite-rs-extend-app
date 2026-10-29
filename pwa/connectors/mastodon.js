import { captureSession, ConnectorError, decimalId, registerConnector, request } from "./internal.js";

export function createMastodonConnector(options) {
  const session = captureSession(options, "mastodon", ["profile", "write:blocks", "read:follows"], decimalId);
  const normalizeTarget = decimalId;
  async function readIdentity({ signal } = {}) {
    const body = await request(session, "/api/v1/accounts/verify_credentials", { signal });
    if (!body || body.id !== session.accountId) throw new ConnectorError("identity-mismatch");
  }
  async function readState(target, { signal } = {}) {
    const body = await request(session, "/api/v1/accounts/relationships", { signal, query:{ "id[]":normalizeTarget(target), with_suspended:"true" } });
    if (!Array.isArray(body) || body.length !== 1 || body[0]?.id !== target || typeof body[0]?.blocking !== "boolean") throw new ConnectorError("invalid-relationship");
    return { target, blocked:body[0].blocking };
  }
  async function write(target, action, state, { signal, beforeWrite } = {}) {
    await beforeWrite();
    const body = await request(session, `/api/v1/accounts/${normalizeTarget(target)}/${action}`, { method:"POST", body:{}, signal });
    // This validates acceptance only. A new GET is still required for confirmation.
    if (!body || body.id !== target || typeof body.blocking !== "boolean" || body.blocking !== (action === "block")) {
      throw new ConnectorError("invalid-write-response", { sent:true, mutation:true, uncertain:true });
    }
    return { accepted:true };
  }
  return registerConnector(session, { normalizeTarget, targetKey:target => target, readIdentity, readState, write });
}
