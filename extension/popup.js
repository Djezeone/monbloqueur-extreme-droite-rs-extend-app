const api = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);
let busy = false,
  state,
  rendering = Promise.resolve(),
  signature;
const send = async (type) => {
  const reply = await api.runtime.sendMessage({ type });
  if (!reply?.ok) throw Error(reply?.error || "Extension indisponible.");
  return reply.data;
};
function updateRetryHint() {
  const job = state?.job;
  const retryAt = job?.retryAt;
  const waiting =
    ((job?.status === "running" && job.phase === "cooldown") ||
      job?.status === "paused") &&
    Number.isFinite(retryAt);
  const locked = waiting && retryAt > Date.now();
  $("start").disabled = busy || job?.status === "running" || locked;
  $("rescan").disabled = busy || job?.status === "running" || locked;
  $("retryHint").hidden = !waiting;
  if (!waiting) return;
  const seconds = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
  const minutes = Math.floor(seconds / 60);
  $("retryHint").textContent = seconds
    ? `${job.status === "paused" ? "Vous pourrez reprendre" : "Reprise"} dans ${minutes ? `${minutes} min ` : ""}${seconds % 60} s.`
    : job.status === "paused"
      ? "Vous pouvez reprendre le blocage."
      : "Reprise en cours…";
}
function renderProgress(job) {
  const total = job?.accounts?.length || 0;
  const index = Math.min(total, Math.max(0, job?.index || 0));
  const percent = total ? Math.floor((index / total) * 100) : 0;
  $("progressInfo").hidden = !job;
  $("bar").hidden = !job;
  $("bar").max = total || 1;
  $("bar").value = index;
  $("progressText").textContent = `${index} / ${total} profils`;
  $("progressPercent").textContent = `${percent} %`;
  $("owner").hidden = !job?.owner;
  $("owner").textContent = job?.owner ? `Compte : @${job.owner}` : "";
  const current = job?.currentUsername || job?.accounts?.[index]?.username;
  $("currentProfile").hidden =
    job?.status !== "running" || job.phase === "cooldown" || !current;
  $("currentProfile").textContent = current
    ? `Profil en cours : @${current}`
    : "";
  const count = (value, singular, plural) =>
    `${value} ${value === 1 ? singular : plural}`;
  const parts = [];
  if (Number.isInteger(job?.created) && (job.created || job.status === "done"))
    parts.push(count(job.created, "nouveau blocage", "nouveaux blocages"));
  if (job?.already)
    parts.push(count(job.already, "déjà bloqué", "déjà bloqués"));
  if (job?.cached) parts.push(count(job.cached, "déjà traité", "déjà traités"));
  if (job?.failed?.length)
    parts.push(count(job.failed.length, "indisponible", "indisponibles"));
  $("breakdown").hidden = !parts.length;
  $("breakdown").textContent = parts.join(" · ");
  updateRetryHint();
}
function render() {
  rendering = rendering
    .catch(() => {})
    .then(async () => {
      state = await send("state");
      const job = state.job,
        running = job?.status === "running",
        cooldown = running && job.phase === "cooldown";
      const status = cooldown ? "cooldown" : job?.status || "idle";
      document.body.dataset.state = status;
      $("activity").dataset.state = status;
      $("phase").hidden = !job;
      $("phase").textContent =
        {
          running: ["sessionLoading", "inspecting"].includes(job?.phase)
            ? "Vérification du compte"
            : "Blocage en cours",
          paused: "Une pause est nécessaire",
          cooldown: "X demande une pause",
          done: "C’est fait.",
          cancelled: "Blocage arrêté",
        }[status] || "";
      $("start").disabled = busy || running;
      $("start").textContent = cooldown
        ? "En attente de X…"
        : running
          ? "Blocage en cours…"
          : job?.status === "paused"
            ? "Reprendre le blocage"
            : "Bloquer l’Extrême-droite";
      $("status").textContent =
        job?.message ||
        (state.list
          ? `${state.list.accounts.length} comptes dans la liste.`
          : "La liste sera chargée au lancement.");
      renderProgress(job);
      $("support").hidden = !["running", "paused"].includes(job?.status);
      $("cancel").hidden = !["running", "paused"].includes(job?.status);
      $("cancel").disabled = busy;
      $("inspect").hidden = job?.status !== "paused";
      $("inspect").disabled = busy;
      $("listInfo").textContent =
        `Voir la liste${state.list ? " (" + state.list.accounts.length + ")" : ""}`;
      const next = JSON.stringify(state.list);
      if (signature !== next) {
        signature = next;
        $("accounts").replaceChildren(
          ...(state.list?.accounts || []).map((account) => {
            const li = document.createElement("li");
            const link = document.createElement("a");
            link.href = `https://x.com/${encodeURIComponent(account.username)}`;
            link.textContent = "@" + account.username;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            li.append(link);
            return li;
          }),
        );
      }
    });
  return rendering;
}
async function act(type) {
  if (busy) return;
  busy = true;
  $("error").textContent = "";
  try {
    await render();
    await send(type);
  } catch (error) {
    $("error").textContent = error.message;
  } finally {
    busy = false;
    await render().catch((error) => {
      $("error").textContent = error.message;
    });
  }
}
$("start").onclick = () => act("start");
$("cancel").onclick = () => act("cancel");
$("inspect").onclick = () => act("inspect");
$("rescan").onclick = () => act("rescan");
api.storage.onChanged.addListener(() => render().catch(() => {}));
await render().catch((error) => {
  $("error").textContent = error.message;
  $("status").textContent = "Fermez puis rouvrez l’extension pour réessayer.";
});
if (state?.job?.status !== "running")
  send("refresh")
    .then(render)
    .catch((error) => {
      if (!state?.list) $("error").textContent = error.message;
    });
const retryTimer = setInterval(updateRetryHint, 1000);
addEventListener("pagehide", () => clearInterval(retryTimer), { once: true });
