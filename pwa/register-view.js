import { PLATFORMS, CATEGORIES } from "./platforms.js";
import { registryEntries, reviewState, X_ALGORITHM_EVIDENCE } from "./effects.js";
const $ = id => document.getElementById(id);
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
const confidence = {
  "local-code":"Code local testé", "official-documentation":"Documentation officielle",
  "official-announcement":"Annonce officielle · disponibilité à vérifier",
  "partial-documentation":"Documentation officielle partielle / indexée"
};
function sourceLinks(sources) {
  const ul = node("ul");
  sources.forEach((source, i) => {
    const li = node("li"), a = node("a", "Source " + (i+1) + " · " + new URL(source.url).hostname + " ↗");
    a.href = source.url; a.target = "_blank"; a.rel = "noopener noreferrer";
    li.append(a, node("span", " · consultée le " + source.checkedAt, "fine")); ul.append(li);
  });
  return ul;
}
/** One public description, never an execution receipt or a private target. */
export function effectDetails(effect) {
  const dl = node("dl", undefined, "effect-details");
  const row = (label, text) => dl.append(node("dt", label), node("dd", text));
  row("Effet personnel documenté", effect.personalEffect);
  row("Classement et limites", effect.algorithmicEffect);
  row("Retour chez le fournisseur", effect.revocation.description);
  row("API et permissions", effect.api.description);
  row("Permissions préparées, non accordées", effect.api.permissions.length ? effect.api.permissions.join(" · ") : "Aucune permission qualifiée pour une intégration FIL CLAIR de ce contrôle. Aucun accès n’est demandé.");
  row("Preuve disponible", "Aucun effet fournisseur testé. " + confidence[effect.confidence] + ". Documentation du " + effect.checkedAt + ", prochaine revue au plus tard le " + effect.reviewBy + ".");
  const status = reviewState(effect);
  if (status !== "current") row("Revue requise", status === "overdue" ? "Échéance documentaire dépassée : vérifier les sources avant de s’appuyer sur ce guide." : "Date documentaire non qualifiable : vérifier les sources.");
  row("Restrictions", effect.restrictions.join(" "));
  if (effect.sources.length) { const dd = node("dd"); dd.append(sourceLinks(effect.sources)); dl.append(node("dt", "Sources officielles · Internet requis"), dd); }
  return dl;
}
function renderX() {
  const x = X_ALGORITHM_EVIDENCE, container = $("x-code-content");
  container.append(node("p", x.explanation), node("p", x.reportingRule), node("p", "Code public vérifié le " + x.checkedAt + " ; déploiement et effet réel non mesurés. Revue au plus tard le " + x.reviewBy + ".", "fine"));
  const commit = node("p", "Version publique : "); commit.append(node("code", x.commit)); container.append(commit);
  const scroll = node("div", undefined, "table-scroll"), table = node("table");
  const caption = node("caption", "Valeurs par défaut publiées · détail technique, aucune mesure d’efficacité");
  const head = node("thead"), header = node("tr");
  for (const title of ["Paramètre", "Home Mixer", "VM Ranker"]) { const th=node("th", title); th.scope="col"; header.append(th); }
  head.append(header); const body=node("tbody"), format=new Intl.NumberFormat("fr-FR", { maximumFractionDigits:3 });
  for (const key of Object.keys(x.components["home-mixer"])) {
    const tr=node("tr"), th=node("th", key); th.scope="row"; tr.append(th);
    for (const component of ["home-mixer", "vm-ranker"]) tr.append(node("td", format.format(x.components[component][key]).replace("-", "−")));
    body.append(tr);
  }
  table.append(caption,head,body); scroll.append(table); container.append(scroll,sourceLinks(x.sources));
  if (reviewState(x) !== "current") container.prepend(node("p", "Code documentaire à revérifier : l’échéance est dépassée ou inconnue.", "notice error"));
}

export function mountRegistry({ getState }) {
  let signature="";
  const selected = () => ["local", ...(getState().flows?.platforms || [])];
  function renderEntries() {
    const value=$("registry-service").value, services=selected();
    const entries=registryEntries().filter(e=>value === "*" || (value ? e.service === value : services.includes(e.service)));
    const fragment=document.createDocumentFragment();
    for (const effect of entries) {
      const li=node("li"); li.dataset.effect=effect.service+"/"+effect.control;
      const details=node("details"), summary=node("summary", PLATFORMS[effect.service].label+" · "+effect.label);
      details.append(summary,node("p", CATEGORIES[effect.category]+" · "+confidence[effect.confidence]+" · "+effect.checkedAt,"registry-meta"),effectDetails(effect));
      li.append(details); fragment.append(li);
    }
    $("registry-items").replaceChildren(fragment);
    $("registry-count").textContent=entries.length+" contrôles documentés · 0 exécution fournisseur vérifiée. Les sources ne contiennent aucune de vos cibles.";
  }
  function render() {
    const services=selected(), next=JSON.stringify(services);
    if (signature !== next) {
      const old=$("registry-service").value; signature=next;
      const option=(value,label)=>{const el=node("option",label);el.value=value;return el;};
      $("registry-service").replaceChildren(option("","Mes services et le carnet local"),...services.map(id=>option(id,PLATFORMS[id].label)),option("*","Tous les modules · avancé"));
      if (old === "*" || services.includes(old)) $("registry-service").value=old;
      if ($("effects-register").open) renderEntries();
    }
  }
  $("registry-service").addEventListener("change",renderEntries);
  $("effects-register").addEventListener("toggle",()=>{if($("effects-register").open)renderEntries();});
  renderX();
  return { render, reset(){signature="";$("registry-service").value="";$("effects-register").open=false;$("x-code-evidence").open=false;} };
}
