import { PLATFORMS, CATEGORIES, getControl } from "./platforms.js";

export const MAX_FLOW_ITEMS = 500;
export const MAX_FLOW_EVENTS = 32;
const MAX_TIME = 8_640_000_000_000_000;
const ID = /^[a-zA-Z0-9-]{1,80}$/;
const FIELDS = ["version", "setupComplete", "platforms", "categories", "items"];
const ITEM_FIELDS = ["id", "platform", "control", "target", "status", "createdAt", "updatedAt"];

function record(raw, keys) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) ||
      Object.keys(raw).length !== keys.length || keys.some(key => !Object.hasOwn(raw, key)))
    throw Error("Structure de préférence invalide : champs absents ou non autorisés.");
}
function selection(values, catalogue, maximum, allowLocal = true) {
  if (!Array.isArray(values) || values.length > maximum || new Set(values).size !== values.length ||
      values.some(value => typeof value !== "string" || !Object.hasOwn(catalogue, value) || (!allowLocal && value === "local")))
    throw Error("Sélection de services ou de catégories invalide.");
  return [...values];
}
function time(value) { return Number.isInteger(value) && value > 0 && value <= MAX_TIME; }
function targetText(value) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 200 || /[\u0000-\u001f\u007f]/.test(value))
    throw Error("Indiquez une cible sur une ligne, de 1 à 200 caractères.");
  return value.trim();
}
function itemKey(item) { return [item.platform, item.control, item.target.toLowerCase()].join("\u0000"); }
function statuses(control) {
  return control.mode === "local" ? ["local", "cancelled"] : ["planned", "declared", "failed", "review", "cancelled"];
}

export function newFlows() {
  return { version:1, setupComplete:false, platforms:[], categories:Object.keys(CATEGORIES), items:[] };
}

/** Local intentions/declarations only. A backup can never introduce API evidence. */
export function validateFlows(raw) {
  record(raw, FIELDS);
  if (raw.version !== 1 || typeof raw.setupComplete !== "boolean") throw Error("Version de carnet de flux invalide.");
  const platforms = selection(raw.platforms, PLATFORMS, Object.keys(PLATFORMS).length - 1, false);
  const categories = selection(raw.categories, CATEGORIES, 4);
  if (!categories.length) throw Error("Choisissez au moins une catégorie.");
  if (!Array.isArray(raw.items) || raw.items.length > MAX_FLOW_ITEMS) throw Error("Maximum : 500 préférences.");
  const ids = new Set(), keys = new Set();
  const items = raw.items.map(item => {
    record(item, Object.hasOwn(item || {}, "events") ? [...ITEM_FIELDS, "events"] : ITEM_FIELDS);
    const control = getControl(item.platform, item.control);
    if (typeof item.id !== "string" || !ID.test(item.id) || ids.has(item.id) || !control)
      throw Error("Service, contrôle ou identifiant de préférence invalide.");
    const target = targetText(item.target);
    if (target !== item.target || !time(item.createdAt) || !time(item.updatedAt) || item.updatedAt < item.createdAt)
      throw Error("Cible ou dates de préférence invalides.");
    const allowed = statuses(control);
    if (!allowed.includes(item.status)) throw Error("Statut de préférence invalide : aucune confirmation API importable.");
    let events;
    if (Object.hasOwn(item, "events")) {
      if (!Array.isArray(item.events) || !item.events.length || item.events.length > MAX_FLOW_EVENTS)
        throw Error("Historique de préférence invalide : de 1 à 32 entrées.");
      let previous = item.createdAt;
      events = item.events.map(event => {
        record(event, ["status", "at"]);
        if (!allowed.includes(event.status) || !time(event.at) || event.at < previous || event.at > item.updatedAt)
          throw Error("État ou date d’historique invalide ; aucune confirmation API importable.");
        previous = event.at;
        return { status:event.status, at:event.at };
      });
      if (events.at(-1).status !== item.status || events.at(-1).at !== item.updatedAt)
        throw Error("Le dernier historique doit correspondre à l’état actuel.");
    }
    const key = itemKey(item);
    if (keys.has(key)) throw Error("Préférence en double.");
    ids.add(item.id); keys.add(key);
    return { id:item.id, platform:item.platform, control:item.control, target, status:item.status,
      createdAt:item.createdAt, updatedAt:item.updatedAt, ...(events ? { events } : {}) };
  });
  return { version:1, setupComplete:raw.setupComplete, platforms, categories, items };
}

export function configureFlows(flows, platforms, categories) {
  const current = validateFlows(flows);
  return validateFlows({ ...current, setupComplete:true, platforms, categories });
}

export function addFlow(flows, input, now = Date.now()) {
  const current = validateFlows(flows);
  if (!input || typeof input !== "object" || !time(now)) throw Error("Préférence ou date invalide.");
  const control = getControl(input.platform, input.control);
  if (!control || (input.platform !== "local" && !current.platforms.includes(input.platform)) ||
      !current.categories.includes(control.category)) throw Error("Activez d’abord ce service et cette catégorie dans vos choix.");
  const status = control.mode === "local" ? "local" : "planned";
  const item = { id:input.id, platform:input.platform, control:input.control, target:targetText(input.target),
    status, createdAt:now, updatedAt:now, events:[{ status, at:now }] };
  return validateFlows({ ...current, items:[...current.items, item] });
}

export function setFlowStatus(flows, id, status, now = Date.now()) {
  const current = validateFlows(flows);
  const item = current.items.find(entry => entry.id === id);
  if (!item || !time(now) || now < item.updatedAt) throw Error("Préférence absente ou date antérieure au dernier changement.");
  if (!statuses(getControl(item.platform, item.control)).includes(status)) throw Error("Statut de préférence invalide : aucune confirmation API importable.");
  if (item.status === status) return current;
  // Older snapshots have no change history: seed only their last known state,
  // never invent transitions between creation and the V3 change.
  const events = [...(item.events || [{ status:item.status, at:item.updatedAt }]), { status, at:now }].slice(-MAX_FLOW_EVENTS);
  return validateFlows({ ...current, items:current.items.map(entry => entry.id === id ? { ...entry, status, updatedAt:now, events } : entry) });
}

/** Return to the previous local status, recording that change. Never call a provider. */
export function undoFlowStatus(flows, id, now = Date.now()) {
  const current = validateFlows(flows), item = current.items.find(entry => entry.id === id);
  if (!item || !time(now) || now < item.updatedAt) throw Error("Préférence absente ou date antérieure au dernier changement.");
  if (!item.events || item.events.length < 2) throw Error("Aucun état précédent disponible dans cet historique.");
  return setFlowStatus(current, id, item.events.at(-2).status, now);
}

/** Forget this local record only; never undo a provider action. */
export function removeFlow(flows, id) {
  const current = validateFlows(flows);
  return { ...current, items:current.items.filter(item => item.id !== id) };
}
