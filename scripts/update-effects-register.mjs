import { readFile, writeFile } from "node:fs/promises";
import { PLATFORMS, CATEGORIES } from "../pwa/platforms.js";
import { registryEntries, X_ALGORITHM_EVIDENCE } from "../pwa/effects.js";
const escape = value => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const lines = ["# Registre des effets vérifiés — niveau de preuve documentaire", "",
  "Généré depuis `pwa/effects.js` et le catalogue par `node scripts/update-effects-register.mjs`. Ce document reflète le code public livré ; il n’atteste aucune exécution ou mesure sur un compte fournisseur. Les données personnelles ne participent jamais à cette génération.", "",
  "## Capacités réelles par service", "",
  "43 contrôles sur 14 modules : 5 notes locales et 38 parcours guidés. Aucune API connectée. Les permissions préparées ne sont ni demandées ni accordées. `not-qualified` signifie intégration FIL CLAIR non qualifiée, sans prétendre à l’absence générale d’API fournisseur.", "",
  "| Service | Contrôles | Mode livré | API FIL CLAIR | Permissions préparées, non accordées |", "| --- | ---: | --- | --- | --- |"];
for (const [id, platform] of Object.entries(PLATFORMS)) {
  const effects = registryEntries().filter(e => e.service === id);
  const statuses = [...new Set(effects.map(e => e.api.status))].join(" ; ");
  const permissions = [...new Set(effects.flatMap(e => e.api.permissions))].join(" ; ") || "Non qualifiées / sans objet";
  lines.push(`| ${escape(platform.label)} | ${effects.length} | ${id === "local" ? "Note locale" : "Guide manuel"} | ${statuses} | ${escape(permissions)} |`);
}
lines.push("", "Les contrats inactifs ne couvrent que le blocage préparé Bluesky/Mastodon. Pour les accès/scopes/révocations documentés des autres services et leurs réserves : [audit des effets](research/2026-10-29-effects-register-audit.md), [contrats officiels](OFFICIAL_CONNECTORS.md). Les aides Meta détaillées limitées par HTTP 429 n’ont pas été revalidées par la reprise d’une annonce.", "",
  "## Effets et possibilités de retour par contrôle", "",
  "Le retrait de fiche, le retour de statut dans FIL CLAIR, le réglage inverse du fournisseur et la révocation OAuth sont distincts. Une commande inverse ne garantit jamais le classement passé, les anciens abonnements ou l’effacement des copies. `providerTested:false` pour chaque entrée.", "",
  "| Service / contrôle | Catégorie | Effet personnel documenté | Retour documenté / réserve | Confiance documentaire | Consultation / revue | Source principale |", "| --- | --- | --- | --- | --- | --- | --- |"
);
for (const effect of registryEntries()) {
  const source = effect.sources[0];
  lines.push(`| ${effect.service}/${effect.control} | ${escape(CATEGORIES[effect.category])} | ${escape(effect.personalEffect)} | ${escape(effect.revocation.description)} | ${effect.confidence} | ${effect.checkedAt} / ${effect.reviewBy} | ${source ? `[Officielle](${source.url})` : "Code local, sans fournisseur"} |`);
}
lines.push("", "## Limites algorithmiques par service", "", "| Service | Constat et limites |", "| --- | --- |");
for (const [id, platform] of Object.entries(PLATFORMS)) lines.push(`| ${escape(platform.label)} | ${escape(registryEntries().find(e => e.service === id).algorithmicEffect)} |`);
lines.push("", "## X : version publique et composants", "", `Commit inspecté : [${X_ALGORITHM_EVIDENCE.commit}](https://github.com/xai-org/x-algorithm/commit/${X_ALGORITHM_EVIDENCE.commit}), consultation ${X_ALGORITHM_EVIDENCE.checkedAt}. Production et effet mesuré : **non vérifiés**.`, "", X_ALGORITHM_EVIDENCE.explanation, "", X_ALGORITHM_EVIDENCE.reportingRule, "", "| Paramètre | Home Mixer | VM Ranker |", "| --- | ---: | ---: |");
for (const key of Object.keys(X_ALGORITHM_EVIDENCE.components["home-mixer"])) lines.push(`| ${key} | ${X_ALGORITHM_EVIDENCE.components["home-mixer"][key]} | ${X_ALGORITHM_EVIDENCE.components["vm-ranker"][key]} |`);
lines.push("", "Sources figées :", "", ...X_ALGORITHM_EVIDENCE.sources.map((s, i) => `- [Code ${i+1}](${s.url}) · ${s.checkedAt}`), "", "La [recherche détaillée](research/2026-10-29-x-algorithm.md) décrit la somme pondérée, le décalage, les paramètres/overrides et les composants manquants. Aucun ratio d’équivalence d’actions réelles ni outil de signalement n’en découle.", "",
  "## Mise à jour et péremption", "", "Les dates de consultation restent celles des sources ; une génération ne les rafraîchit pas. Les échéances de revue sont une politique documentaire de 90 jours, pas une garantie de stabilité jusque-là. Le registre PWA signale une échéance dépassée ; il ne fait aucun rafraîchissement réseau automatique. Un changement impose lecture officielle ciblée, changement de source/date/confiance/effet, tests, génération et revue de la PR. Les anciens constats restent dans l’historique Git.", "");
const output=lines.join("\n"), file=new URL("../docs/EFFECTS_REGISTER.md",import.meta.url);
if (process.argv.includes("--check")) {
  if (await readFile(file,"utf8") !== output) throw Error("Registre documentaire périmé : node scripts/update-effects-register.mjs");
  console.log("Documentary register: 14 services / 43 controls, synchronized PASS");
} else { await writeFile(file,output); console.log("docs/EFFECTS_REGISTER.md generated"); }
