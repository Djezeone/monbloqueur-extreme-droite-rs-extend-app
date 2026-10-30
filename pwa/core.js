import { validateFlows } from "./flow-core.js";

export const NETWORKS = Object.freeze({
  x: "X", bluesky: "Bluesky", mastodon: "Mastodon",
  instagram: "Instagram", threads: "Threads", tiktok: "TikTok",
  facebook: "Facebook", youtube: "YouTube", reddit: "Reddit",
  linkedin: "LinkedIn"
});
const VALID_HANDLE = /^[a-zA-Z0-9_.-]{1,80}$/;
const VALID_HOST = /^(?=.{4,253}$)(?!.*\.\.)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}$/i;
export const MAX_ACCOUNTS = 5000;
export const MAX_IMPORT_BYTES = 2_000_000;
export const MAX_LISTS = 30;
const MAX_TIMESTAMP = 8_640_000_000_000_000;
const MAX_DECISIONS = 10_000;

function boundedText(value, maximum, message, singleLine = true) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maximum ||
      (singleLine && /[\u0000-\u001f\u007f]/.test(value)))
    throw Error(message);
  return value.trim();
}
function validTimestamp(value) {
  return Number.isInteger(value) && value > 0 && value <= MAX_TIMESTAMP;
}

/** Declared source metadata only: never provider evidence and never fetched. */
export function listMetadata(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Métadonnées de liste invalides.");
  const metadata = {};
  if (Object.hasOwn(input, "revision"))
    metadata.revision = boundedText(input.revision, 80, "Révision de liste invalide (80 caractères maximum).");
  if (Object.hasOwn(input, "provenance")) {
    const source = input.provenance;
    if (!source || typeof source !== "object" || Array.isArray(source) ||
        Object.keys(source).some(key => !["label", "url", "retrievedAt"].includes(key)) ||
        (!Object.hasOwn(source, "label") && !Object.hasOwn(source, "url")))
      throw Error("Provenance de liste invalide.");
    const provenance = {};
    if (Object.hasOwn(source, "label"))
      provenance.label = boundedText(source.label, 160, "Libellé de provenance invalide (160 caractères maximum).");
    if (Object.hasOwn(source, "url")) {
      const value = boundedText(source.url, 2048, "URL de provenance invalide.");
      let url;
      try { url = new URL(value); } catch { throw Error("URL de provenance invalide."); }
      if (url.protocol !== "https:" || url.username || url.password || /[?#\s]/.test(value))
        throw Error("La provenance exige une URL HTTPS sans identifiants, paramètres ni fragment.");
      provenance.url = value;
    }
    if (Object.hasOwn(source, "retrievedAt")) {
      if (!validTimestamp(source.retrievedAt)) throw Error("Date de provenance invalide.");
      provenance.retrievedAt = source.retrievedAt;
    }
    metadata.provenance = provenance;
  }
  return metadata;
}

export function normalise(input) {
  if (!input || typeof input !== "object") throw Error("Profil manquant.");
  const network = String(input.network || "").trim().toLowerCase();
  if (!Object.hasOwn(NETWORKS, network)) throw Error("Réseau non pris en charge.");
  const handle = String(input.handle || input.username || "").trim().replace(/^@/, "");
  if (!VALID_HANDLE.test(handle) || handle.includes(".."))
    throw Error("Identifiant incorrect : indiquez un pseudo, pas une URL.");
  let instance = "";
  if (network === "mastodon") {
    instance = String(input.instance || "").trim().toLowerCase().replace(/^https:\/\//, "").replace(/\/$/, "");
    if (!VALID_HOST.test(instance)) throw Error("Instance Mastodon invalide (exemple : mastodon.social).");
  }
  if (network === "x" && !/^[a-zA-Z0-9_]{1,15}$/.test(handle))
    throw Error("Pseudo X invalide (15 caractères maximum).");
  return { network, handle, ...(instance ? { instance } : {}) };
}

export function profileUrl(account) {
  const a = normalise(account), h = encodeURIComponent(a.handle);
  switch (a.network) {
    case "x": return "https://x.com/" + h;
    case "bluesky": return "https://bsky.app/profile/" + h;
    case "mastodon": return "https://" + a.instance + "/@" + h;
    case "instagram": return "https://www.instagram.com/" + h + "/";
    case "threads": return "https://www.threads.com/@" + h;
    case "tiktok": return "https://www.tiktok.com/@" + h;
    case "facebook": return "https://www.facebook.com/" + h;
    case "youtube": return "https://www.youtube.com/@" + h;
    case "reddit": return "https://www.reddit.com/user/" + h + "/";
    case "linkedin": return "https://www.linkedin.com/in/" + h + "/";
    default: throw Error("Réseau invalide.");
  }
}

export function accountKey(input) {
  const a = normalise(input);
  return [a.network, a.instance || "", a.handle.toLowerCase()].join(":");
}
export function uniqueAccounts(accounts) {
  if (!Array.isArray(accounts) || accounts.length > MAX_ACCOUNTS)
    throw Error("Liste trop volumineuse ou invalide.");
  const keys = new Set();
  return accounts.map(normalise).filter(a => {
    const key = accountKey(a);
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}
export function parseImport(text) {
  if (typeof text !== "string" || new Blob([text]).size > MAX_IMPORT_BYTES)
    throw Error("Fichier trop volumineux (2 Mo maximum).");
  let obj;
  try { obj = JSON.parse(text); } catch { throw Error("Ce fichier n’est pas un JSON valide."); }
  if (!obj || typeof obj !== "object") throw Error("Fichier invalide.");
  if (obj.schemaVersion === 1 && Array.isArray(obj.accounts)) {
    const metadata = listMetadata({ ...(Object.hasOwn(obj, "version") ? { revision:obj.version } : {}),
      ...(Object.hasOwn(obj, "provenance") ? { provenance:obj.provenance } : {}) });
    return { title: "Liste X importée", accounts: uniqueAccounts(obj.accounts.map(a => ({ network: "x", handle: a.username }))), ...metadata };
  }
  if (obj.format === "fil-clair-v1" && Array.isArray(obj.accounts)) {
    return { title: cleanTitle(obj.title || "Liste importée"), accounts: uniqueAccounts(obj.accounts), ...listMetadata(obj) };
  }
  throw Error("Format non pris en charge (liste X v1 ou FIL CLAIR v1).");
}
export function cleanTitle(value) {
  const title = String(value || "").trim().slice(0, 70);
  if (!title) throw Error("Indiquez un nom de liste.");
  return title;
}
/** Portable v1 list without decisions, history or provider confirmation fields. */
export function exportList(list) {
  return { format:"fil-clair-v1", title:boundedText(list.title, 70, "Nom de liste invalide.", false),
    accounts:uniqueAccounts(list.accounts), ...listMetadata(list) };
}
export function newState() {
  return { version: 1, activeList: "personal", lists: [{ id: "personal", title: "Ma liste", accounts: [] }], decisions: {}, history: [] };
}
export function restoreState(text) {
  if (text === null || text === undefined) return newState();
  return parseBackup(text);
}
/**
 * Startup result for the UI: on failure keep raw available for recovery/export.
 * The caller must not persist a replacement state until recovery is explicit.
 */
export function loadState(text) {
  try { return { ok:true, state:restoreState(text) }; }
  catch (error) { return { ok:false, state:null, error:error.message, raw:text }; }
}
export function decisionKey(listId, account) {
  return listId + "|" + accountKey(account);
}
/** A newly added profile never inherits a historical orphan declaration. */
export function addAccount(state, listId, input) {
  const list = state.lists.find(item => item.id === listId);
  if (!list) throw Error("Cette liste n'existe pas.");
  const account = normalise(input), key = accountKey(account);
  if (list.accounts.some(item => accountKey(item) === key)) return state;
  const accounts = uniqueAccounts([...list.accounts, account]);
  const decisions = { ...state.decisions };
  delete decisions[decisionKey(listId, account)];
  return { ...state, decisions, lists:state.lists.map(item => item.id === listId ? { ...item, accounts } : item) };
}
export function markDecision(state, listId, account, status, now = Date.now()) {
  if (!["blocked", "muted", "skipped", "review", "todo"].includes(status)) throw Error("Action inconnue.");
  if (!validTimestamp(now)) throw Error("Date de déclaration invalide.");
  const list = state.lists.find(item => item.id === listId);
  if (!list || !list.accounts.some(item => accountKey(item) === accountKey(account)))
    throw Error("Ce profil ne figure pas dans cette liste.");
  const key = decisionKey(listId, account);
  if (status !== "todo" && !Object.hasOwn(state.decisions, key) && Object.keys(state.decisions).length >= MAX_DECISIONS)
    throw Error("Maximum : 10 000 déclarations. Exportez puis retirez des profils ou listes avant de continuer.");
  const decisions = { ...state.decisions };
  if (status === "todo") delete decisions[key];
  else decisions[key] = { status, at: now };
  const event = { key, status, at: now };
  return { ...state, decisions, history: [event, ...state.history].slice(0, 1000) };
}
/** Remove the current declaration; retain the bounded historical journal. */
export function removeAccount(state, listId, account) {
  if (!state.lists.some(list => list.id === listId)) return state;
  const key = accountKey(account);
  const lists = state.lists.map(list => list.id === listId
    ? { ...list, accounts:list.accounts.filter(item => accountKey(item) !== key) } : list);
  const decisions = { ...state.decisions };
  delete decisions[decisionKey(listId, account)];
  return { ...state, lists, decisions };
}
/** Removing the last list creates a clean personal list, retaining history only. */
export function removeList(state, listId) {
  if (!state.lists.some(list => list.id === listId)) return state;
  const remaining = state.lists.filter(list => list.id !== listId);
  const lists = remaining.length ? remaining : newState().lists;
  const decisions = remaining.length
    ? Object.fromEntries(Object.entries(state.decisions).filter(([key]) => !key.startsWith(listId + "|"))) : {};
  return { ...state, lists, decisions,
    activeList:lists.some(list => list.id === state.activeList) ? state.activeList : lists[0].id };
}
export function progress(state, list) {
  let blocked = 0, muted = 0, skipped = 0;
  for (const account of list.accounts) {
    const status = state.decisions[decisionKey(list.id, account)]?.status;
    if (status === "blocked") blocked++;
    if (status === "muted") muted++;
    if (status === "skipped") skipped++;
  }
  return { total: list.accounts.length, blocked, muted, skipped, remaining: list.accounts.length - blocked - muted - skipped };
}

export const MAX_BACKUP_BYTES = 10_000_000;

/**
 * Strict restore path shared by startup and user-supplied backups. Malformed
 * backups MUST throw, never silently erase local data.
 * Does not contact any network or modify state.
 */
export function parseBackup(text) {
  if (typeof text !== "string" || new Blob([text]).size > MAX_BACKUP_BYTES)
    throw Error("Sauvegarde supérieure à 10 Mo ou invalide.");
  let raw;
  try { raw = JSON.parse(text); }
  catch { throw Error("Sauvegarde JSON illisible."); }
  if (!raw || raw.version !== 1 || !Array.isArray(raw.lists) ||
      !raw.lists.length || raw.lists.length > MAX_LISTS)
    throw Error("Format de sauvegarde FIL CLAIR non reconnu.");
  const ids = new Set();
  const lists = raw.lists.map(list => {
    if (!list || typeof list.id !== "string" ||
        !/^[a-zA-Z0-9-]{1,80}$/.test(list.id) || ids.has(list.id))
      throw Error("Identifiant de liste absent, dangereux ou en double.");
    ids.add(list.id);
    const accounts = uniqueAccounts(list.accounts);
    if (accounts.length !== list.accounts.length) throw Error("La sauvegarde contient des profils en double.");
    return { id:list.id, title:boundedText(list.title, 70, "Nom de liste de sauvegarde invalide.", false),
      accounts, ...listMetadata(list) };
  });
  if (typeof raw.activeList !== "string" || !ids.has(raw.activeList))
    throw Error("La liste active n'existe pas.");
  if (!raw.decisions || typeof raw.decisions !== "object" || Array.isArray(raw.decisions) ||
      Object.keys(raw.decisions).length > MAX_DECISIONS)
    throw Error("Décisions de sauvegarde invalides.");
  const decisions = Object.create(null);
  for (const [key, val] of Object.entries(raw.decisions)) {
    if (!validDecisionKey(key) ||
        !val || typeof val !== "object" ||
        !["blocked","muted","skipped","review"].includes(val.status) ||
        !validTimestamp(val.at))
      throw Error("Décision de sauvegarde incorrecte.");
    decisions[key] = {status:val.status, at:val.at};
  }
  if (!Array.isArray(raw.history) || raw.history.length > 1000)
    throw Error("Historique de sauvegarde invalide.");
  const history = raw.history.map(entry => {
    if (!entry || !validDecisionKey(entry.key) ||
        !["blocked","muted","skipped","review","todo"].includes(entry.status) ||
        !validTimestamp(entry.at))
      throw Error("Historique de sauvegarde incorrect.");
    return {key:entry.key,status:entry.status,at:entry.at};
  });
  return {version:1, activeList:raw.activeList, lists, decisions, history,
    ...(Object.hasOwn(raw, "flows") ? { flows:validateFlows(raw.flows) } : {})};
}

function validDecisionKey(key) {
  if (typeof key !== "string" || key.length > 424) return false;
  const match = /^([a-zA-Z0-9-]{1,80})\|([^:|]+):([^:|]*):([^:|]+)$/.exec(key);
  if (!match) return false;
  try {
    return decisionKey(match[1], { network:match[2], instance:match[3], handle:match[4] }) === key;
  } catch { return false; }
}
