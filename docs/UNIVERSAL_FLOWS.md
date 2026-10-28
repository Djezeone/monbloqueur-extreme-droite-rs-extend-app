# FIL CLAIR V2 — contrat universel des flux

État de cette version : carnet local et guides manuels ; aucune connexion sociale, synchronisation ou action API activée. Les huit lots et portes A SAFE → B CONNECT → C PUBLIC restent applicables. Le [journal de preuves](evidence/2026-10-28-universal-v2.md) fait foi pour les tests réellement exécutés.

## Architecture

`pwa/platforms.js` est un catalogue statique immuable : modules de services, description courte, contrôles et catégories, portée, mode, étapes, limites et source officielle. `pwa/flow-core.js` valide et transforme des préférences sans réseau ni stockage parallèle. `pwa/flows.js` rend l’onboarding et le carnet, puis appelle le `persist` commun de l’application. `core.parseBackup` valide l’extension optionnelle `flows` du snapshot existant. Le service worker précache ces trois modules publics ; il ne cache aucune préférence ni réponse fournisseur.

Ajouter une plateforme consiste à ajouter un module déclaratif au catalogue avec contrôles documentés et identifiants stables, puis ses tests et sa preuve de portée. Un contrôle guide ne devient pas une API en changeant une étiquette : transport/authentification, consentement lié à la cible, scopes, quotas, révocation et lecture indépendante doivent être qualifiés séparément. Les adaptateurs Mastodon/Bluesky existants restent isolés et inactifs ; leur contrat de preuve ne se mélange pas aux déclarations du carnet.

## Données et transitions

Snapshot `fil-clair-v1`, `version:1`, propriété facultative :
```json
{"flows":{"version":1,"setupComplete":true,"platforms":[],"categories":["sources"],"items":[{"id":"flow-example","platform":"local","control":"source-avoid","target":"Source synthétique","status":"local","createdAt":1793150000000,"updatedAt":1793150000000}]}}
```
Cet extrait décrit l’extension ; une sauvegarde complète comporte aussi les listes, décisions et historique habituels. Anciennes sauvegardes sans `flows` conservées, sans migration destructive. Champs inconnus du carnet et des fiches, faux statuts API, dates invalides, doublons, identifiants/contrôles inconnus et dépassements sont refusés atomiquement. Maximum 500 fiches, cible de 1 à 200 caractères sur une ligne et snapshot complet de 10 Mo en UTF-8.

| Mode | État initial | État après choix explicite | Effet fournisseur |
| --- | --- | --- | --- |
| Local | `local` | Retrait de la fiche | Aucun. |
| Guide | `planned` | `declared` après confirmation personnelle | Manipulation effectuée par la personne ; FIL CLAIR ne la vérifie pas. |
| Guide déjà déclaré | `declared` | `planned` ou retrait | Aucun retour arrière distant. |
| API | Hors de ce carnet | Interdit à l’import | Adaptateurs inactifs, qualification distincte. |

La désélection d’un service ou d’une catégorie conserve les fiches et leurs déclarations. Aucun historique parallèle des préférences n’est conservé après leur retrait. Les cibles sont du texte, rendues par `textContent`, jamais des destinations de navigation ou paramètres d’URL. La sauvegarde complète et l’effacement global couvrent les anciennes listes et le nouveau carnet sous le même verrou. Un onglet périmé refuse l’écrasement. L’espace temporaire consenti utilise le même modèle en mémoire, sans accès d’écriture au stockage ; son export est distinct de la source brute de récupération.

Le remplacement réussi de l’espace remet aussi à zéro les brouillons/filtres, sélections dépendantes et anciens nœuds de profils/historique. Un refus de quota, conflit ou annulation ne passe pas par cette remise à zéro. La confirmation nomme les listes, Mes flux, déclarations et historique remplacés ; elle distingue l’espace en mémoire des données persistantes et signale une sauvegarde historique sans flux.

## Compatibilité : cible et limites

| Système / navigateur cible | Preuve disponible | Installation et réserves |
| --- | --- | --- |
| Android Chrome, Samsung Internet, Firefox et compatibles | Moteurs + profil Android émulé selon journal ; aucune recette des marques sur téléphone physique | Commande propre au navigateur/version ; raccourci ou usage en onglet si absente. Aucun Chrome obligatoire. |
| iPhone Safari et autres navigateurs compatibles | WebKit automatisé + profil iPhone émulé selon journal | Partage/ajout à l’accueil à qualifier physiquement ; WebKit Playwright n’est pas Safari commercial. |
| iPad Safari et autres navigateurs compatibles | Profil iPad émulé selon journal | Recette tactile, clavier, Split View, fichiers, installation et VoiceOver physique ouverte. |
| macOS Safari, Chrome, Firefox | Aucun OS Mac exécuté ici | Safari : app au Dock selon version ; données d’app web séparées. Firefox : ne pas déduire l’installation Windows pour Mac. |
| Windows Chrome, Edge, Firefox | Aucun OS Windows ni navigateur commercial de ces marques exécuté ici | Fonction d’app web selon version ; Firefox Windows dispose d’un parcours officiel récent, pas de promesse pour tout Firefox. |
| Linux navigateurs modernes | Tests de moteurs sur hôte Linux uniquement | Pas de recette de chaque distribution/marque ; navigateur et favori restent le repli. |

Installation, réseau, stockage et fonctions d’accessibilité ont chacun leur recette. Les sources primaires et scénarios détaillés figurent dans le [protocole QA](research/2026-10-28-universal-qa-protocol.md). En mode privé ou après effacement/éviction, aucune persistance n’est garantie. Sans stockage ou Web Locks, lecture/export et espace mémoire consenti ; sans service worker, usage en ligne, pas de promesse offline. Sans JavaScript, la notice statique reste accessible mais le carnet n’est pas utilisable. Aucun compte cloud ne récupère les données perdues.

## Registre des capacités

Les liens et étapes ont fait l’objet d’une recherche documentaire, sans connexion ni manipulation sociale réelle. Certains chemins sont indicatifs, certaines pages sont des annonces historiques : les limites du catalogue restent affichées. Une disponibilité par compte ou pays n’est pas présumée. Apple News et Siri, étudiés séparément dans la recherche, ne sont pas assimilés à Safari et ne sont pas des modules d’exécution.

Sources et qualification : [Google/YouTube/Apple](research/2026-10-28-google-apple.md), [autres réseaux](research/2026-10-28-social-controls.md), [API inactives](OFFICIAL_CONNECTORS.md). Aucune absence universelle d’API n’est déduite d’un accès non qualifié : X et Reddit ont notamment des capacités officielles dont les conditions d’accès ne sont pas acquises ici.

Les contrôles effectivement embarqués sont listés ci-dessous ; les propositions supplémentaires des recherches ne sont pas des fonctions livrées.

| Module | Contrôles embarqués | Mode |
| --- | --- | --- |
| Local / autres services | Compte à ignorer ; source à éviter ; sujet à moins voir ; sujet à voir davantage ; préférence de recommandation | 5 notes locales, aucun effet fournisseur |
| Google Discover | Désintérêt pour un thème ; exclusion de source ; retrait d’exclusion ; désactivation de Discover | 4 guides manuels |
| Recherche Google | Personnalisation des services de recherche | 1 guide manuel |
| YouTube | Pas intéressé ; ne pas recommander la chaîne ; gestion des retours | 3 guides manuels |
| X | Sourdine ; blocage ; déblocage ; mots masqués | 4 guides manuels |
| Facebook | Pause d’une source 30 jours ; pas intéressé | 2 guides manuels |
| Instagram | Pas intéressé ; mots des suggestions ; réinitialisation des recommandations | 3 guides manuels |
| Threads | Désabonnement ; mots des réponses ; fil des abonnements | 3 guides manuels |
| TikTok | Désabonnement ; pas intéressé ; sujets de For You | 3 guides manuels |
| Bluesky | Sourdine ; blocage public ; choix des fils | 3 guides manuels, API inactive |
| Mastodon | Sourdine ; blocage ; filtres de mots | 3 guides manuels, API inactive |
| Reddit | Communauté masquée ; suggestions d’accueil ; blocage de compte | 3 guides manuels |
| LinkedIn | Désabonnement de source ; pas intéressé ; blocage de membre | 3 guides manuels |
| Safari | Suggestions moteur iPhone ; sections d’accueil iPhone ; suggestions Safari Mac | 3 guides manuels, aucun flux Discover présumé |

Total : **14 modules, 43 contrôles (5 notes locales et 38 guides manuels)**. Les identifiants et portées détaillées du [catalogue embarqué](../pwa/platforms.js) constituent le contrat de chaque contrôle. Aucune ligne de ce tableau ne revendique une manipulation réelle chez le fournisseur.
