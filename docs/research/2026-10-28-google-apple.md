# FIL CLAIR V2 — Google, YouTube et Apple : contrôles officiels

Recherche consultée le **2026-10-28**. Statut : documentation vérifiée en lecture ; aucune connexion, action sociale, requête API authentifiée ni recette sur appareil effectuée. Cette note propose des données de guide ; elle ne décrit pas une intégration opérationnelle.

## Décisions de présentation

- L'usage local de FIL CLAIR, ses listes et son export doivent rester accessibles sans compte Google, Apple ou social. Le compte éventuellement demandé par une plateforme concerne son propre réglage facultatif.
- Présenter ces parcours comme **guides officiels manuels**. Ouvrir un guide, déclarer l'avoir suivi et constater un état fournisseur sont trois événements différents. Ici, aucune relecture fournisseur n'existe : une déclaration locale ne peut devenir « confirmé ».
- « Pas intéressé », exclusion d'une source recommandée, blocage d'interactions et suppression de suggestions de navigateur ont des portées différentes. Éviter un bouton générique « Bloqué » pour ces guides.
- Le guide Discover décrit aussi l'activation d'historiques pour personnaliser le service. Cette activation n'est pas un prérequis FIL CLAIR et ne doit pas devenir une étape d'accueil du produit.
- Ne pas imposer d'installation ni d'abonnement. Le parcours Safari documenté utilise le site et les commandes du navigateur ; aucun compte développeur Apple, achat d'app ou API payante n'est nécessaire pour proposer ce guide.

## Proposition machine-usable

Les clés d'action ci-dessous sont des identifiants **locaux de documentation**, jamais des noms d'endpoints. Les étapes ciblent les interfaces indiquées ; les langues, versions, comptes et régions peuvent modifier les menus. Le repli est toujours la page d'aide officielle, sans automatisation de l'interface.

```json
{
  "schemaVersion": 1,
  "checkedAt": "2026-10-28",
  "mode": "official-manual-guide",
  "automationEnabled": false,
  "providerApiOperational": false,
  "providerReadbackAvailable": false,
  "filClairAccountRequired": false,
  "extraSpendRequired": false,
  "completionEvidence": "user-declared-local-only",
  "platforms": [
    { "id": "google", "label": "Google · Discover et Recherche", "category": "recommendations-and-search" },
    { "id": "youtube", "label": "YouTube · recommandations", "category": "recommendations" },
    { "id": "safari", "label": "Safari · réglages du navigateur", "category": "browser-settings" }
  ],
  "controls": [
    {
      "id": "google-discover-topic",
      "platform": "google",
      "label": "Réduire un thème dans Discover",
      "category": "recommendation-feedback",
      "action": "not-interested-topic",
      "providerUiLabel": "Le thème [Thème] ne m'intéresse pas",
      "scope": "Thème proposé par une carte Discover de l'appli Google ou de google.com sur mobile.",
      "officialGuideUrl": "https://support.google.com/websearch/answer/2819496?hl=fr",
      "steps": ["Dans Discover, repérer une carte du thème concerné.", "Ouvrir son menu Plus et choisir le retour négatif sur ce thème."],
      "limits": ["Disponibilité variable selon pays et langue ; menus Google en évolution.", "Pas un blocage de personne, de site sur le Web ou de tous les résultats de recherche."],
      "providerAccount": "depends-on-provider-feature",
      "sourceIds": ["G1", "G2"]
    },
    {
      "id": "google-discover-source",
      "platform": "google",
      "label": "Écarter une source de Discover",
      "category": "recommendation-source-exclusion",
      "action": "dont-show-source",
      "providerUiLabel": "Ne pas afficher les contenus publiés par [Source]",
      "scope": "Source identifiée dans une carte Discover.",
      "officialGuideUrl": "https://support.google.com/websearch/answer/2819496?hl=fr",
      "steps": ["Dans Discover, ouvrir le menu d'une carte provenant de la source.", "Choisir l'exclusion de cette source si l'option apparaît."],
      "limits": ["Exclusion limitée à Discover ; aucun filtre général de Google Search ni du navigateur.", "La liste des centres d'intérêt masqués permet de rétablir les choix."],
      "providerAccount": "depends-on-provider-feature",
      "sourceIds": ["G1", "G2"]
    },
    {
      "id": "google-discover-off",
      "platform": "google",
      "label": "Désactiver Discover",
      "category": "feed-visibility",
      "action": "disable-discover",
      "scope": "Affichage du flux Discover sur la surface Google concernée, pas suppression de son historique.",
      "officialGuideUrl": "https://support.google.com/websearch/answer/9504726?hl=fr",
      "steps": ["Dans l'appli Google : profil, paramètres généraux, puis désactivation de Discover.", "Sur google.com mobile : paramètres complémentaires, puis désactivation de l'affichage de Discover sur l'accueil."],
      "limits": ["Option navigateur variable selon langue et pays ; ne promettre aucun effet sur toutes les surfaces Google ou Chrome."],
      "providerAccount": "depends-on-provider-feature",
      "sourceIds": ["G3"]
    },
    {
      "id": "google-search-personalization-off",
      "platform": "google",
      "label": "Réduire la personnalisation des services de recherche",
      "category": "personalization-setting",
      "action": "disable-search-personalized-recommendations",
      "scope": "Personnalisation des services de recherche Google couverts par ce réglage de compte.",
      "officialGuideUrl": "https://support.google.com/websearch/answer/17026260?hl=fr",
      "steps": ["Chez Google, ouvrir les données et la confidentialité du compte.", "Dans les paramètres de personnalisation, désactiver les recommandations personnalisées des services de recherche."],
      "limits": ["Déploiement progressif : certains comptes conservent les anciens réglages d'activité.", "Ne supprime pas l'historique, les éléments enregistrés ou toutes les suggestions ; le contexte peut encore influer sur les résultats.", "Aucune exclusion générale de sources, mots-clés ou opinions dans Google Search n'est établie par cette aide."],
      "providerAccount": "required-for-this-account-setting-only",
      "sourceIds": ["G4"]
    },
    {
      "id": "youtube-not-interested",
      "platform": "youtube",
      "label": "Signaler une recommandation non souhaitée",
      "category": "recommendation-feedback",
      "action": "not-interested",
      "providerUiLabel": "Pas intéressé",
      "scope": "Retour sur un contenu recommandé, notamment dans l'accueil, selon la surface disponible.",
      "officialGuideUrl": "https://support.google.com/youtube/answer/6342839?hl=fr",
      "steps": ["Sur un contenu recommandé, ouvrir le menu Plus.", "Choisir le retour de désintérêt ; une raison facultative peut être proposée."],
      "limits": ["Signal pour ajuster les recommandations, sans garantie d'exclusion globale ni blocage d'une chaîne.", "Certaines fonctions nécessitent une connexion chez YouTube."],
      "providerAccount": "depends-on-provider-feature",
      "sourceIds": ["Y1"]
    },
    {
      "id": "youtube-dont-recommend-channel",
      "platform": "youtube",
      "label": "Ne plus recommander une chaîne",
      "category": "recommendation-channel-feedback",
      "action": "dont-recommend-channel",
      "providerUiLabel": "Ne pas recommander la chaîne",
      "scope": "Recommandations de chaîne sur certaines pages, par exemple l'accueil ou À regarder ensuite.",
      "officialGuideUrl": "https://support.google.com/youtube/answer/6342839?hl=fr",
      "steps": ["Sur une recommandation de la chaîne, ouvrir le menu du contenu.", "Choisir l'arrêt des recommandations de cette chaîne si cette option apparaît."],
      "limits": ["Ce retour n'est ni un blocage d'interactions ni une suppression de la chaîne dans toutes les recherches ou liens directs.", "Le choix concernant uniquement les posts d'une chaîne a une portée distincte.", "L'effacement des retours dans Mon activité concerne l'ensemble des retours concernés, pas un déblocage individuel garanti."],
      "providerAccount": "depends-on-provider-feature",
      "sourceIds": ["Y1", "Y2"]
    },
    {
      "id": "safari-search-engine-suggestions-off",
      "platform": "safari",
      "label": "Masquer les termes de recherche suggérés",
      "category": "search-suggestions-setting",
      "action": "disable-search-engine-suggestions",
      "providerUiLabel": "Suggestions moteur de rech.",
      "scope": "Suggestions du moteur sélectionné pendant la saisie dans Safari sur iPhone.",
      "officialGuideUrl": "https://support.apple.com/fr-fr/guide/iphone/iph6297b394b/ios",
      "steps": ["Ouvrir les réglages de l'iPhone, puis Apps et Safari.", "Désactiver les suggestions du moteur de recherche."],
      "limits": ["Réglage de navigateur, sans filtre sur les résultats du moteur et sans effet établi sur Discover ou YouTube.", "Les versions plus anciennes d'iOS peuvent présenter Safari directement dans Réglages."],
      "providerAccount": "not-required-for-local-setting",
      "sourceIds": ["A1"]
    },
    {
      "id": "safari-start-page-suggestions-off",
      "platform": "safari",
      "label": "Choisir les sections de la page de démarrage",
      "category": "start-page-setting",
      "action": "hide-start-page-suggestions",
      "providerUiLabel": "Suggestions",
      "scope": "Section de la page de démarrage Safari sur iPhone : sites fréquents et liens issus d'autres apps ou partagés.",
      "officialGuideUrl": "https://support.apple.com/fr-fr/guide/iphone/iphb3100d149/ios",
      "steps": ["Dans Safari, ouvrir un nouvel onglet.", "En bas de la page de démarrage, ouvrir Modifier.", "Désélectionner la section de suggestions souhaitée."],
      "limits": ["Ce n'est pas un flux d'actualités Discover ni un contrôle des contenus d'Apple News.", "Les intitulés des sections dépendent d'iOS ; la synchronisation des réglages entre appareils est facultative et distincte."],
      "providerAccount": "not-required-for-local-setting",
      "sourceIds": ["A2"]
    },
    {
      "id": "safari-mac-suggestions-off",
      "platform": "safari",
      "label": "Désactiver les suggestions Safari sur Mac",
      "category": "search-suggestions-setting",
      "action": "disable-safari-suggestions-mac",
      "providerUiLabel": "Inclure les suggestions Safari",
      "scope": "Suggestions Apple dans le champ de recherche intelligente de Safari sur Mac.",
      "officialGuideUrl": "https://support.apple.com/fr-fr/guide/safari/sfria1042d31/mac",
      "steps": ["Dans le menu Safari, ouvrir Réglages, puis Recherche.", "Désactiver les suggestions Safari ; le réglage des suggestions du moteur est séparé."],
      "limits": ["Parcours Mac uniquement ; ne pas copier son chemin de menus sur iPhone.", "Aucun blocage de site, de sujet ou de compte social."],
      "providerAccount": "not-required-for-local-setting",
      "sourceIds": ["A3"]
    }
  ]
}
```

## Distinctions Apple et YouTube à conserver

**Blocage YouTube.** L'aide de blocage [Y2] couvre les messages de chat, commentaires et mentions ; elle distingue aussi le masquage des spectateurs sur sa propre chaîne. Ce contrôle ne justifie pas un libellé promettant de bannir une chaîne de toutes les vidéos vues. Le catalogue public Data API [Y3] a été consulté : aucun endpoint de ces retours de recommandation n'a été établi dans cette recherche. Cela ne constitue pas une preuve d'inexistence de toute API future ou privée ; aucun appel opérationnel n'est proposé.

**Apple News est une autre app.** Apple documente [A4] un blocage de média ou rubrique depuis la recherche News, puis son menu d'actions. La liste des éléments bloqués permet le retour arrière. Un titre d'un média bloqué peut encore apparaître dans la sélection éditoriale commune. Le guide [A5] propose aussi un retour pour recevoir moins d'articles similaires et une restriction du flux Today aux médias suivis. Ces réglages restent propres à News, dont la disponibilité dépend du pays [A8] ; ne pas les ranger sous `platform: "safari"`, ni rendre News ou News+ nécessaire à FIL CLAIR.

**Siri et Recherche.** Les suggestions système se règlent séparément [A6]. La documentation courante propose une rubrique de suggestions et des restrictions d'accès aux apps ; les anciens systèmes ont d'autres chemins. Les moteurs de recherche choisis dans Safari fournissent leurs propres suggestions pendant la saisie [A7]. Éviter donc une commande unique « désactiver les recommandations Apple ».

## Accueil iPhone, stockage et repli accessible

Ces propositions produit sont des déductions des sources, pas une recette validée de FIL CLAIR.

1. **Installation facultative.** Le guide Apple [I1] passe par Safari, le site, le partage, puis l'ajout à l'accueil. Le mode app web doit être activé lorsqu'il est proposé. Une commande absente de la feuille de partage peut être ajoutée dans la personnalisation des actions. Fournir également un parcours « continuer dans le navigateur » ; l'installation ne prouve aucun enregistrement de données.
2. **Mode privé.** L'aide Apple [I2] explique le changement de mode et l'absence d'historique conservé. WebKit [I3] décrit un état de navigation privé éphémère : ne promettre ni sauvegarde durable ni récupération après fermeture. Prévoir une explication textuelle générale et un export ; ne pas ajouter de détection intrusive du mode privé.
3. **Stockage local.** WebKit [I4] documente des quotas, une conservation ordinaire sans garantie et une éviction possible. Le mode app web reste soumis à une politique de stockage ; une demande de persistance utilise des heuristiques. Traiter les erreurs d'écriture, relire l'enregistrement avant d'annoncer sa réussite et conserver une voie d'export. Un changement d'origine, une réinstallation ou une suppression ne doit jamais être présenté comme une migration garantie.
4. **Effacement.** Apple [I5] documente les commandes supprimant les données de sites et précise que le blocage de tous les cookies supprime les données existantes. Distinguer l'effacement local FIL CLAIR, les fichiers exportés et les réglages chez un fournisseur ; seul le premier relève du produit.
5. **Sauvegarde.** L'article iCloud [I6] décrit la sauvegarde des apps téléchargées et la synchronisation iCloud, sans valider une restauration précise de l'état navigateur de cette PWA. Ne pas promettre « sauvegardé dans iCloud ». L'export local explicite et son import vérifié restent une proposition de repli sans compte Apple ; une sauvegarde distante choisie par l'utilisateur reste facultative.
6. **VoiceOver.** Apple [I7] documente la navigation Safari au rotor par titres, liens et champs, puis l'activation par double toucher. Proposer des listes d'étapes textuelles, des liens au nom explicite, un contrôle de retour identifiable et un message d'échec accessible pour l'import ou le stockage. Ces choix demandent une recette VoiceOver sur appareil ; aucune conformité n'est déduite de la lecture de l'aide.

## Sources et méthode de preuve

Méthode : recherche Web `system1` sur domaines officiels ; ouverture des URL ci-dessous ; lecture des corps de page et recherche ciblée des sections pertinentes. L'extraction textuelle, et non un simple extrait de résultat de recherche, a servi aux constats. Aucun compte n'a été ouvert. Les pages Apple dynamiques affichaient iOS 27 au moment de la consultation ; sélectionner la version de l'appareil dans l'aide si nécessaire. Google avertit explicitement d'une transition de paramètres. Les traductions Google présentent parfois des incohérences : reprendre le sens du contrôle, conserver le lien et éviter des sélecteurs UI figés.

Toutes les sources ont été accédées le **2026-10-28**. Les références ci-dessous sont des URL stables d'aide ou de documentation ; elles ne sont pas des routes d'action.

| ID | Source primaire et section effectivement lue |
| --- | --- |
| G1 | [Google Discover, Android](https://support.google.com/websearch/answer/2819496?hl=fr) — choix de thèmes/sources, rétablissement, avertissement de mise à jour |
| G2 | [Google Discover, iPhone/iPad](https://support.google.com/websearch/answer/2819496?hl=fr&co=GENIE.Platform%3DiOS) — mêmes contrôles sur carte, menus iOS |
| G3 | [Désactiver Discover](https://support.google.com/websearch/answer/9504726?hl=fr&co=GENIE.Platform%3DiOS) — appli et navigateur mobile |
| G4 | [Recommandations personnalisées des services de recherche](https://support.google.com/websearch/answer/17026260?hl=fr) — désactivation, limites, déploiement progressif |
| Y1 | [Recommandations et recherche YouTube](https://support.google.com/youtube/answer/6342839?hl=fr) — retour sur contenu, chaîne, effacement des retours |
| Y2 | [Blocage de chaînes YouTube](https://support.google.com/youtube/answer/7663906?hl=en) — interactions, masquage de spectateurs, distinction avec recommandations |
| Y3 | [Catalogue REST public YouTube Data API](https://developers.google.com/youtube/data/reference/rest) — ressources et méthodes publiques ; aucun appel effectué |
| A1 | [Recherche Safari sur iPhone](https://support.apple.com/fr-fr/guide/iphone/iph6297b394b/ios) — suggestions du moteur |
| A2 | [Réglages Safari sur iPhone](https://support.apple.com/fr-fr/guide/iphone/iphb3100d149/ios) — options de page de démarrage |
| A3 | [Réglages Recherche Safari sur Mac](https://support.apple.com/fr-fr/guide/safari/sfria1042d31/mac) — deux types de suggestions distincts |
| A4 | [Bloquer et débloquer dans Apple News](https://support.apple.com/en-ca/101574) — média/rubrique, retour arrière, exception éditoriale ; article daté du 2026-04-20 |
| A5 | [Flux Today dans News sur iPhone](https://support.apple.com/fr-fr/guide/iphone/iph5b557ed3d/ios) — moins d'articles similaires, restriction aux médias suivis |
| A6 | [Réglages Siri sur iPhone](https://support.apple.com/fr-fr/guide/iphone/iphc28624b81abc/ios) — suggestions et apps exclues |
| A7 | [Apple : Recherches et confidentialité](https://www.apple.com/legal/privacy/data/fr/siri-suggestions-search/) — suggestions du moteur dans Safari |
| A8 | [Apple : disponibilité de News et News+](https://support.apple.com/guide/iphone/subscribe-to-apple-news-iph6a8e168cb/ios) — note sur les pays et régions, sans abonnement effectué |
| I1 | [Transformer un site en app Safari sur iPhone](https://support.apple.com/fr-fr/guide/iphone/iphea86e5236/ios) — feuille de partage et ajout à l'accueil |
| I2 | [Navigation privée sur iPhone](https://support.apple.com/fr-fr/105030) — activation, désactivation, limites d'historique |
| I3 | [WebKit Tracking Prevention](https://webkit.org/tracking-prevention/) — section Private Browsing Mode |
| I4 | [WebKit : politique de stockage](https://webkit.org/blog/14403/updates-to-storage-policy/) — quotas, éviction, persistance ; article du 2023-08-10, règles annoncées à partir de Safari/iOS 17 |
| I5 | [Effacer les données Safari](https://support.apple.com/fr-fr/105082) — données de sites et effet du blocage intégral des cookies |
| I6 | [Éléments sauvegardés par iCloud](https://support.apple.com/fr-fr/108770) — portée générique de sauvegarde ; aucune garantie PWA déduite |
| I7 | [VoiceOver dans les apps iPhone](https://support.apple.com/fr-fr/guide/iphone/iphe4ee74be8/ios) — section de navigation Safari |

La version française courte `https://support.apple.com/fr-fr/101574` n'a pas été récupérable par l'outil pendant cette recherche ; la page officielle anglaise canadienne A4 a été ouverte et son texte lu. Aucun contenu communautaire ou résultat d'un domaine miroir n'a servi de preuve.
