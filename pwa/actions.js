/** Common action projection. Documentary claims are never provider receipts. */
import { CATALOGUE_CHECKED_AT, getControl } from "./platforms.js";
import { newFlows, validateFlows } from "./flow-core.js";

export const FLOW_STATUS = Object.freeze({
  planned:"À faire", declared:"Déclaré effectué · non vérifié", failed:"En échec · déclaré",
  review:"À vérifier", cancelled:"Suivi annulé · aucun retour distant", local:"Note locale · aucun effet fournisseur"
});

export function actionRecord(item) {
  const valid = validateFlows({ ...newFlows(), items:[item] }).items[0];
  const control = getControl(valid.platform, valid.control), local = control.mode === "local";
  return {
    id:valid.id, service:valid.platform, nature:control.id, category:control.category,
    scope:{ kind:local ? "local" : valid.platform === "safari" ? "device" : "account", description:control.scope },
    method:local ? "local" : "guided", state:valid.status, date:valid.updatedAt,
    verification:{ kind:valid.status === "declared" ? "self-declared" : valid.status === "local" ? "local-record" : "none",
      source:valid.status === "declared" ? "Déclaration personnelle" : valid.status === "local" ? "Enregistrement dans FIL CLAIR" : "Aucune preuve d’exécution",
      at:["declared", "local"].includes(valid.status) ? valid.updatedAt : null, providerConfirmed:false },
    documentation:{ url:local ? null : control.url, checkedAt:CATALOGUE_CHECKED_AT },
    revocation:{ requiresProvider:!local, description:local ? "Retirer la fiche oublie cette note dans FIL CLAIR."
      : "Le retour arrière dans FIL CLAIR change le suivi seulement. Consultez les possibilités et limites de retour chez le fournisseur dans le registre." },
    history:(valid.events || []).map(event => ({ ...event }))
  };
}

export function flowMetrics(flows = newFlows()) {
  const current = validateFlows(flows);
  const metrics = { total:current.items.length, local:0, planned:0, declared:0, failed:0, review:0, cancelled:0, providerConfirmed:0 };
  for (const item of current.items) metrics[item.status]++;
  return metrics;
}
