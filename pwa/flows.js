import { PLATFORMS, CATEGORIES, CATALOGUE_CHECKED_AT, getControl } from "./platforms.js";
import { newFlows, configureFlows, addFlow, setFlowStatus, removeFlow } from "./flow-core.js";

const $ = id => document.getElementById(id);
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function option(value, label) { const el = node("option", label); el.value = value; return el; }
function officialLink(control, context = "") {
  const link = node("a", "Aide officielle ↗", "button outline");
  link.href = control.url; link.target = "_blank"; link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", "Aide officielle · " + control.label + (context ? " · " + context : ""));
  return link;
}
function instructions(control, includeLink = true) {
  const container = node("div");
  container.append(node("p", control.scope));
  container.append(node("p", control.mode === "local"
    ? "Mode : note locale. Aucun effet dans un autre service."
    : "Mode : parcours guidé, à effectuer vous-même chez le fournisseur. Un compte peut y être demandé, jamais pour utiliser le carnet local.", "fine"));
  if (control.steps.length) {
    const steps = node("ol");
    control.steps.forEach(step => steps.append(node("li", step)));
    container.append(steps);
  }
  control.limits.forEach(limit => container.append(node("p", limit, "fine")));
  if (control.mode === "guide" && includeLink) {
    container.append(officialLink(control), node("p", "Documentation consultée le " + CATALOGUE_CHECKED_AT + ". Le lien nécessite Internet et peut s’ouvrir dans une application selon votre système. Aucune donnée de cette fiche ne figure dans son URL.", "fine"));
  }
  return container;
}

/** All writes use the application's one atomic snapshot; never direct Storage or fetch. */
export function mountFlows({ getState, save, notify, navigate }) {
  let setupOpen = false, step = 1, configSignature = "";
  let draftPlatforms = new Set(), draftCategories = new Set();
  const current = () => getState().flows || newFlows();
  function checkbox(value, label, description, group) {
    const wrapper = node("label", undefined, "choice-card");
    const input = node("input"); input.type = "checkbox"; input.value = value; input.name = group;
    const text = node("span"); text.append(node("strong", label), node("small", description));
    wrapper.append(input, text);
    input.addEventListener("change", () => {
      const set = group === "services" ? draftPlatforms : draftCategories;
      if (input.checked) set.add(value); else set.delete(value);
    });
    return wrapper;
  }
  Object.entries(PLATFORMS).filter(([id]) => id !== "local").forEach(([id, platform]) =>
    $("flow-platform-options").append(checkbox(id, platform.label, platform.description, "services")));
  const categoryDescriptions = {
    accounts:"Bloquer, masquer, ne plus suivre ou garder une note, selon le service.",
    sources:"Médias, chaînes, sites ou communautés à examiner.",
    topics:"Voir plus, voir moins, filtrer des mots ou noter un intérêt.",
    recommendations:"Comprendre et choisir les réglages de recommandation disponibles."
  };
  Object.entries(CATEGORIES).forEach(([id, title]) =>
    $("flow-category-options").append(checkbox(id, title, categoryDescriptions[id], "categories")));

  function loadDraft() {
    draftPlatforms = new Set(current().platforms); draftCategories = new Set(current().categories);
    for (const input of $("flow-platforms").querySelectorAll("input")) input.checked = draftPlatforms.has(input.value);
    for (const input of $("flow-categories").querySelectorAll("input")) input.checked = draftCategories.has(input.value);
  }
  function renderSetup(focus = false) {
    $("flow-setup").hidden = !setupOpen;
    $("flow-workspace").hidden = setupOpen || !current().setupComplete;
    $("flow-edit").hidden = setupOpen || !current().setupComplete;
    $("flow-step-count").textContent = "Étape " + step + " sur 3";
    $("flow-step-heading").textContent = ["Quels services souhaitez-vous maîtriser ?", "Que souhaitez-vous moins voir ?", "Agir et suivre, à votre rythme"][step - 1];
    $("flow-platforms").hidden = step !== 1;
    $("flow-categories").hidden = step !== 2;
    $("flow-preview").hidden = step !== 3;
    $("flow-back").hidden = step === 1;
    $("flow-next").hidden = step === 3;
    $("flow-finish").hidden = step !== 3;
    $("flow-preview").replaceChildren(
      node("p", "Services : " + ([...draftPlatforms].map(id => PLATFORMS[id].label).join(", ") || "aucun service externe") + ". Le carnet local reste disponible."),
      node("p", "Catégories : " + [...draftCategories].map(id => CATEGORIES[id]).join(", ") + "."),
      node("p", "Vous ajoutez une cible puis choisissez un contrôle. Chaque fiche précise sa portée : note locale ou guide à suivre. Rien n’est exécuté automatiquement."),
      node("p", "Après une action manuelle, vous pouvez la déclarer effectuée. FIL CLAIR ne la confirme pas par API. Vos choix restent modifiables ; changer de services ne supprime aucune fiche.", "fine")
    );
    if (focus && !$("view-flows").hidden) $("flow-step-heading").focus();
  }
  function openSetup() { setupOpen = true; step = 1; loadDraft(); renderSetup(true); }

  function renderControl() {
    const control = getControl($("flow-platform").value, $("flow-control").value);
    $("flow-add-button").disabled = !control;
    $("flow-control-info").replaceChildren(control ? instructions(control)
      : node("p", "Aucun contrôle documenté pour cette catégorie et ce service. Choisissez une autre catégorie ou le carnet Local / autres services.", "fine"));
  }
  function renderControls() {
    const platform = PLATFORMS[$("flow-platform").value];
    const old = $("flow-control").value;
    const controls = platform.controls.filter(control => control.category === $("flow-category").value);
    $("flow-control").replaceChildren(...controls.map(control => option(control.id, control.label)));
    if (controls.some(control => control.id === old)) $("flow-control").value = old;
    $("flow-control").disabled = !controls.length;
    renderControl();
  }
  function renderCategories(preferSupported = false) {
    const old = $("flow-category").value;
    const categories = current().categories;
    $("flow-category").replaceChildren(...categories.map(id => option(id, CATEGORIES[id])));
    if (categories.includes(old)) $("flow-category").value = old;
    const controls = PLATFORMS[$("flow-platform").value].controls;
    if (preferSupported && !controls.some(control => control.category === $("flow-category").value)) {
      const first = categories.find(category => controls.some(control => control.category === category));
      if (first) $("flow-category").value = first;
    }
    renderControls();
  }
  function renderConfiguration() {
    const flows = current(), signature = JSON.stringify([flows.platforms, flows.categories]);
    if (signature === configSignature) return;
    configSignature = signature;
    const previous = $("flow-platform").value;
    const services = ["local", ...flows.platforms];
    $("flow-platform").replaceChildren(...services.map(id => option(id, PLATFORMS[id].label)));
    if (services.includes(previous)) $("flow-platform").value = previous;
    renderCategories(true);
  }
  function flowButton(label, action, item) {
    const button = node("button", label, "button subtle"); button.type = "button";
    button.dataset.flowAction = action; button.dataset.flowId = item.id;
    button.setAttribute("aria-label", label + " · " + item.target + " · " + PLATFORMS[item.platform].label);
    return button;
  }
  function renderItems() {
    const flows = current(), query = $("flow-filter").value.trim().toLowerCase();
    const planned = flows.items.filter(item => item.status === "planned").length;
    const declared = flows.items.filter(item => item.status === "declared").length;
    $("flow-count").textContent = `${flows.items.length} choix · ${planned} à faire · ${declared} déclarés · ${flows.items.length - planned - declared} notes locales · 0 confirmation API`;
    const fragment = document.createDocumentFragment();
    flows.items.filter(item => {
      const control = getControl(item.platform, item.control);
      return !query || [item.target, PLATFORMS[item.platform].label, CATEGORIES[control.category], control.label].join(" ").toLowerCase().includes(query);
    }).forEach(item => {
      const control = getControl(item.platform, item.control);
      const li = node("li"); li.dataset.flowId = item.id;
      const heading = node("div", undefined, "section-heading");
      heading.append(node("h3", item.target), node("span", { planned:"À faire", declared:"Déclaré effectué · non vérifié", local:"Note locale · aucun effet fournisseur" }[item.status], "flow-status"));
      li.append(heading, node("p", PLATFORMS[item.platform].label + " · " + CATEGORIES[control.category] + " · " + control.label, "fine"), node("p", control.scope));
      const actions = node("div", undefined, "import-row");
      if (control.mode === "guide") {
        actions.append(officialLink(control, item.target), flowButton(item.status === "declared" ? "Remettre à faire" : "Déclarer effectué", item.status === "declared" ? "reset" : "declare", item));
        const details = node("details"); details.append(node("summary", "Étapes et limites · " + control.label), instructions(control, false)); li.append(details);
      }
      actions.append(flowButton("Retirer le choix", "remove", item));
      li.append(actions); fragment.append(li);
    });
    $("flow-items").replaceChildren(fragment);
    $("flow-empty").hidden = $("flow-items").children.length !== 0;
  }
  function focusItem(id, action) {
    const buttons = [...$("flow-items").querySelectorAll("button")];
    (buttons.find(button => button.dataset.flowId === id && button.dataset.flowAction === action) || $("flow-filter")).focus();
  }

  $("flow-next").addEventListener("click", () => {
    if (step === 2 && !draftCategories.size) return notify("Choisissez au moins une catégorie.", true);
    step = Math.min(step + 1, 3); renderSetup(true);
  });
  $("flow-back").addEventListener("click", () => { step = Math.max(step - 1, 1); renderSetup(true); });
  $("flow-cancel").addEventListener("click", () => { setupOpen = false; navigate("home"); });
  $("flow-edit").addEventListener("click", openSetup);
  $("flow-setup").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const flows = configureFlows(current(), [...draftPlatforms], [...draftCategories]);
      if (await save({ ...getState(), flows }, "Vos choix sont enregistrés. Aucune action n’a été exécutée chez un fournisseur.")) {
        setupOpen = false; render(); $("flow-target").focus();
      }
    } catch (error) { notify(error.message, true); }
  });
  $("flow-platform").addEventListener("change", () => renderCategories(true));
  $("flow-category").addEventListener("change", renderControls);
  $("flow-control").addEventListener("change", renderControl);
  $("flow-filter").addEventListener("input", renderItems);
  $("flow-add").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const flows = addFlow(current(), { id:"flow-" + crypto.randomUUID(), platform:$("flow-platform").value,
        control:$("flow-control").value, target:$("flow-target").value });
      if (await save({ ...getState(), flows }, "Choix ajouté sur cet appareil. Aucun contenu distant n’a été modifié.")) {
        $("flow-target").value = ""; $("flow-target").focus();
      }
    } catch (error) { notify(error.message, true); }
  });
  $("flow-items").addEventListener("click", async event => {
    const button = event.target.closest("button[data-flow-action]"); if (!button) return;
    const item = current().items.find(item => item.id === button.dataset.flowId); if (!item) return;
    const action = button.dataset.flowAction, control = getControl(item.platform, item.control);
    if (action === "declare" && !confirm("Avez-vous effectué « " + control.label + " » vous-même chez " + PLATFORMS[item.platform].label + " pour « " + item.target + " » ?\n\nPortée : " + control.scope + "\n\nCeci est votre déclaration, sans vérification API par FIL CLAIR.")) return;
    if (action === "remove" && !confirm("Retirer ce choix et sa déclaration de FIL CLAIR ? Aucune action ne sera annulée sur la plateforme.")) return;
    try {
      const flows = action === "remove" ? removeFlow(current(), item.id)
        : setFlowStatus(current(), item.id, action === "declare" ? "declared" : "planned");
      const message = action === "declare" ? "Déclaration personnelle enregistrée, non confirmée par API."
        : "Choix local mis à jour ; aucune action n’est effectuée ou annulée sur la plateforme.";
      if (await save({ ...getState(), flows }, message)) focusItem(item.id, action === "declare" ? "reset" : "declare");
    } catch (error) { notify(error.message, true); }
  });

  function render() {
    if (!current().setupComplete && !setupOpen) { setupOpen = true; step = 1; loadDraft(); }
    renderSetup(); renderConfiguration(); renderItems();
  }
  function resetDraft() {
    setupOpen = !current().setupComplete;
    step = 1; configSignature = ""; loadDraft();
  }
  return { render, openSetup, resetDraft };
}
