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
    return { title: "Liste X importée", accounts: uniqueAccounts(obj.accounts.map(a => ({ network: "x", handle: a.username }))) };
  }
  if (obj.format === "fil-clair-v1" && Array.isArray(obj.accounts)) {
    return { title: cleanTitle(obj.title || "Liste importée"), accounts: uniqueAccounts(obj.accounts) };
  }
  throw Error("Format non pris en charge (liste X v1 ou FIL CLAIR v1).");
}
export function cleanTitle(value) {
  const title = String(value || "").trim().slice(0, 70);
  if (!title) throw Error("Indiquez un nom de liste.");
  return title;
}
export function newState() {
  return { version: 1, activeList: "personal", lists: [{ id: "personal", title: "Ma liste", accounts: [] }], decisions: {}, history: [] };
}
export function restoreState(text) {
  if (!text) return newState();
  try {
    const input = JSON.parse(text);
    if (input.version !== 1 || !Array.isArray(input.lists) || !input.lists.length || input.lists.length > 30) return newState();
    const lists = input.lists.map((l, i) => ({
      id: /^[a-zA-Z\d-]{1,80}$/.test(l.id) ? l.id : "restored-" + i,
      title: cleanTitle(l.title),
      accounts: uniqueAccounts(l.accounts)
    }));
    const validIds = new Set(lists.map(l => l.id));
    const decisions = Object.fromEntries(Object.entries(input.decisions || {}).filter(([k, v]) =>
      k.length < 240 && v && ["blocked", "muted", "skipped"].includes(v.status) && Number.isFinite(v.at) && v.at > 0
    ).slice(-10000));
    const history = Array.isArray(input.history) ? input.history.filter(e =>
      e && typeof e === "object" && Number.isFinite(e.at) && typeof e.key === "string" && typeof e.status === "string"
    ).slice(-1000) : [];
    return { version: 1, lists, activeList: validIds.has(input.activeList) ? input.activeList : lists[0].id, decisions, history };
  } catch { return newState(); }
}
export function decisionKey(listId, account) {
  return listId + "|" + accountKey(account);
}
export function markDecision(state, listId, account, status, now = Date.now()) {
  if (!["blocked", "muted", "skipped", "todo"].includes(status)) throw Error("Action inconnue.");
  const key = decisionKey(listId, account);
  const decisions = { ...state.decisions };
  if (status === "todo") delete decisions[key];
  else decisions[key] = { status, at: now };
  const event = { key, status, at: now };
  return { ...state, decisions, history: [event, ...state.history].slice(0, 1000) };
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
