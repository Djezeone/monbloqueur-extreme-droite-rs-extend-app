/** Public, offline catalogue. No transport, credentials, tracking or provider execution. */
export const CATALOGUE_CHECKED_AT = "2026-10-28";
export const CATEGORIES = Object.freeze({
  accounts:"Comptes et chaînes", sources:"Médias et sources",
  topics:"Sujets et centres d’intérêt", recommendations:"Préférences de recommandation"
});
const menus = "Les menus, langues, versions et comptes éligibles peuvent varier. Si l’option manque, consultez l’aide officielle ; ne déclarez pas une action non effectuée.";
const manual = (id, category, label, scope, url, steps, limits = "") => ({
  id, category, label, scope, mode:"guide", url, steps, limits:[limits, menus].filter(Boolean)
});
const local = (id, category, label) => ({ id, category, label, mode:"local",
  scope:"Note personnelle sur cet appareil uniquement. Aucun contenu n’est filtré dans une autre application et aucun réglage fournisseur n’est modifié.",
  steps:[], limits:["Retirer cette note l’oublie dans FIL CLAIR, sans agir chez un fournisseur."] });
const google = "https://support.google.com/websearch/answer/2819496?hl=fr";
const youtube = "https://support.google.com/youtube/answer/6342839?hl=fr";
const xBlock = "https://help.x.com/en/using-x/blocking-and-unblocking-accounts";
const xMute = "https://help.x.com/en/using-x/x-mute";
const threads = "https://about.fb.com/news/2023/07/introducing-threads-new-app-text-sharing/";
const instagram = "https://about.fb.com/news/2023/01/instagram-quiet-mode-manage-your-time-and-focus/";
const mastodon = "https://docs.joinmastodon.org/user/moderating/";
const bluesky = "https://blueskyweb.zendesk.com/hc/en-us/articles/19002427251981-Moderation-and-Custom-Feeds";

function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

export const PLATFORMS = freeze({
  local:{ label:"Local / autres services", description:"Votre carnet personnel, sans inscription ni fournisseur obligatoire.", controls:[
    local("account-ignore", "accounts", "Noter un compte à ignorer"),
    local("source-avoid", "sources", "Noter une source à éviter"),
    local("topic-less", "topics", "Noter un sujet à moins voir"),
    local("topic-more", "topics", "Noter un sujet à voir davantage"),
    local("recommendation-note", "recommendations", "Noter une préférence de recommandation")
  ]},
  discover:{ label:"Google Discover", description:"Cartes d’actualité Google ; service entièrement facultatif.", controls:[
    manual("not-interested", "topics", "Un thème ne m’intéresse pas", "Signal portant sur un thème de Discover, sans exclusion de tous les résultats de recherche ni blocage de compte.", google,
      ["Dans Discover, repérez une carte du thème concerné.", "Dans son menu, choisissez le retour négatif sur ce thème si proposé."], "Réglages Google en transition ; disponibilité selon pays et langue."),
    manual("hide-source", "sources", "Ne plus afficher cette source", "Écarte une source de Discover sur les surfaces concernées ; ne bloque ni le site sur le Web ni les résultats Google.", google,
      ["Dans Discover, ouvrez le menu d’une carte de la source.", "Choisissez l’exclusion de cette source si proposée."], "L’exclusion d’une source est distincte du désintérêt pour un thème."),
    manual("restore-source", "sources", "Retirer une exclusion Discover", "Réautorise un élément depuis les intérêts masqués chez Google ; retirer une fiche FIL CLAIR ne produit pas cet effet.", google,
      ["Dans les réglages Discover, ouvrez la gestion des centres d’intérêt masqués.", "Retirez le masquage de l’élément souhaité chez Google."], "Vérifiez le type exact : source ou thème."),
    manual("disable", "recommendations", "Désactiver l’affichage de Discover", "Masque le flux Discover sur la surface Google réglée, sans effacer l’historique ni agir sur tous les services Google.", "https://support.google.com/websearch/answer/9504726?hl=fr",
      ["Ouvrez les paramètres de Discover dans l’application Google ou sur google.com mobile.", "Désactivez l’affichage de Discover là où cette option est proposée."])
  ]},
  "google-search":{ label:"Recherche Google", description:"Réglages de personnalisation de la recherche, sans filtre Web global.", controls:[
    manual("personalization", "recommendations", "Gérer les recommandations personnalisées", "Réglage des services de recherche couverts par Google ; le contexte peut encore influencer les résultats.", "https://support.google.com/websearch/answer/17026260?hl=fr",
      ["Dans votre compte Google, ouvrez Données et confidentialité.", "Consultez les paramètres de personnalisation des services de recherche et choisissez ceux à désactiver."], "Compte Google requis pour ce réglage facultatif seulement. Ne supprime pas l’historique ni toutes les suggestions ; déploiement progressif.")
  ]},
  youtube:{ label:"YouTube", description:"Retours sur les vidéos recommandées et les chaînes proposées.", controls:[
    manual("not-interested", "topics", "Pas intéressé", "Signal sur une vidéo recommandée pour ajuster les recommandations ; ce n’est pas un blocage de chaîne ou de sujet.", youtube,
      ["Sur une recommandation, ouvrez le menu de la vidéo.", "Choisissez Pas intéressé si disponible."], "Certaines fonctions exigent un compte YouTube. Aucune exclusion globale garantie."),
    manual("dont-recommend-channel", "sources", "Ne pas recommander la chaîne", "Retour sur les recommandations de cette chaîne, sur les surfaces prévues par YouTube ; les recherches et liens directs restent distincts.", youtube,
      ["Ouvrez le menu d’une vidéo recommandée de la chaîne.", "Choisissez de ne plus recommander cette chaîne si proposé."], "Ne bloque pas les interactions, n’interdit pas toutes les vidéos de la chaîne."),
    manual("feedback-settings", "recommendations", "Gérer les retours de recommandation", "Accède aux possibilités YouTube de gérer l’historique et les retours ; certains effacements portent sur l’ensemble des retours.", youtube,
      ["Consultez l’aide officielle puis les réglages d’activité YouTube.", "Lisez la portée de l’effacement proposé avant de le confirmer chez Google."], "Aucun effacement ou déblocage individuel n’est effectué par FIL CLAIR.")
  ]},
  x:{ label:"X", description:"Comptes en sourdine, blocages et mots masqués.", controls:[
    manual("mute", "accounts", "Masquer un compte", "Retire ses publications du fil sans rompre l’abonnement ; messages privés et certaines réponses ou mentions peuvent subsister.", xMute,
      ["Ouvrez le profil ou le menu d’une publication du compte.", "Choisissez la mise en sourdine et vérifiez le compte concerné."]),
    manual("block", "accounts", "Bloquer un compte", "Limite les interactions et rompt les abonnements réciproques ; vos publications publiques restent visibles au compte bloqué.", xBlock,
      ["Sur le profil, ouvrez le menu puis choisissez Bloquer.", "Vérifiez le compte et confirmez dans X."], "Le blocage ne garantit pas la confidentialité de publications publiques."),
    manual("unblock", "accounts", "Débloquer un compte", "Retire le blocage dans X ; les anciens abonnements ne sont pas rétablis automatiquement.", xBlock,
      ["Ouvrez le profil bloqué ou la liste des comptes bloqués dans X.", "Choisissez de débloquer ce compte et confirmez chez X."]),
    manual("keywords", "topics", "Gérer les mots masqués", "Filtre des termes sur l’accueil et les notifications configurés, sans filtrer toute la recherche ni masquer automatiquement un compte.", "https://help.x.com/en/using-x/advanced-x-mute-options",
      ["Ouvrez les paramètres de confidentialité, les éléments masqués puis les mots masqués.", "Ajoutez, modifiez ou retirez un terme et choisissez surfaces et durée."])
  ]},
  facebook:{ label:"Facebook", description:"Retours sur le fil et masquage temporaire des sources.", controls:[
    manual("snooze", "sources", "Masquer une source 30 jours", "Suspend dans le fil le contenu d’une personne, Page ou groupe pendant 30 jours ; aucun blocage de relation n’est promis.", "https://about.fb.com/news/2017/12/news-feed-fyi-snooze/",
      ["Dans le fil Facebook, ouvrez le menu d’une publication de cette source.", "Choisissez la pause de 30 jours si disponible."], "Annonce officielle de fonction ; chemin à vérifier dans votre version."),
    manual("not-interested", "topics", "Pas intéressé", "Retour destiné au classement du fil et des contenus similaires, sans exclusion absolue de l’auteur ou du sujet.", "https://about.fb.com/news/2022/10/new-ways-to-customize-your-facebook-feed/",
      ["Ouvrez le menu de la publication recommandée.", "Choisissez le retour de désintérêt disponible."], "Les anciens guides utilisent Voir moins ; Meta a annoncé le changement de nom en 2025.")
  ]},
  instagram:{ label:"Instagram", description:"Contenus suggérés, désintérêt et remise à zéro des recommandations.", controls:[
    manual("not-interested", "topics", "Pas intéressé", "Signal pour réduire les recommandations similaires, sans blocage de personne ni garantie d’exclusion du sujet.", instagram,
      ["Sur une suggestion ou dans Explore, ouvrez ses options.", "Choisissez Pas intéressé si proposé."], "Étapes indicatives d’après documentation officielle ; disponibilité à vérifier dans l’application."),
    manual("keywords", "topics", "Mots à éviter dans les suggestions", "Écarte des suggestions selon les mots des légendes et hashtags ; ce n’est pas une analyse exhaustive des images, de l’audio ou du sens.", instagram,
      ["Dans les réglages de contenu suggéré ou de mots masqués, cherchez le filtre des suggestions.", "Ajoutez ou retirez les termes et activez l’option proposée."], "Chemin indicatif ; ne couvre pas nécessairement les publications des comptes suivis."),
    manual("reset", "recommendations", "Réinitialiser les recommandations", "Réinitialise les suggestions Explore, Reels et Feed, qui se personnalisent ensuite à nouveau selon l’usage.", "https://about.fb.com/news/2024/11/introducing-recommendations-reset-instagram/",
      ["Dans le profil, ouvrez les préférences de contenu depuis le menu.", "Si la remise à zéro est proposée, lisez sa portée puis confirmez dans Instagram."], "Ne vaut pas désabonnement global. Guide documentaire, pas recette de votre compte.")
  ]},
  threads:{ label:"Threads", description:"Abonnements, choix du fil et filtres de réponses.", controls:[
    manual("unfollow", "accounts", "Ne plus suivre", "Retire l’abonnement à ce profil sans le bloquer ni garantir son exclusion du fil de recommandations.", threads,
      ["Ouvrez le profil concerné dans Threads.", "Dans ses options, choisissez de ne plus le suivre."], "Chemin indicatif selon votre version."),
    manual("keywords", "topics", "Mots masqués dans les réponses", "Filtre les réponses à vos propres publications selon les termes choisis ; aucune couverture générale de For You n’est établie ici.", threads,
      ["Dans les réglages de confidentialité, cherchez les mots masqués.", "Ajoutez ou retirez les termes pour les réponses et activez le filtre disponible."], "Chemin indicatif ; ne pas confondre avec un filtre de tout le fil."),
    manual("following", "recommendations", "Choisir le fil des abonnements", "Choisit le fil chronologique des profils suivis ; ne supprime pas les recommandations des autres fils.", threads,
      ["Ouvrez la sélection des fils sur l’accueil Threads.", "Choisissez le fil des comptes suivis si proposé."])
  ]},
  tiktok:{ label:"TikTok", description:"Signaux de désintérêt, abonnements et sujets de For You.", controls:[
    manual("unfollow", "accounts", "Ne plus suivre", "Retire un abonnement ; le compte peut encore apparaître parmi les recommandations de For You.", "https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content",
      ["Ouvrez le profil suivi dans TikTok.", "Utilisez la commande d’abonnement pour ne plus le suivre."], "Étapes indicatives ; vérifiez le nom et l’état chez TikTok."),
    manual("not-interested", "topics", "Pas intéressé", "Demande moins de contenus similaires dans les recommandations, sans blocage de compte ou exclusion définitive du sujet.", "https://newsroom.tiktok.com/tiktoks-new-features-to-help-you-control-your-scroll?lang=en-AU",
      ["Faites un appui prolongé sur la vidéo recommandée.", "Choisissez Pas intéressé si disponible."]),
    manual("topics", "recommendations", "Ajuster les sujets de For You", "Règle les proportions de thèmes proposés dans For You, sans modifier Following, le profil ou la messagerie.", "https://support.tiktok.com/en/account-and-privacy/account-privacy-settings/manage-topics",
      ["Dans les paramètres, ouvrez les préférences de contenu puis la gestion des sujets.", "Ajustez les thèmes proposés et enregistrez chez TikTok."], "Adaptation progressive ; thèmes et disponibilité dépendent du fournisseur.")
  ]},
  bluesky:{ label:"Bluesky", description:"Sourdine, blocage et choix de fils ; API FIL CLAIR inactive.", controls:[
    manual("mute", "accounts", "Masquer un compte", "Masque ses publications principales et notifications ; des réponses peuvent rester accessibles sous un avertissement.", bluesky,
      ["Ouvrez le profil et son menu dans Bluesky.", "Choisissez de masquer ce compte si proposé."], "Le masquage ne rompt pas nécessairement l’abonnement."),
    manual("block", "accounts", "Bloquer un compte", "Restreint les interactions dans Bluesky. Les enregistrements de blocage sont publics dans le protocole.", bluesky,
      ["Ouvrez le menu du profil dans Bluesky.", "Vérifiez la cible et confirmez le blocage dans Bluesky."], "Un blocage n’efface pas les données publiques et ne garantit pas leur confidentialité."),
    manual("feeds", "recommendations", "Choisir ses fils", "Permet de choisir des fils proposés par des générateurs différents, sans garantir un filtrage identique entre eux.", bluesky,
      ["Ouvrez la rubrique des fils dans Bluesky.", "Examinez puis ajoutez ou retirez les fils souhaités."])
  ]},
  mastodon:{ label:"Mastodon", description:"Comptes et filtres de votre instance ; API FIL CLAIR inactive.", controls:[
    manual("mute", "accounts", "Masquer un compte", "Masque le compte sur les surfaces documentées de votre instance ; les notifications et une durée peuvent se régler séparément.", mastodon,
      ["Sur votre instance, ouvrez le menu du profil.", "Choisissez la sourdine puis les notifications et la durée proposées."], "Dépend de la version et du client de l’instance."),
    manual("block", "accounts", "Bloquer un compte", "Masque le compte et limite les interactions ; les abonnements réciproques sont retirés selon les règles Mastodon.", mastodon,
      ["Dans votre instance, ouvrez le menu du profil.", "Vérifiez le compte et confirmez le blocage chez Mastodon."], "Aucune garantie que les contenus publics deviennent inaccessibles sur tout le Web."),
    manual("keywords", "topics", "Gérer les filtres de mots", "Filtre des mots et expressions dans les contextes choisis ; avertissement ou masquage selon la configuration et la version.", mastodon,
      ["Dans les préférences de votre instance, ouvrez les filtres.", "Ajoutez, modifiez ou retirez un filtre et vérifiez ses contextes, sa durée et son effet."])
  ]},
  reddit:{ label:"Reddit", description:"Communautés masquées et suggestions du fil d’accueil.", controls:[
    manual("mute-community", "sources", "Masquer une communauté", "Écarte la communauté de l’accueil, de Popular et des notifications documentées, sans l’exclure de toute recherche ou visite directe.", "https://support.reddithelp.com/hc/en-us/articles/9810475384084-What-is-community-muting",
      ["Ouvrez la page de la communauté et son menu.", "Choisissez de masquer cette communauté et vérifiez son nom."], "Réactiver des notifications peut annuler le masquage ; limites fixées par Reddit."),
    manual("home-recommendations", "recommendations", "Désactiver les suggestions d’accueil", "Désactive les recommandations du fil d’accueil ; les publicités et les autres surfaces ne sont pas couvertes.", "https://support.reddithelp.com/hc/en-us/articles/4402284777364-What-are-home-feed-recommendations",
      ["Ouvrez les préférences Reddit sur le Web, ou les paramètres du compte sur mobile.", "Désactivez les recommandations du fil d’accueil si proposé."]),
    manual("block", "accounts", "Bloquer un compte", "Restreint les interactions et masque des contenus du compte ; certains commentaires, modérateurs et groupes font exception.", "https://support.reddithelp.com/hc/en-us/articles/214548323-How-do-I-block-someone",
      ["Ouvrez le profil Reddit et ses options.", "Vérifiez la cible puis choisissez de la bloquer."], "Le blocage ne s’applique pas aux publicités et comporte des limites fournisseur.")
  ]},
  linkedin:{ label:"LinkedIn", description:"Abonnements du fil, désintérêt et blocage de membres.", controls:[
    manual("unfollow", "sources", "Ne plus suivre une source", "Retire le suivi d’une personne ou entreprise dans le fil ; ce réglage n’est pas un blocage de membre.", "https://www.linkedin.com/help/linkedin/answer/a528074",
      ["Ouvrez Mon réseau puis les abonnements et sources suivies.", "Choisissez de ne plus suivre la source et confirmez si demandé."]),
    manual("not-interested", "topics", "Pas intéressé", "Retire la publication et signale une préférence de recommandation ; masquer une publication ou son auteur sont des choix distincts.", "https://www.linkedin.com/help/linkedin/answer/a523209",
      ["Dans le fil, ouvrez les options de la publication.", "Choisissez Pas intéressé si cette option correspond à votre intention."]),
    manual("block", "accounts", "Bloquer un membre", "Restreint la relation et la visibilité avec le membre selon les règles LinkedIn ; des exceptions existent.", "https://www.linkedin.com/help/linkedin/answer/a1338373/block-or-unblock-a-member?lang=en",
      ["Sur le profil, ouvrez les options de signalement ou blocage.", "Vérifiez le membre puis confirmez le blocage chez LinkedIn."], "Après déblocage, délai documenté avant un nouveau blocage ; les recommandations perdues ne sont pas toutes restaurées.")
  ]},
  safari:{ label:"Safari", description:"Suggestions du navigateur Apple, distinctes d’un flux d’actualités.", controls:[
    manual("search-suggestions", "recommendations", "Suggestions du moteur sur iPhone", "Règle les suggestions du moteur pendant la saisie dans Safari, sans filtrer ses résultats ni modifier Discover ou YouTube.", "https://support.apple.com/fr-fr/guide/iphone/iph6297b394b/ios",
      ["Sur iPhone, ouvrez Réglages puis Apps et Safari selon votre version.", "Désactivez les suggestions du moteur de recherche si souhaité."], "Guide iPhone ; choisissez la version et le guide iPad dans l’assistance pour un iPad. Aucun compte Apple requis pour ce réglage local."),
    manual("start-page", "recommendations", "Sections de la page de démarrage iPhone", "Choisit les sections proposées sur la page de démarrage Safari ; ce n’est pas un réglage Apple News ou un Discover Apple.", "https://support.apple.com/fr-fr/guide/iphone/iphb3100d149/ios",
      ["Ouvrez un nouvel onglet Safari sur iPhone.", "En bas de la page de démarrage, ouvrez Modifier puis choisissez les sections souhaitées."], "L’intitulé et les sections varient selon la version ; synchronisation entre appareils facultative et distincte."),
    manual("mac-suggestions", "recommendations", "Suggestions Safari sur Mac", "Règle les suggestions Apple du champ de recherche intelligente ; les suggestions du moteur sont un réglage séparé.", "https://support.apple.com/fr-fr/guide/safari/sfria1042d31/mac",
      ["Sur Mac, ouvrez Safari, Réglages puis Recherche.", "Modifiez l’option de suggestions Safari après lecture de sa description."], "Parcours Mac uniquement, pas un blocage de site ou de compte social.")
  ]}
});

export function getControl(platform, id) {
  return typeof platform === "string" && Object.hasOwn(PLATFORMS, platform)
    ? PLATFORMS[platform].controls.find(control => control.id === id) || null : null;
}
