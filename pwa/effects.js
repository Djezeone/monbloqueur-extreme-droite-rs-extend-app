/** Public documentary register. No personal input, transport or execution evidence. */
import { PLATFORMS, CATALOGUE_CHECKED_AT, getControl } from "./platforms.js";

function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const xCommit = "5ed796374ea48ee26058aab66ab10c266bea2bef";
const xBase = "https://github.com/xai-org/x-algorithm/blob/" + xCommit + "/";
export const X_ALGORITHM_EVIDENCE = freeze({
  commit:xCommit, checkedAt:"2026-10-29", reviewBy:"2027-01-27", productionVerified:false, effectMeasured:false,
  components:{
    "home-mixer":{ ReportWeight:-234, MuteAuthorWeight:-58.8, NotInterestedWeight:-52.272, BlockAuthorWeight:-31.2, NotDwelledWeight:-0.02 },
    "vm-ranker":{ ReportWeight:-234, MuteAuthorWeight:-58.8, NotInterestedWeight:-47.52, BlockAuthorWeight:-31.2, NotDwelledWeight:-0.02 }
  },
  explanation:"Le code public combine des probabilités prédites pour un lecteur et une publication, et certaines prédictions continues : somme des poids × prédictions, puis transformation et autres étapes de classement. Ces nombres sont des valeurs par défaut par composant, avec configuration et overrides possibles. Aucun point par action réelle, aucune pénalité globale d’un compte ni baisse chiffrée de visibilité n’est démontrée. La calibration, la configuration effective et le déploiement de ce SHA sur X ne sont pas vérifiés.",
  reportingRule:"Un signalement doit concerner une possible infraction aux règles du fournisseur. Sa transmission ne prouve ni infraction ni sanction. Aucune campagne politique, action massive ou automatisation de signalement n’est proposée.",
  reportActionAvailable:false,
  sources:[
    { url:xBase+"home-mixer/params/param.rs#L491-L514", kind:"public-code", checkedAt:"2026-10-29" },
    { url:xBase+"vm-ranker/params.rs#L109-L132", kind:"public-code", checkedAt:"2026-10-29" },
    { url:xBase+"xai-value-model/scoring.rs#L57-L170", kind:"public-code", checkedAt:"2026-10-29" },
    { url:xBase+"xai-value-model/weights.rs#L1-L118", kind:"public-code", checkedAt:"2026-10-29" }
  ]
});

const algorithmic = {
  local:"Aucun effet algorithmique chez un fournisseur. FIL CLAIR enregistre seulement votre note locale.",
  discover:"Google documente des contrôles sur Discover. Aucun poids, délai ou effet quantifié n’est établi ici ; la recherche et les autres services restent distincts.",
  "google-search":"La personnalisation peut évoluer selon les réglages, le contexte et le déploiement Google. Aucune neutralité ou exclusion globale des résultats n’est garantie.",
  youtube:"YouTube décrit ces retours comme des signaux de recommandation. Aucun coefficient ni exclusion absolue de sujet ou de chaîne sur toutes les surfaces n’est établi.",
  x:"Le code public de X décrit un classement par prédictions et un filtrage personnel des auteurs masqués/bloqués. Les poids varient selon composant et configuration. Aucun effet chiffré ni pénalité globale n’est démontré.",
  facebook:"Meta annonce des ajustements personnels du fil. Aucun poids, garantie d’exclusion ou effet sur la portée générale d’un auteur n’est établi ici.",
  instagram:"Meta documente des préférences de suggestions, puis une personnalisation qui reprend selon l’usage. Aucun classement précis ni effet global sur un auteur n’est démontré.",
  threads:"Choisir un fil ou filtrer ses réponses a une portée limitée. Ce registre n’établit aucun filtre universel de For You ni coefficient de recommandation.",
  tiktok:"TikTok décrit des signaux personnels et réglages de For You. Leur effet peut être progressif ; aucun délai, coefficient ou résultat chiffré n’est garanti.",
  bluesky:"Les générateurs de fils peuvent avoir des règles différentes. Un masquage ou choix de fil n’établit pas une baisse de visibilité générale d’un compte.",
  mastodon:"Les relations et filtres s’appliquent aux contextes et clients documentés de l’instance. Aucun classement algorithmique global commun au fédivers n’est présumé.",
  reddit:"Les contrôles documentés couvrent certaines surfaces et comportent des exceptions. Aucun effet chiffré sur le classement ou la visibilité globale d’un compte n’est établi.",
  linkedin:"Le fournisseur décrit des préférences personnelles du fil et des relations. Aucun coefficient ni effet quantifié sur la diffusion générale d’un membre n’est connu ici.",
  safari:"Safari règle des suggestions et sa page de démarrage. Ce n’est pas un flux Discover ; aucun algorithme équivalent à Google Discover ou effet sur un réseau social n’est présumé."
};

const apiSources = {
  x:"https://docs.x.com/x-api/users/mute-user",
  bluesky:"https://atproto.com/specs/oauth",
  mastodon:"https://docs.joinmastodon.org/api/oauth-scopes/",
  reddit:"https://www.reddit.com/dev/api/",
  linkedin:"https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access",
  tiktok:"https://developers.tiktok.com/docs/en/tiktok-api-scopes"
};
function apiFor(service, control) {
  const prepared = control === "block" && ["mastodon", "bluesky"].includes(service);
  const permissions = prepared ? service === "mastodon" ? ["profile", "write:blocks", "read:follows"]
    : ["atproto", "repo:app.bsky.graph.block?action=create&action=delete"] : [];
  const description = prepared
    ? "Contrat de blocage préparé et testé avec fournisseur simulé seulement. OAuth, transport réel, identité, consentement, relecture et révocation restent à qualifier ; aucun accès accordé."
    : service === "local" || service === "safari"
      ? "Aucune connexion de compte requise pour le carnet ou ce guide. FIL CLAIR n’exécute pas le réglage Safari."
      : "Aucune intégration FIL CLAIR qualifiée pour ce contrôle. Cela ne signifie pas que le fournisseur n’a pas d’API. Accès, contrat, coût et permissions minimales doivent être vérifiés avant toute activation.";
  return { status:prepared ? "documented-inactive" : ["local", "safari"].includes(service) ? "not-applicable" : "not-qualified",
    connected:false, permissions, requested:[], granted:null, description };
}

const reversals = {
  "discover/not-interested":"Réexaminer les intérêts masqués dans Discover ; les retours exacts récupérables dépendent de Google.",
  "discover/hide-source":"Retirer l’exclusion dans les intérêts masqués Google, si l’élément est proposé.",
  "discover/restore-source":"Masquer de nouveau la source dans Discover si souhaité ; aucun ancien historique n’est reconstruit.",
  "discover/disable":"Réactiver Discover sur la même surface ; vérifier séparément les autres surfaces.",
  "google-search/personalization":"Revenir au même centre de personnalisation ; conserver soi-même les choix antérieurs si nécessaire.",
  "youtube/not-interested":"L’aide YouTube décrit l’effacement des retours de désintérêt, parfois global ; aucune annulation individuelle n’est promise.",
  "youtube/dont-recommend-channel":"L’aide YouTube décrit l’effacement des retours de recommandation ; vérifier la portée globale avant confirmation.",
  "x/mute":"Réactiver le compte depuis le profil ou les comptes masqués dans X.",
  "x/block":"Débloquer dans X ne rétablit pas automatiquement les abonnements réciproques.",
  "x/unblock":"Un nouveau blocage se décide dans X ; les anciennes relations ne sont pas restaurées automatiquement.",
  "x/keywords":"Retirer ou modifier le mot masqué, ses contextes et sa durée dans X.",
  "facebook/snooze":"La pause expire après 30 jours ; consulter les possibilités de fin anticipée dans Facebook.",
  "instagram/keywords":"Retirer les termes des réglages de suggestions ; aucune remise à l’état exact d’un fil antérieur n’est prouvée.",
  "threads/unfollow":"Suivre de nouveau le compte dans Threads, sous réserve de ses conditions d’accès.",
  "threads/keywords":"Retirer les mots du filtre des réponses dans Threads ; les autres filtres restent distincts.",
  "threads/following":"Choisir un autre fil dans Threads ; les abonnements restent un réglage séparé.",
  "tiktok/unfollow":"Suivre de nouveau le compte chez TikTok, sous réserve de ses conditions d’accès.",
  "tiktok/topics":"Réajuster les thèmes dans TikTok. Aucune restauration exacte des recommandations précédentes n’est garantie.",
  "bluesky/mute":"Réactiver le compte dans Bluesky ; ce choix ne rétablit pas un abonnement éventuellement retiré.",
  "bluesky/block":"Retirer le blocage dans Bluesky ; les enregistrements et contenus publics restent distincts.",
  "bluesky/feeds":"Ajouter ou retirer de nouveau les fils ; leurs règles peuvent évoluer indépendamment.",
  "mastodon/mute":"Retirer la sourdine sur l’instance ; notifications et durée sont des paramètres distincts.",
  "mastodon/block":"Débloquer sur l’instance ne reconstitue pas les anciens abonnements réciproques.",
  "mastodon/keywords":"Modifier ou retirer le filtre dans les préférences de l’instance, en vérifiant ses contextes.",
  "reddit/mute-community":"Réactiver la communauté dans Reddit ; vérifier séparément les notifications.",
  "reddit/home-recommendations":"Réactiver les recommandations d’accueil dans Reddit ; autres surfaces et publicités distinctes.",
  "reddit/block":"Débloquer chez Reddit ; les délais, exceptions et restrictions fournisseur restent applicables.",
  "linkedin/unfollow":"Suivre de nouveau la source dans LinkedIn ; aucun lien de relation n’est automatiquement recréé.",
  "linkedin/block":"Débloquer chez LinkedIn ; un délai peut s’appliquer avant un nouveau blocage et les relations ne sont pas toutes restaurées.",
  "safari/search-suggestions":"Réactiver le même réglage dans Safari sur l’appareil ; les autres suggestions restent séparées.",
  "safari/start-page":"Modifier de nouveau les sections de la page de démarrage Safari sur l’appareil.",
  "safari/mac-suggestions":"Réactiver le réglage de suggestions Safari sur Mac ; le réglage du moteur est distinct."
};

function effectFor(service, control) {
  const local = service === "local", url = control.url;
  const confidence = local ? "local-code" : new URL(url).hostname === "about.fb.com" ? "official-announcement"
    : ["tiktok", "reddit", "linkedin", "bluesky"].includes(service) ? "partial-documentation" : "official-documentation";
  const reversal = reversals[service+"/"+control.id];
  const api = apiFor(service, control.id);
  return freeze({ service, control:control.id, category:control.category, label:control.label,
    scope:local ? "local" : service === "safari" ? "device" : "account", method:local ? "local" : "guided",
    personalEffect:control.scope, algorithmicEffect:algorithmic[service], providerTested:false, api,
    revocation:{ kind:local ? "local-removal" : reversal ? "provider-setting" : "not-established",
      description:local ? "Retirer la fiche oublie la note locale. Les fichiers déjà exportés restent à gérer séparément."
        : reversal || "Retour individuel ou restauration exacte non établis par ce registre. Consultez l’aide du fournisseur ; retirer une fiche FIL CLAIR n’annule aucun effet distant." },
    restrictions:[...control.limits, local ? "La note n’applique aucun filtre aux autres applications."
      : "Guide documentaire seulement : option réelle à vérifier dans votre compte/version. Aucun effet fournisseur testé ici.",
      "Révoquer une autorisation OAuth, revenir sur un réglage, retirer une fiche et effacer des données sont quatre opérations distinctes. Aucune connexion OAuth n’est active."],
    confidence, checkedAt:CATALOGUE_CHECKED_AT, reviewBy:"2027-01-26",
    sources:local ? [] : [{ url, kind:confidence, checkedAt:CATALOGUE_CHECKED_AT },
      ...(apiSources[service] ? [{ url:service === "x" && ["block", "unblock"].includes(control.id)
        ? "https://docs.x.com/x-api/users/block-user" : apiSources[service], kind:"official-api", checkedAt:CATALOGUE_CHECKED_AT }] : [])]
  });
}
const entries = Object.entries(PLATFORMS).flatMap(([service, platform]) => platform.controls.map(control => effectFor(service, control)));
const byKey = new Map(entries.map(effect => [effect.service+"/"+effect.control, effect]));
freeze(entries);
export function registryEntries() { return entries; }
export function getEffect(service, control) {
  if (!getControl(service, control)) return null;
  return byKey.get(service+"/"+control) || null;
}
function validDay(day) {
  return typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0,10) === day;
}
export function reviewState(effect, asOf = new Date().toISOString().slice(0,10)) {
  if (!effect || !validDay(effect.reviewBy) || !validDay(asOf)) return "unknown";
  return asOf > effect.reviewBy ? "overdue" : "current";
}
