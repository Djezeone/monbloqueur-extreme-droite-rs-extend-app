import { NETWORKS, normalise, profileUrl, accountKey, uniqueAccounts, parseImport, cleanTitle, newState, loadState, markDecision, decisionKey, progress, MAX_BACKUP_BYTES, parseBackup, listMetadata, exportList, removeAccount, removeList } from "./core.js";
import { mountFlows } from "./flows.js";
import { getControl } from "./platforms.js";

const STORAGE = "fil-clair-v1";
const SOURCE = "https://raw.githubusercontent.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/b7cd31b036cca17b48dbf726c047847191c01a5b/liste/accounts.json";
const $ = id => document.getElementById(id);
let state = newState();
let recoveryRaw = null;
let startupError = "";
let storageSource = null;
let storageRead = false;
let storageConflict = false;
let saving = false;
let sessionMode = false;
let flowsUI = null;
try {
  storageSource = localStorage.getItem(STORAGE);
  storageRead = true;
  const loaded = loadState(storageSource);
  if (loaded.ok) state = loaded.state;
  else {
    recoveryRaw = loaded.raw;
    startupError = "Données locales illisibles : " + loaded.error + " Exportez la source de récupération dans Réglages, puis restaurez une sauvegarde ou effacez explicitement ces données. Les modifications sont suspendues.";
  }
} catch {
  startupError = "Stockage inaccessible. Aucun enregistrement n'est possible ; vos données existantes ne sont pas remplacées.";
}
let currentView = "home";
let filtered = [];
let installPrompt = null;

function notify(message, error = false) {
  const el = $("notice");
  el.textContent = message;
  el.classList.toggle("error", error);
  el.hidden = false;
}
async function persist(next, message, replaceRecovery = false) {
  if (saving) { notify("Enregistrement en cours. Attendez sa fin avant une autre modification.", true); return false; }
  if (sessionMode) {
    if (new Blob([JSON.stringify(next)]).size > MAX_BACKUP_BYTES) {
      notify("État supérieur à 10 Mo : modification refusée pour conserver une sauvegarde restaurable.", true);
      return false;
    }
    applyState(next, message, replaceRecovery);
    return true;
  }
  if (!storageRead) {
    notify("Stockage initial inaccessible : modification refusée pour préserver les données existantes. Rechargez après rétablissement du stockage.", true);
    return false;
  }
  if (recoveryRaw !== null && !replaceRecovery) {
    notify(startupError, true);
    return false;
  }
  const conflictMessage = "Conflit : les données ont changé dans un autre onglet. Modification refusée. Exportez votre vue si nécessaire, puis rechargez pour retrouver la version enregistrée.";
  if (storageConflict) { notify(conflictMessage, true); return false; }
  if (!navigator.locks?.request) {
    notify("Verrou de stockage indisponible dans ce navigateur : lecture et export disponibles, modifications suspendues pour éviter une perte entre onglets.", true);
    return false;
  }
  const base = storageSource;
  saving = true;
  try {
    return await navigator.locks.request("fil-clair-v1-write", {mode:"exclusive"}, () => {
      // Compare and replace inside one origin-wide lock. A stale tab must never
      // overwrite another tab's whole snapshot, including during reset/restore.
      if (storageConflict || localStorage.getItem(STORAGE) !== base) {
        storageConflict = true;
        notify(conflictMessage, true);
        return false;
      }
      const serialized = JSON.stringify(next);
      if (new Blob([serialized]).size > MAX_BACKUP_BYTES) {
        notify("État supérieur à 10 Mo : modification refusée pour conserver une sauvegarde restaurable. Exportez vos données avant de réduire les listes.", true);
        return false;
      }
      localStorage.setItem(STORAGE, serialized);
      storageSource = serialized;
      if (replaceRecovery) { recoveryRaw = null; startupError = ""; }
      applyState(next, message, replaceRecovery);
      return true;
    });
  } catch {
    notify("Enregistrement impossible : stockage, espace ou verrou indisponible. Exportez vos données avant de fermer.", true);
    return false;
  } finally { saving = false; }
}
function applyState(next, message, resetFlows = false) {
  const focused = document.activeElement;
  const focus = focused?.dataset?.action ? {
    action: focused.dataset.action, account: focused.dataset.account, index: Number(focused.dataset.index)
  } : null;
  state = next;
  if (resetFlows) flowsUI?.resetDraft();
  render();
  $("export-recovery").hidden = recoveryRaw === null;
  if (focus) {
    const buttons = [...$("accounts").querySelectorAll("button[data-action]")];
    const same = buttons.find(button => button.dataset.account === focus.account && button.dataset.action === focus.action);
    const rows = $("accounts").children;
    const neighbour = rows[Math.min(focus.index, rows.length - 1)]?.querySelector("button[data-action]");
    (same || neighbour || $("search")).focus();
  }
  if (message) notify(message);
}
function active() {
  return state.lists.find(l => l.id === state.activeList) || state.lists[0];
}
function show(view) {
  currentView = view;
  for (const name of ["home", "flows", "lists", "history", "settings"]) $("view-" + name).hidden = name !== view;
  for (const tab of document.querySelectorAll("[data-view]")) {
    const selected = tab.dataset.view === view;
    tab.classList.toggle("active", selected);
    if (selected) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
  const heading = $("view-" + view).querySelector("h1");
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}
function selected(el, value) {
  el.value = value;
}
function makeOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}
function populateNetworks() {
  for (const [id, title] of Object.entries(NETWORKS)) {
    $("network").append(makeOption(id, title));
    $("filter-network").append(makeOption(id, title));
  }
}
function renderSelectors() {
  const picker = $("active-list");
  picker.replaceChildren(...state.lists.map(l => makeOption(l.id, l.title + " (" + l.accounts.length + ")")));
  selected(picker, active().id);
  const other = $("list-picker");
  if (other) {
    other.replaceChildren(...state.lists.map(l => makeOption(l.id, l.title)));
    selected(other, active().id);
  }
  const list = active();
  const metadata = $("list-metadata");
  if (metadata) {
    const details = [];
    if (list.revision) details.push("Révision source : " + list.revision);
    if (list.provenance) details.push("Provenance déclarée : " + (list.provenance.label || list.provenance.url));
    metadata.textContent = details.length ? details.join(" · ") + " · À vérifier avant toute action." : "Liste personnelle ; aucune provenance vérifiée par FIL CLAIR.";
  }
}
function renderOverview() {
  const list = active(), p = progress(state, list), done = p.blocked + p.muted;
  $("metric-total").textContent = p.total.toLocaleString("fr-FR");
  $("metric-done").textContent = done.toLocaleString("fr-FR");
  $("metric-stars").textContent = done + " ★";
  const percent = p.total ? Math.round((p.total - p.remaining) / p.total * 100) : 0;
  $("percent").textContent = percent + " %";
  const track = document.querySelector(".track");
  track.setAttribute("aria-valuenow", String(percent));
  track.setAttribute("aria-valuetext", (p.total - p.remaining) + " comptes examinés sur " + p.total + " ; déclarations personnelles");
  $("bar").style.width = (p.total ? (p.total - p.remaining) / p.total * 100 : 0) + "%";
  $("home-summary").textContent = p.total
    ? p.remaining + " comptes à examiner · " + p.blocked + " bloqués · " + p.muted + " masqués · " + p.skipped + " ignorés (déclarations personnelles)."
    : "Aucun profil dans cette liste. Commencez par en ajouter un ou importer la sélection existante.";
  $("go-next").textContent = p.remaining ? "Voir le prochain compte" : "Gérer mes listes";
}
const STATUS = { todo:"À faire", blocked:"Bloqué · déclaré", muted:"Masqué · déclaré", skipped:"Ignoré", review:"À vérifier" };
function actionButton(label, action, i, kind = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.index = i;
  const account = filtered[i];
  button.dataset.account = accountKey(account);
  button.setAttribute("aria-label", label + " · @" + account.handle + " sur " + NETWORKS[account.network] + (account.instance ? " · " + account.instance : ""));
  if (kind) button.classList.add(kind);
  return button;
}
function renderAccounts() {
  const list = active(), query = $("search").value.trim().toLowerCase(), network = $("filter-network").value, status = $("filter-status").value;
  filtered = list.accounts.filter(a => {
    const current = state.decisions[decisionKey(list.id, a)]?.status || "todo";
    return (!query || (a.handle + " " + a.instance + " " + NETWORKS[a.network]).toLowerCase().includes(query))
      && (!network || a.network === network) && (!status || current === status);
  });
  $("list-count").textContent = filtered.length + " / " + list.accounts.length;
  const fragment = document.createDocumentFragment();
  filtered.forEach((a, i) => {
    const current = state.decisions[decisionKey(list.id, a)]?.status || "todo";
    const li = document.createElement("li");
    const line = document.createElement("div");
    line.className = "account-row";
    const identity = document.createElement("div");
    identity.className = "account-id";
    const name = document.createElement("strong");
    name.textContent = "@" + a.handle;
    const meta = document.createElement("small");
    meta.textContent = NETWORKS[a.network] + (a.instance ? " · " + a.instance : "");
    identity.append(name, meta);
    const tag = document.createElement("span");
    tag.className = "status" + (current === "blocked" || current === "muted" ? " done" : "");
    tag.textContent = STATUS[current];
    line.append(identity, tag);
    const actions = document.createElement("div");
    actions.className = "actions";
    const open = document.createElement("a");
    open.href = profileUrl(a);
    open.className = "open";
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    open.textContent = "Ouvrir le profil ↗";
    open.setAttribute("aria-label", "Ouvrir le profil de @" + a.handle + " sur " + NETWORKS[a.network]);
    actions.append(open);
    if (getControl(a.network, "block")) actions.append(actionButton("✓ Bloqué", "blocked", i, current === "blocked" ? "declared" : ""));
    if (getControl(a.network, "mute")) actions.append(actionButton("◌ Masqué", "muted", i, current === "muted" ? "declared" : ""));
    actions.append(
      actionButton("À vérifier", "review", i),
      actionButton("Ignorer", "skipped", i),
      actionButton("Annuler", "todo", i),
      actionButton("Retirer", "delete", i, "delete")
    );
    li.append(line, actions);
    fragment.append(li);
  });
  $("accounts").replaceChildren(fragment);
  $("empty-list").hidden = filtered.length !== 0;
}
function renderHistory() {
  const fragment = document.createDocumentFragment();
  state.history.forEach(e => {
    const li = document.createElement("li");
    const info = document.createElement("div");
    const label = document.createElement("strong");
    const split = e.key.split("|");
    const account = split.slice(1).join("|").split(":").at(-1);
    const list = state.lists.find(l => l.id === split[0]);
    label.textContent = (account ? "@" + account : "Profil") + " · " + (STATUS[e.status] || e.status);
    const sub = document.createElement("small");
    sub.textContent = list?.title || "Liste supprimée";
    info.append(label, sub);
    const time = document.createElement("small");
    time.textContent = new Date(e.at).toLocaleString("fr-FR");
    li.append(info, time);
    fragment.append(li);
  });
  $("history").replaceChildren(fragment);
  $("no-history").hidden = state.history.length !== 0;
}
function render() {
  renderSelectors();
  renderOverview();
  if (currentView === "lists") renderAccounts();
  if (currentView === "history") renderHistory();
  flowsUI?.render();
  $("session-warning").hidden = !sessionMode;
  $("session-mode").disabled = sessionMode;
}
function guessAccount(raw, network, instance) {
  const text = raw.trim();
  if (!/^https?:\/\//i.test(text)) return normalise({ network, handle: text, instance });
  const url = new URL(text);
  if (url.protocol !== "https:") throw Error("Seuls les liens HTTPS sont acceptés.");
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const segments = url.pathname.split("/").filter(Boolean);
  let kind, handle, server = "";
  if (["x.com", "twitter.com"].includes(host)) { kind="x"; handle=segments[0]; }
  else if (host === "bsky.app" && segments[0] === "profile") { kind="bluesky"; handle=segments[1]; }
  else if (host === "instagram.com") { kind="instagram"; handle=segments[0]; }
  else if (["threads.com", "threads.net"].includes(host)) { kind="threads"; handle=segments[0]?.replace(/^@/, ""); }
  else if (host === "tiktok.com") { kind="tiktok"; handle=segments[0]?.replace(/^@/, ""); }
  else if (host === "facebook.com") { kind="facebook"; handle=segments[0]; }
  else if (host === "youtube.com") { kind="youtube"; handle=segments[0]?.replace(/^@/, ""); }
  else if (host === "reddit.com" && segments[0] === "user") { kind="reddit"; handle=segments[1]; }
  else if (host === "linkedin.com" && segments[0] === "in") { kind="linkedin"; handle=segments[1]; }
  else if (segments[0]?.startsWith("@")) { kind="mastodon"; handle=segments[0].slice(1); server=host; }
  else throw Error("Lien non reconnu. Sélectionnez le réseau et entrez le pseudo sans URL.");
  const a = normalise({ network:kind, handle, instance:server });
  $("network").value = kind;
  if (kind === "mastodon") $("instance").value = server;
  $("instance-field").hidden = kind !== "mastodon";
  return a;
}
function updateList(accounts, message) {
  const list = active();
  const lists = state.lists.map(l => l.id === list.id ? { ...l, accounts: uniqueAccounts(accounts) } : l);
  return persist({ ...state, lists }, message);
}
async function newList(title, accounts = [], metadata = {}) {
  if (state.lists.length >= 30) throw Error("Maximum : 30 listes.");
  const id = "list-" + crypto.randomUUID();
  const next = { ...state, activeList:id, lists:[...state.lists, { id, title:cleanTitle(title), accounts:uniqueAccounts(accounts), ...listMetadata(metadata) }] };
  if (!await persist(next, "Liste créée. Vous pouvez l'adapter librement.")) return false;
  show("lists");
  return true;
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Use the same representation as persist/parseBackup's byte limit. Pretty
// printing may make a valid near-limit state impossible to restore.
function download(filename, value) { downloadText(filename, JSON.stringify(value)); }
function exportAll() {
  if (!sessionMode && recoveryRaw !== null) downloadText("fil-clair-recuperation.json", recoveryRaw);
  else download("fil-clair-sauvegarde.json", state);
}
function setupRecovery() {
  const button = document.createElement("button");
  button.id = "export-recovery";
  button.className = "button outline";
  button.type = "button";
  button.textContent = "Exporter la source de récupération";
  button.hidden = recoveryRaw === null;
  button.addEventListener("click", () => {
    if (recoveryRaw !== null) downloadText("fil-clair-recuperation.json", recoveryRaw);
  });
  $("view-settings").querySelector(".import-row").prepend(button);
}
function setupListToolbar() {
  const bar = document.createElement("div");
  bar.className = "toolbar";
  const label = document.createElement("label");
  label.htmlFor = "list-picker"; label.textContent = "Liste affichée";
  const selector = document.createElement("select");
  selector.id = "list-picker";
  selector.addEventListener("change", () => { persist({ ...state, activeList:selector.value }); });
  const rename = document.createElement("button");
  rename.className="button subtle"; rename.type="button"; rename.textContent="Renommer";
  rename.addEventListener("click", async () => {
    const title = prompt("Nouveau nom de la liste :", active().title);
    if (title === null) return;
    try { const lists = state.lists.map(l => l.id === active().id ? {...l,title:cleanTitle(title)}:l); await persist({...state,lists},"Liste renommée."); }
    catch(e) { notify(e.message,true); }
  });
  const remove = document.createElement("button");
  remove.className="button danger"; remove.type="button"; remove.textContent="Supprimer la liste";
  remove.addEventListener("click", async () => {
    if (!confirm("Supprimer cette liste et ses profils ? L'historique sera conservé.")) return;
    await persist(removeList(state, active().id), "Liste supprimée ; ses déclarations sont retirées. L'historique reste disponible.");
  });
  bar.append(label,selector,rename,remove);
  $("view-lists").insertBefore(bar,$("view-lists").children[1]);
  const metadata = document.createElement("p");
  metadata.id = "list-metadata";
  metadata.className = "fine";
  bar.after(metadata);
}
function bindEvents() {
  document.querySelectorAll("[data-view]").forEach(tab => tab.addEventListener("click", () => show(tab.dataset.view)));
  $("start-flows").addEventListener("click", () => { show("flows"); flowsUI.openSetup(); });
  $("active-list").addEventListener("change", e => persist({...state,activeList:e.target.value}));
  $("network").addEventListener("change", e => { $("instance-field").hidden = e.target.value !== "mastodon"; });
  $("add-account").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const a = guessAccount($("handle").value, $("network").value, $("instance").value);
      const list = active();
      if (list.accounts.some(item => accountKey(item) === accountKey(a))) return notify("Ce compte figure déjà dans cette liste.");
      if (await updateList([...list.accounts, a], "Profil ajouté. Il n'a pas été bloqué.")) $("handle").value = "";
    } catch (error) { notify(error.message, true); }
  });
  ["search", "filter-network", "filter-status"].forEach(id => $(id).addEventListener("input", renderAccounts));
  $("accounts").addEventListener("click", async e => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    const account = filtered[Number(button.dataset.index)];
    if (!account) return;
    const action = button.dataset.action;
    if (action === "delete") {
      if (!confirm("Retirer @" + account.handle + " de votre liste ?")) return;
      await persist(removeAccount(state, active().id, account), "Compte et déclaration retirés de cette liste. L'historique est conservé.");
      return;
    }
    if (["blocked", "muted"].includes(action)) {
      const control = getControl(account.network, action === "blocked" ? "block" : "mute");
      if (!control) return notify("Ce contrôle n’est pas qualifié pour ce service. Consultez Mes flux pour les guides disponibles.", true);
      if (!confirm("Avez-vous bien " + (action==="blocked" ? "bloqué" : "masqué") + " @" + account.handle + " directement sur " + NETWORKS[account.network] + " ?\n\nPortée : " + control.scope + "\n\nFIL CLAIR ne vérifie pas cette action.")) return;
    }
    try {
      await persist(markDecision(state,active().id,account,action), action==="todo" ? "Déclaration annulée dans FIL CLAIR. Aucun déblocage n'est effectué sur la plateforme." : "Votre déclaration est enregistrée sur cet appareil.");
    } catch (error) { notify(error.message, true); }
  });
  $("new-list").addEventListener("click", async () => {
    const title = prompt("Nom de votre nouvelle liste :");
    if (title === null) return;
    try { await newList(title); } catch(e) { notify(e.message,true); }
  });
  $("go-next").addEventListener("click", () => {
    $("search").value = "";
    $("filter-network").value = "";
    $("filter-status").value = "todo";
    show("lists");
    const first = $("accounts").querySelector(".open");
    first?.focus({ preventScroll:true });
    first?.closest("li")?.scrollIntoView({ block:"center" });
  });
  $("import-file").addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", async e => {
    const file = e.target.files?.[0]; if(!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw Error("Fichier trop volumineux.");
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed?.version === 1 && Array.isArray(parsed.lists)) {
        // Reject incomplete or corrupted backups before asking to replace user data.
        const restored = parseBackup(text);
        if (confirm("Restaurer cette sauvegarde ? Toutes les listes et l'historique actuels seront remplacés.")) {
          if (await persist(restored, "Sauvegarde locale restaurée.", true)) show("home");
        }
      } else {
        const imported = parseImport(text);
        if (await newList(imported.title, imported.accounts, imported))
          notify(imported.accounts.length + " profils importés dans une nouvelle liste. Vérifiez-les avant d'agir.");
      }
    } catch(err) { notify(err.message,true); }
    finally { e.target.value=""; }
  });
  $("import-public").addEventListener("click", async e => {
    const button=e.target; button.disabled=true; button.textContent="Chargement…";
    try {
      const res=await fetch(SOURCE,{credentials:"omit",cache:"no-store",signal:AbortSignal.timeout(15000)});
      if (!res.ok) throw Error("La liste distante n'est pas accessible.");
      const payload=await res.text();
      const imported=parseImport(payload);
      if (await newList("Sélection publique X · à vérifier", imported.accounts, { ...imported,
        provenance: { label: "Sélection éditoriale du dépôt · non vérifiée", url: SOURCE, retrievedAt: Date.now() }
      })) notify(imported.accounts.length + " comptes importés. Aucun blocage effectué. Examinez librement cette sélection.");
    } catch(err) { notify("Impossible d'importer : "+err.message,true); }
    finally { button.disabled=false; button.textContent="Charger la liste X du dépôt"; }
  });
  $("export-list").addEventListener("click", () => download("fil-clair-liste.json", exportList(active())));
  $("export-history").addEventListener("click", exportAll);
  $("export-all").addEventListener("click", exportAll);
  $("restore-all").addEventListener("click", () => $("file").click());
  $("session-export").addEventListener("click", () => download("fil-clair-espace-temporaire.json", state));
  $("session-mode").addEventListener("click", () => {
    if (saving || sessionMode) return;
    if (!confirm("Ouvrir un nouvel espace vide, en mémoire uniquement ?\n\nExportez d’abord vos données actuelles si nécessaire. Les données enregistrées ne seront ni remplacées ni effacées. Le nouvel espace sera perdu à la fermeture ou au rechargement : exportez-le avant de partir.")) return;
    sessionMode = true;
    applyState(newState(), "Espace temporaire ouvert. Sauvegardez-le avant de fermer ou de recharger cette page.", true);
  });
  $("erase").addEventListener("click", async () => {
    if (!confirm(sessionMode ? "Effacer toutes les données de cet espace temporaire ? Les données déjà enregistrées dans le navigateur resteront intactes." : "Effacer toutes les listes, préférences de flux, déclarations et l’historique de ce navigateur ? Cette action est irréversible.")) return;
    const message = sessionMode ? "Espace temporaire effacé ; données persistantes intactes." : "Listes, préférences de flux, déclarations et historique locaux effacés. Les fichiers déjà téléchargés et les actions sur les réseaux sociaux restent inchangés.";
    if (await persist(newState(), message, true)) show("home");
  });
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt=e; $("install").hidden=false; });
  $("install").addEventListener("click", async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt=null;
    $("install").hidden=true;
  });
}

addEventListener("storage", event => {
  if (!sessionMode && (event.key === STORAGE || event.key === null) && storageRead && event.newValue !== storageSource) {
    storageConflict = true;
    notify("Conflit : données modifiées dans un autre onglet. Exportez votre vue si nécessaire, puis rechargez avant toute modification.", true);
  }
});

populateNetworks();
setupListToolbar();
setupRecovery();
flowsUI = mountFlows({ getState:() => state, save:persist, notify, navigate:show });
bindEvents();
render();
if (startupError) notify(startupError, true);
function registerWorker() {
  // An already controlled offline page needs no registration/update request.
  // Defer this optional network work until the browser reports connectivity.
  if (navigator.onLine && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost"))
    navigator.serviceWorker.register("./sw.js").catch(() => {});
}
registerWorker();
addEventListener("online", registerWorker);
