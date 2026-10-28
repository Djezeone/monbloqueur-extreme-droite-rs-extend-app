import { PLATFORMS, CATEGORIES, getControl } from "./platforms.js";

export const MAX_FLOW_ITEMS = 500;
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
    record(item, ITEM_FIELDS);
    const control = getControl(item.platform, item.control);
    if (typeof item.id !== "string" || !ID.test(item.id) || ids.has(item.id) || !control)
      throw Error("Service, contrôle ou identifiant de préférence invalide.");
    const target = targetText(item.target);
    if (target !== item.target || !time(item.createdAt) || !time(item.updatedAt) || item.updatedAt < item.createdAt)
      throw Error("Cible ou dates de préférence invalides.");
    const statuses = control.mode === "local" ? ["local"] : ["planned", "declared"];
    if (!statuses.includes(item.status)) throw Error("Statut de préférence invalide : aucune confirmation API importable.");
    const key = itemKey(item);
    if (keys.has(key)) throw Error("Préférence en double.");
    ids.add(item.id); keys.add(key);
    return { id:item.id, platform:item.platform, control:item.control, target, status:item.status,
      createdAt:item.createdAt, updatedAt:item.updatedAt };
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
  const item = { id:input.id, platform:input.platform, control:input.control, target:targetText(input.target),
    status:control.mode === "local" ? "local" : "planned", createdAt:now, updatedAt:now };
  return validateFlows({ ...current, items:[...current.items, item] });
}

export function setFlowStatus(flows, id, status, now = Date.now()) {
  const current = validateFlows(flows);
  const item = current.items.find(entry => entry.id === id);
  if (!item || !time(now) || now < item.updatedAt) throw Error("Préférence absente ou date antérieure au dernier changement.");
  return validateFlows({ ...current, items:current.items.map(entry => entry.id === id ? { ...entry, status, updatedAt:now } : entry) });
}

/** Forget this local record only; never undo a provider action. */
export function removeFlow(flows, id) {
  const current = validateFlows(flows);
  return { ...current, items:current.items.filter(item => item.id !== id) };
}
