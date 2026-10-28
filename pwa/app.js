import { NETWORKS, normalise, profileUrl, accountKey, uniqueAccounts, parseImport, cleanTitle, newState, restoreState, markDecision, decisionKey, progress, MAX_IMPORT_BYTES, MAX_BACKUP_BYTES, parseBackup } from "./core.js";

const STORAGE = "fil-clair-v1";
const SOURCE = "https://raw.githubusercontent.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/main/liste/accounts.json";
const $ = id => document.getElementById(id);
let state;
try { state = restoreState(localStorage.getItem(STORAGE)); }
catch { state = newState(); }
let currentView = "home";
let filtered = [];
let installPrompt = null;

function notify(message, error = false) {
  const el = $("notice");
  el.textContent = message;
  el.classList.toggle("error", error);
  el.hidden = false;
}
function persist(next, message) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(next));
    state = next;
    render();
    if (message) notify(message);
    return true;
  } catch {
    notify("Enregistrement impossible : espace insuffisant ou stockage privé désactivé. Exportez vos données avant de fermer.", true);
    return false;
  }
}
function active() {
  return state.lists.find(l => l.id === state.activeList) || state.lists[0];
}
function show(view) {
  currentView = view;
  for (const name of ["home", "lists", "history", "settings"]) $("view-" + name).hidden = name !== view;
  for (const tab of document.querySelectorAll("[data-view]")) {
    const selected = tab.dataset.view === view;
    tab.classList.toggle("active", selected);
    if (selected) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
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
}
function renderOverview() {
  const list = active(), p = progress(state, list), done = p.blocked + p.muted;
  $("metric-total").textContent = p.total.toLocaleString("fr-FR");
  $("metric-done").textContent = done.toLocaleString("fr-FR");
  $("metric-stars").textContent = done + " ★";
  $("percent").textContent = (p.total ? Math.round((p.total - p.remaining) / p.total * 100) : 0) + " %";
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
    actions.append(open,
      actionButton("✓ Bloqué", "blocked", i, current === "blocked" ? "declared" : ""),
      actionButton("◌ Masqué", "muted", i, current === "muted" ? "declared" : ""),
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
  persist({ ...state, lists }, message);
}
function newList(title, accounts = []) {
  if (state.lists.length >= 30) throw Error("Maximum : 30 listes.");
  const id = "list-" + crypto.randomUUID();
  const next = { ...state, activeList:id, lists:[...state.lists, { id, title:cleanTitle(title), accounts:uniqueAccounts(accounts) }] };
  persist(next, "Liste créée. Vous pouvez l'adapter librement.");
  show("lists");
}
function download(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  rename.addEventListener("click", () => {
    const title = prompt("Nouveau nom de la liste :", active().title);
    if (title === null) return;
    try { const lists = state.lists.map(l => l.id === active().id ? {...l,title:cleanTitle(title)}:l); persist({...state,lists},"Liste renommée."); }
    catch(e) { notify(e.message,true); }
  });
  const remove = document.createElement("button");
  remove.className="button danger"; remove.type="button"; remove.textContent="Supprimer la liste";
  remove.addEventListener("click", () => {
    if (!confirm("Supprimer cette liste et ses profils ? L'historique sera conservé.")) return;
    const lists=state.lists.filter(l=>l.id!==active().id);
    persist({...state,lists:lists.length?lists:newState().lists,activeList:lists[0]?.id||"personal"},"Liste supprimée.");
  });
  bar.append(label,selector,rename,remove);
  $("view-lists").insertBefore(bar,$("view-lists").children[1]);
}
function bindEvents() {
  document.querySelectorAll("[data-view]").forEach(tab => tab.addEventListener("click", () => show(tab.dataset.view)));
  $("active-list").addEventListener("change", e => persist({...state,activeList:e.target.value}));
  $("network").addEventListener("change", e => { $("instance-field").hidden = e.target.value !== "mastodon"; });
  $("add-account").addEventListener("submit", e => {
    e.preventDefault();
    try {
      const a = guessAccount($("handle").value, $("network").value, $("instance").value);
      const list = active();
      if (list.accounts.some(item => accountKey(item) === accountKey(a))) return notify("Ce compte figure déjà dans cette liste.");
      updateList([...list.accounts, a], "Profil ajouté. Il n'a pas été bloqué.");
      $("handle").value = "";
    } catch (error) { notify(error.message, true); }
  });
  ["search", "filter-network", "filter-status"].forEach(id => $(id).addEventListener("input", renderAccounts));
  $("accounts").addEventListener("click", e => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    const account = filtered[Number(button.dataset.index)];
    if (!account) return;
    const action = button.dataset.action;
    if (action === "delete") {
      if (!confirm("Retirer @" + account.handle + " de votre liste ?")) return;
      updateList(active().accounts.filter(a => accountKey(a) !== accountKey(account)), "Compte retiré de cette liste.");
      return;
    }
    if (["blocked", "muted"].includes(action) && !confirm("Avez-vous bien " + (action==="blocked" ? "bloqué" : "masqué") + " @" + account.handle + " directement sur " + NETWORKS[account.network] + " ?\n\nFIL CLAIR ne vérifie pas cette action.")) return;
    persist(markDecision(state,active().id,account,action), action==="todo" ? "Statut remis à « À faire »." : "Votre déclaration est enregistrée sur cet appareil.");
  });
  $("new-list").addEventListener("click", () => {
    const title = prompt("Nom de votre nouvelle liste :");
    if (title === null) return;
    try { newList(title); } catch(e) { notify(e.message,true); }
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
          persist(restored, "Sauvegarde locale restaurée.");
          show("home");
        }
      } else {
        const imported = parseImport(text);
        newList(imported.title, imported.accounts);
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
      newList("Sélection publique X · à vérifier",imported.accounts);
      notify(imported.accounts.length + " comptes importés. Aucun blocage effectué. Examinez librement cette sélection.");
    } catch(err) { notify("Impossible d'importer : "+err.message,true); }
    finally { button.disabled=false; button.textContent="Charger la liste X du dépôt"; }
  });
  $("export-list").addEventListener("click", () => download("fil-clair-liste.json",{format:"fil-clair-v1",title:active().title,accounts:active().accounts}));
  $("export-history").addEventListener("click", () => download("fil-clair-sauvegarde.json",state));
  $("erase").addEventListener("click", () => {
    if (!confirm("Effacer toutes les listes, déclarations et l'historique de cet appareil ? Cette action est irréversible.")) return;
    persist(newState(),"Données locales effacées.");
    show("home");
  });
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt=e; $("install").hidden=false; });
  $("install").addEventListener("click", async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt=null;
    $("install").hidden=true;
  });
}

populateNetworks();
setupListToolbar();
bindEvents();
render();
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
