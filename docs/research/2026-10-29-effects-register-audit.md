# FIL CLAIR V3 — audit du registre des effets documentés

Note de conception V3, fichier daté du **2026-10-29** ; lectures et recherches effectivement effectuées le **2026-10-28**. Aucune vérification du 29 octobre n'est revendiquée. Référence V2 transmise pour cette mission : `51abcd35adefb757cc4f8831d23131a465b9f52a`.

Périmètre exact : les **14 modules et 43 contrôles** de [`pwa/platforms.js`](../../pwa/platforms.js), soit 5 notes locales et 38 guides. Cette note ne modifie pas le catalogue, ne crée pas de transport et ne rend aucun connecteur opérationnel. Aucun compte, consentement OAuth, appel authentifié, achat, action sociale, signalement, fusion ou publication n'a été effectué.

Les preuves du 28 octobre sont **réutilisées**, sans recommencer leurs validations : [Google/YouTube/Apple](2026-10-28-google-apple.md), [contrôles sociaux](2026-10-28-social-controls.md), [contrats des connecteurs inactifs](../OFFICIAL_CONNECTORS.md), [contrat des flux](../UNIVERSAL_FLOWS.md). Le [journal V2](../evidence/2026-10-28-universal-v2.md) atteste les tests locaux de cette version ; il ne démontre aucun effet chez les fournisseurs. Les compléments ci-dessous concernent les lacunes de révocation, de permissions et de retour arrière. Les échecs Meta HTTP 429 restent des échecs documentaires hérités, sans nouvelle qualification de leur contenu.

## Sens du registre et niveaux de preuve

Un effet personnel décrit une relation, une surface ou une préférence du compte. Un effet de classement décrit l'usage déclaré d'un signal par le fournisseur. Ni l'un ni l'autre ne fournit ici une mesure de l'algorithme : **aucun poids, pourcentage de réduction, délai universel ou exclusion sémantique n'est promis**. Une durée explicitement documentée, comme les 30 jours de Snooze, reste une propriété de ce réglage, pas un poids de recommandation. Cette règle de présentation découle des portées limitées conservées dans les deux recherches du 28/10.

Quatre retraits doivent rester séparés, conformément au [contrat V2](../UNIVERSAL_FLOWS.md) et aux sources de chaque service :

| Retrait | Ce que FIL CLAIR peut dire dans cette livraison |
| --- | --- |
| Fiche locale | La note ou déclaration est retirée du carnet ; aucun réglage fournisseur n'est annulé. |
| Réglage ou relation chez le fournisseur | Un guide peut décrire une commande inverse documentée ; sa présence et son exécution ne sont pas vérifiées pour le compte de la personne. |
| Accès d'une application | La révocation OAuth concerne les autorisations/tokens ; elle ne constitue pas un déblocage, un réabonnement ou une remise à zéro des recommandations. Les sources de révocation ci-dessous ne documentent pas de telles restaurations. |
| Historique, classement ou diffusion passée | Aucune restauration de l'état antérieur, de toutes les recommandations ou de toutes les copies n'est établie par cette recherche. Ne pas appeler cela « annulé ». |

Codes employés dans les matrices : **D28** = texte officiel lu dans la preuve du 28/10 ; **I28** = contenu officiel indexé, avec limites de récupération déjà consignées ; **A28** = annonce officielle, souvent historique ; **C28** = contrat local/simulation de connecteur du 28/10 ; **D+** = complément documentaire officiel lu pour cet audit, le 28/10 ; **U** = affirmation non établie dans le périmètre. Ces codes qualifient une affirmation, sans score numérique. Disponibilité par compte, exécution réelle et effet algorithmique mesuré restent **U** pour tous les guides. Une absence de capacité qualifiée ne démontre jamais l'absence de toute API.

## Champs recommandés

Ces champs sont des recommandations de modèle, pas des propriétés déjà livrées. Garder le `scope` textuel actuel pour l'effet humain ; réserver `scopes` aux noms exacts des autorisations API, afin de ne pas confondre surface et permission.

| Champ | Contenu recommandé et règle de lecture |
| --- | --- |
| `scopes` | Objet séparant `documentedRequired` (liste exacte par opération, ou `null` si inconnue), `requestedByFilClair: []` et `granted: null`. Un guide ne demande aucun scope. Une liste vide ne doit pas signifier « API possible sans permission ». |
| `reversibility` | Objet avec `localRemoval`, `providerUndo`, `restoresPriorState`, `sideEffects` et références. Valeurs explicites : réglage modifiable, suppression groupée, nouvelle action nécessaire, retour non établi. Éviter un booléen unique « réversible ». |
| `officialApi` | `status` parmi `not-applicable`, `not-qualified`, `documented-not-integrated`, `inactive-local-contract` ; `operations`, `sourceIds`, `operational: false`. L'existence d'une API, un contrat simulé et une opération autorisée sont trois faits distincts. |
| `permissions` | Compte fournisseur nécessaire ou conditionnel, éligibilité de l'application, approbation, conditions d'accès et consentement. Les droits de publier/modérer ne prouvent pas un droit de gérer un fil personnel. Aucun accès commercial acquis ici. |
| `limitations` | Surfaces exclues, disponibilité, exceptions de visibilité, propagation, opérations groupées et limites de preuve, avec source pour chaque portée. |
| `confidence` | Objet par affirmation : `effect`, `providerUndo`, `api`, `availability`, `runtime`. Employer `documented`, `announcement`, `indexed`, `unverified` ; ne pas convertir une bonne preuve documentaire en succès fonctionnel. |
| `verifiedAt` | Date de lecture documentaire **par source/affirmation**, avec `provenance: inherited-2026-10-28` ou `targeted-complement`. Ne pas remplacer toutes les dates par celle du fichier ou de son import. |
| `evidence` / doc vs test | `kind: official-documentation`, `official-announcement`, `local-test` ou `simulated-provider-test`, plus URL/chemin et date. `providerTestedAt: null`, `providerReadbackAvailable: false`, `userCompletion: declared-only` dans le carnet actuel. |
| `effectType` | Distinguer `local-note`, `relationship`, `surface-filter`, `ranking-feedback`, `feed-choice`, `personalization-setting`, `reset` et `browser-setting`. Un contrôle peut combiner plusieurs types sans leur attribuer une intensité. |

Une date documentaire commune de 2026-10-28 est justifiée ici ; **aucune date de test fournisseur ne l'est**. Pour le local, réutiliser le journal V2, sans relancer les tests inchangés pour donner artificiellement une preuve V3. Pour Bluesky et Mastodon, les tests simulés restent liés au contrat C28 : ils n'autorisent ni OAuth réel, ni résultat fournisseur, ni activation B CONNECT.

## Matrice des effets et du retour arrière — 43 contrôles

Dans cette matrice, le préfixe est l'identifiant exact du module ; les suffixes sont ceux du catalogue livré. Une commande inverse simplement envisageable mais non démontrée est marquée **U**, au lieu d'être inventée. Le retrait d'une fiche n'exécute jamais cette commande.

| Module / contrôles | Effet documenté à présenter | Retour arrière et limites | Confiance / sources |
| --- | --- | --- | --- |
| `local` · `account-ignore`, `source-avoid`, `topic-less`, `topic-more`, `recommendation-note` (5) | Notes personnelles sur l'appareil ; aucun filtrage chez un service. | Retirer oublie la fiche dans FIL CLAIR. Les exports déjà créés sont des fichiers distincts. Aucun réglage ou accès fournisseur à révoquer. | Contrat local et tests V2 hérités : [flux](../UNIVERSAL_FLOWS.md), [journal](../evidence/2026-10-28-universal-v2.md). Pas de source fournisseur applicable. |
| `discover.not-interested` | Retour sur un thème de Discover. | La gestion des centres d'intérêt masqués permet de revoir les choix ; vérifier qu'il s'agit bien d'un thème. Aucun effacement de l'apprentissage ou filtrage global de Search établi. | D28 [G1][G1]. |
| `discover.hide-source` | Exclusion d'une source sur Discover. | La source peut être réautorisée dans les intérêts masqués. Réautoriser ne garantit ni sa réapparition ni le classement antérieur ; cela ne bloque pas le site sur le Web. | D28 [G1][G1]. |
| `discover.restore-source` | Retire un choix de masquage chez Google. | C'est déjà une action inverse fournisseur ; supprimer sa fiche ne réapplique pas le masquage. Aucune garantie de recommandation de la source. | D28 [G1][G1]. |
| `discover.disable` | Masque Discover sur la surface réglée. | Réglage d'affichage modifiable ; aucune suppression d'historique ni extinction de tous les services Google. | D28 [G3][G3]. |
| `google-search.personalization` | Gère la personnalisation des services de recherche couverts. | Modification du réglage de compte ; pas de restauration des résultats antérieurs ni de suppression automatique de l'historique. Déploiement progressif et influence possible du contexte. | D28 [G4][G4]. |
| `youtube.not-interested` | Signal sur une recommandation pour ajuster les recommandations. | Gestion/effacement des retours dans Mon activité ; ne pas promettre un retrait individuel persistant ni une exclusion de sujet. | D28 [Y1][Y1]. |
| `youtube.dont-recommend-channel` | Retour sur les recommandations de cette chaîne, sur les surfaces prévues. | L'aide décrit l'effacement de l'ensemble des retours concernés ; ne pas étiqueter ce parcours « débloquer cette chaîne ». Recherche, liens directs et interactions ont d'autres règles. | D28 [Y1][Y1]. |
| `youtube.feedback-settings` | Guide de gestion de l'historique et des retours. | Peut conduire à une suppression groupée : lire le périmètre chez Google avant confirmation. Aucune restauration du profil de recommandation antérieur établie. | D28 [Y1][Y1]. |
| `x.mute` | Masque les publications du compte dans le fil sans désabonner. | Retrait de sourdine documenté ; des DM, mentions et réponses peuvent subsister selon la relation. Pas de réinitialisation du classement. | D28 [X1][X1]. |
| `x.block` | Limite les interactions et rompt les abonnements réciproques. | Déblocage possible ; abonnements non rétablis automatiquement. Les publications publiques restent visibles au compte bloqué : aucune confidentialité générale. | D28 [X2][X2]. |
| `x.unblock` | Retire le blocage chez X. | Ne refait pas les abonnements et ne restaure pas une relation ou un fil antérieur. Un nouveau blocage serait une nouvelle action. | D28 [X2][X2]. |
| `x.keywords` | Masquage de termes sur l'accueil et les notifications configurés. | Terme, durée et surfaces peuvent être modifiés ou retirés. Ne couvre pas toute la recherche ; masquer `@nom` ne met pas le compte en sourdine. | D28 [X3][X3]. |
| `facebook.snooze` | Pause des contenus d'une source dans le fil pendant 30 jours. | Annonce d'un retrait possible avant échéance ; ne pas promettre un chemin contemporain testé ni la couverture des autres surfaces. | A28 [F2][F2]. |
| `facebook.not-interested` | Signal destiné au classement du fil et aux contenus similaires. | Inversion individuelle et retour au classement antérieur : **U**. Les anciens noms « Voir moins » et les nouveaux libellés ne prouvent pas une exclusion définitive. | A28/I28 [F3][F3] ; réserves Meta conservées. |
| `instagram.not-interested` | Signal de réduction des recommandations similaires. | Retrait individuel durable et récupération du classement antérieur : **U** dans les sources accessibles. Pas de blocage de personne ou de sujet. | A28/I28 [I2][I2]. |
| `instagram.keywords` | Écarte des suggestions selon les mots des légendes et hashtags. | Le guide prévoit la gestion des termes ; une recette actuelle de leur retrait reste non vérifiée. Aucun filtrage exhaustif des images, audio ou sens, ni de tout contenu suivi. | A28/I28 [I2][I2]. |
| `instagram.reset` | Réinitialise les suggestions Explore, Reels et Feed, puis elles se personnalisent à nouveau. | **Aucune restauration de l'état précédant le reset n'est établie**. Ne pas présenter un bouton « annuler le reset » ni un désabonnement global. | A28/I28 [I4][I4]. |
| `threads.unfollow` | Retire un abonnement. | Se réabonner serait une nouvelle action ; rétablissement de l'état de recommandation antérieur : **U**. Le profil peut rester recommandé dans For You. | D28/A28 [H1][H1]. |
| `threads.keywords` | Filtre les réponses à ses propres publications selon les termes choisis. | Gestion des termes guidée, chemin contemporain indicatif. Couverture générale de For You, recherche et restauration historique : **U**. | D28/A28 [H1][H1]. |
| `threads.following` | Choisit le fil chronologique des profils suivis. | Choisir un autre fil est un changement de vue ; ne supprime pas les recommandations des autres fils. Persistance du choix à vérifier selon version. | D28/A28 [H1][H1], [H2][H2]. |
| `tiktok.unfollow` | Retire un abonnement et son apport au fil des comptes suivis. | Se réabonner serait une nouvelle action. Exclusion de For You ou retour au classement précédent : **U**. | I28 [T2][T2]. |
| `tiktok.not-interested` | Demande moins de contenus similaires. | Retrait individuel de ce signal et restauration du classement : **U**. Ne pas confondre le signal avec une fonction distincte de masquage de créateur. | I28 [T2][T2], [T4][T4]. |
| `tiktok.topics` | Ajuste les proportions de sujets de For You. | Curseurs modifiables ; aucun instantané antérieur restaurable ni délai universel établi. Following, profil et messagerie ne sont pas concernés. | I28 [T5][T5]. |
| `bluesky.mute` | Masque les publications principales et notifications ; certaines réponses restent ouvrables sous avertissement. | Le catalogue reste un guide. Pas de garantie d'exclusion de toutes les réponses ni de restauration du fil antérieur. Retrait réel de sourdine non testé. | Source du catalogue héritée [B1][B1] ; I28 ciblé sur la différence publication/réponse. |
| `bluesky.block` | Restreint les interactions ; l'enregistrement de blocage est public dans AT Protocol. | Le contrat inactif décrit la suppression des records de blocage pour ce DID, puis relecture. Cela ne prouve ni effacement de copies publiques, ni oubli par des tiers, ni propagation immédiate dans tous les AppViews. Restauration des abonnements : **U**. | C28 [B2][B2], [B3][B3] et [contrat](../OFFICIAL_CONNECTORS.md). Aucun connecteur activé. |
| `bluesky.feeds` | Choisit des fils issus de générateurs distincts. | Ajouter/retirer un fil ne garantit pas un filtrage identique des autres générateurs, ni une suppression de leurs données. Aucun effet global sur le protocole. | Source du catalogue héritée [B1][B1] ; disponibilité et comportement réels **U**. |
| `mastodon.mute` | Masque le compte sur les surfaces de l'instance ; notifications et durée sont séparables. | Une sourdine peut expirer ou être retirée. Le comportement du client et de la version doit être qualifié ; aucun classement mondial n'est décrit. | D+ [N-MOD][N-MOD] ; API de retrait documentée déjà citée C28 [M1][M1]. |
| `mastodon.block` | Masque le compte et retire les abonnements réciproques selon Mastodon. | Déblocage documenté. Les exemples d'API ne rétablissent pas les abonnements ; ne pas promettre une restauration automatique. Confirmation limitée à la relation relue sur l'instance, sans propagation immédiate des fils. | D+ [N-MOD][N-MOD] ; C28 [M1][M1] et [contrat](../OFFICIAL_CONNECTORS.md). |
| `mastodon.keywords` | Filtre mots/expressions dans les contextes configurés. | Filtres modifiables/supprimables. La doc distingue le filtrage client et « Hide completely », où des contenus ne sont pas livrés à l'accueil/aux notifications : **désactiver ne garantit pas de reconstituer tous les contenus passés**. Vérifier version et effet exact. | D+ [N-MOD][N-MOD] ; pas de test d'instance. |
| `reddit.mute-community` | Exclut la communauté de l'accueil, Popular et des notifications documentées. | Liste modifiable ; réactiver les notifications peut annuler le masquage. Recherche/visite directe distinctes. Ne pas promettre que le retrait restitue les éléments précédemment non montrés. | I28 [R1][R1]. |
| `reddit.home-recommendations` | Désactive les recommandations du fil d'accueil. | Réglage modifiable ; publicités et autres surfaces non couvertes. Aucune remise à zéro du profil de recommandation établie. | I28 [R2][R2], article mis à jour le 2026-10-05. |
| `reddit.block` | Limite les interactions et masque des contenus, avec exceptions. | Déblocage dans les réglages fournisseur ; aucune restauration générale des interactions ou du fil promise. Commentaires repliés, modération, groupes et publicités ont des exceptions. | I28 [R3][R3], [R4][R4]. |
| `linkedin.unfollow` | Retire le suivi d'une source dans le fil. | Se réabonner serait une nouvelle action ; aucune restitution du classement antérieur établie. Ce n'est pas un blocage de membre. | I28 [L1][L1]. |
| `linkedin.not-interested` | Retire une publication et signale une préférence de recommandation. | Retrait durable individuel de ce signal : **U**. Cacher une publication, exprimer un désintérêt et cacher l'auteur sont des choix distincts. | I28 [L2][L2]. |
| `linkedin.block` | Restreint la relation et la visibilité selon les règles LinkedIn. | Déblocage avec délai de 48 h avant nouveau blocage ; certaines recommandations de profil perdues ne sont pas restaurées. Des exceptions de notification/visibilité existent. | I28 [L3][L3]. |
| `safari.search-suggestions` | Réglage des suggestions du moteur pendant la saisie sur iPhone. | Réglage modifiable ; aucun filtre des résultats ou de Discover/YouTube. Aucun compte Apple requis pour ce réglage local. | D28 [A1][A1]. |
| `safari.start-page` | Choisit les sections de la page de démarrage iPhone. | Sections modifiables ; intitulés variables. Synchronisation éventuelle distincte ; aucune promesse d'effet sur Apple News ou tous les appareils. | D28 [A2][A2]. |
| `safari.mac-suggestions` | Réglage des suggestions Apple du champ de recherche intelligente sur Mac. | Réglage modifiable ; suggestions du moteur séparées. Ne pas appliquer ce chemin Mac à iPhone/iPad ou à un fil social. | D28 [A3][A3]. |

## Matrice API, permissions et révocation — 14 modules

**État commun :** `requestedByFilClair: []`, `granted: null`, `operational: false`. Les noms de scopes ci-dessous sont des faits documentaires ou les exigences exactes d'un contrat **inactif**, pas une demande d'accès. Aucune vérification de gratuité, de quota contractuel ou d'éligibilité d'application ne découle d'un endpoint existant ; aucun coût ne doit être engagé pour combler ces inconnues.

| Module | `officialApi` pour les contrôles embarqués | `scopes` / `permissions` documentés | Révocation d'accès et limite de preuve |
| --- | --- | --- | --- |
| `local` | `not-applicable` : pas de fournisseur. | Aucune permission externe. | Retrait/effacement local suivant le contrat V2 ; aucun token. [Flux](../UNIVERSAL_FLOWS.md). |
| `discover` | `not-qualified` : les aides de contrôle étudiées ne qualifient pas une API d'exécution personnelle. | `documentedRequired: null` ; compte/option selon le réglage. Ne pas proposer de scope Google générique comme équivalent. [G1][G1], [G3][G3], reprise D28. | OAuth Google possède une révocation officielle, mais aucun grant FIL CLAIR n'existe. Révoquer peut concerner les scopes accordés au projet et prendre un délai ; ce n'est pas retirer les intérêts Discover. [N-GOAUTH][N-GOAUTH], D+. |
| `google-search` | `not-qualified` pour ce réglage personnel, sans conclusion d'inexistence. | Compte Google nécessaire pour le réglage étudié ; scope d'API correspondant **U**. [G4][G4], D28. | Même mécanisme Google que ci-dessus ; pas de preuve de suppression d'historique ni de modification automatique des préférences Search. [N-GOAUTH][N-GOAUTH], D+. |
| `youtube` | `not-qualified` pour les trois contrôles ; le catalogue REST public étudié le 28/10 n'a pas établi ces opérations. | `documentedRequired: null` ; aucune permission de publication/modération substituée aux retours de consommation personnelle. [Y1][Y1], [Y3][Y3], D28. | Révocation Google distincte de l'effacement des retours YouTube. Aucune suppression de retours ni restauration de recommandations n'est documentée par cet endpoint. [N-GOAUTH][N-GOAUTH], D+. |
| `x` | `documented-not-integrated` pour sourdine/blocage ; mots masqués non qualifiés. Endpoints existants conservés de la preuve du 28/10. [X6][X6], [X7][X7]. | Pour sourdine : mapping OAuth 2.0 `tweet.read users.read mute.write` ; lecture `mute.read` avec les deux lectures communes. Lecture des blocages : `tweet.read users.read block.read`. Le registre nomme `block.write`, mais ne suffit pas à qualifier un ensemble complet pour l'écriture Enterprise observée le 28/10. Accès/conditions non acquis. [N-XMAP][N-XMAP], [N-XSCOPE][N-XSCOPE], D+. | `POST /2/oauth2/revoke` et retrait depuis les applications connectées documentés. Ni annulation des sourdines/blocages ni restauration d'abonnements démontrée. Révocation réelle et ensemble de tokens concernés à tester ultérieurement. [N-XOAUTH][N-XOAUTH], D+. |
| `facebook` | `not-qualified`. La tentative Graph API du 28/10 renvoyait **429** ; contenu non revalidé. | Scopes/approbations exacts **U** pour Snooze et désintérêt ; aucun scope inventé. Une annonce de contrôle du fil n'est pas une permission Graph. [F2][F2], [F3][F3], [META-F][META-F], A28/échec hérité. | Révocation d'une future intégration correspondante **non qualifiée ici** ; aucune absence d'API affirmée. Retirer une fiche ne retire aucun accès distant. |
| `instagram` | `not-qualified`. Aperçu Instagram Platform limité par **429** le 28/10, non revalidé. | Permissions de publication ou modération professionnelles non assimilées aux suggestions personnelles ; scopes exacts **U**. [I2][I2], [I4][I4], [META-I][META-I], hérités. | Mécanisme exact pour une future intégration de ces réglages **U**. Un reset de recommandations ne sert pas de révocation OAuth et n'a pas de restauration prouvée. |
| `threads` | L'API officielle existe pour contenu/réponses, mais les trois opérations du catalogue restent `not-qualified`. Doc détaillée **429** héritée. [H3][H3], [H4][H4], [META-H][META-H]. | Aucun scope de publication/réponse ne qualifie le désabonnement, le fil Following ou les mots des réponses. Permissions de ces opérations **U**. | Révocation exacte d'un tel accès **U** ; ni désabonnement ni changement de fil ne constituent une révocation. « Dear Algo » public est hors des contrôles embarqués et n'est pas une action silencieuse autorisée par cette note. [H5][H5], I28. |
| `tiktok` | `not-qualified` pour les trois contrôles ; le registre public de scopes étudié ne les qualifie pas. [T6][T6], D28. | `documentedRequired: null` pour ces réglages. La nouvelle documentation de token décrit `client_key`, `client_secret` et `token` pour révoquer ; ce n'est pas une implémentation sûre dans un JavaScript public. [N-TKOAUTH][N-TKOAUTH], D+. | `POST https://open.tiktokapis.com/v2/oauth/revoke/` documenté, succès à corps vide. Aucun appel, test de révocation, reset de For You ou retrait de signal n'en est déduit. [N-TKOAUTH][N-TKOAUTH]. |
| `bluesky` | `inactive-local-contract` **pour le blocage/déblocage seulement** ; guides et SDK documentés ne changent pas cet état. Les autres contrôles n'ont pas d'intégration FIL CLAIR qualifiée. [Contrat](../OFFICIAL_CONNECTORS.md), C28. | Contrat exact : `atproto repo:app.bsky.graph.block?action=create&action=delete`. Aucun élargissement, token ou mot de passe applicatif introduit. OAuth/DPoP, transport et gestion durable restent bloquants. [B3][B3], [B4][B4], C28. | Reprise du 28/10 : `OAuthClient.revoke` efface le stockage dans `finally`, l'agent SDK peut absorber l'erreur distante. Une promesse résolue ne prouve donc pas la révocation distante ; certains access tokens peuvent survivre brièvement. Rien de cela n'est implémenté ici. [B5][B5], [B6][B6], C28. |
| `mastodon` | `inactive-local-contract` pour blocage/déblocage ; pas d'activation par documentation. [Contrat](../OFFICIAL_CONNECTORS.md), C28. | Contrat exact : `profile write:blocks read:follows`. Les capacités externes de sourdine (`write:mutes`) existent dans la doc, sans être accordées ou ajoutées au contrat. Filtres/API correspondant à la configuration précise non qualifiés dans cet audit. [M1][M1], C28 ; complément ciblé [N-MOD][N-MOD]. | `/oauth/revoke` officiel idempotent, non implémenté ; le modèle de client confidentiel/secret et la recette réelle restent ouverts. Aucun déblocage ou rétablissement d'abonnements inféré d'une révocation. [M2][M2], [M3][M3], C28. |
| `reddit` | `documented-not-integrated` pour `POST /api/block_user` ; approbation OAuth requise. Les deux autres contrôles restent non qualifiés. [R5][R5], [R6][R6], reprise I28. | Complément exact : référence OAuth classe `block_user` sous **`account`**. Ce scope d'écriture seul ne qualifie pas l'identité, la relecture ni un connecteur complet. Le `muted` de modération d'un subreddit n'est pas le masquage personnel d'une communauté. [N-RAPI][N-RAPI], D+. | Le wiki OAuth officiel **archivé** documente `/api/v1/revoke_token`, révocation du refresh token et des access tokens liés, et succès 204 même pour un token jamais valide. Preuve historique à revalider avant toute intégration ; aucun succès fonctionnel actuel attesté. [N-ROAUTH][N-ROAUTH], D+ historique. |
| `linkedin` | `not-qualified` pour ces trois contrôles. Les permissions ouvertes étudiées ne qualifient pas la gestion du fil ou le blocage ; pas d'absence globale d'API partenaire affirmée. [L4][L4], I28. | `documentedRequired: null` ; `w_member_social` ne prouve pas le droit de piloter le fil personnel. Les approbations éventuelles ne sont pas acquises. [L4][L4]. | Aide officielle : Confidentialité des données → Services autorisés → Retirer. L'accès futur est retiré ; des données déjà reçues peuvent rester chez le tiers. Aucun endpoint programmatique de révocation n'est qualifié par cette recherche. [N-LIACCESS][N-LIACCESS], D+. |
| `safari` | `not-qualified` pour l'exécution de ces réglages dans FIL CLAIR ; les guides manuels suffisent au périmètre. Aucune affirmation d'absence générale d'API Apple. | Aucune permission OAuth demandée ; commandes du navigateur/appareil. La synchronisation optionnelle de la page d'accueil ne doit pas rendre un compte Apple obligatoire. [A1][A1], [A2][A2], [A3][A3], D28. | Aucun accès FIL CLAIR à révoquer. Changer une option Safari n'efface pas les données FIL CLAIR, ses exports ou des autorisations d'applications tierces. [Contrat](../UNIVERSAL_FLOWS.md), sources Apple héritées. |

## Affirmations qui exigent une qualification visible

- **Tous les retours de désintérêt** (`discover.not-interested`, `youtube.not-interested`, `facebook.not-interested`, `instagram.not-interested`, `tiktok.not-interested`, `linkedin.not-interested`) : signal limité, sans poids quantifié, bannissement de sujet ou retour assuré au classement antérieur. Retrait individuel persistant non établi, sauf portée exacte explicitement décrite par une source ; l'effacement groupé YouTube ne doit pas servir de preuve contraire. Sources : [G1][G1], [Y1][Y1], [F3][F3], [I2][I2], [T2][T2], [L2][L2], reprises 28/10.
- **YouTube chaîne/retours** : retirer une fiche n'efface rien chez Google ; l'effacement décrit peut être global aux retours concernés. Pas de « déblocage individuel » générique. [Y1][Y1], D28.
- **Instagram reset** : retour à l'état précédent **U** ; une nouvelle personnalisation n'est pas sa restauration. [I4][I4], A28/I28.
- **Blocages X, Mastodon, LinkedIn et Bluesky** : retrait de relation distinct de la restauration des abonnements, recommandations de profil, copies publiques ou propagation. Les différences de visibilité doivent rester propres au fournisseur. [X2][X2], [N-MOD][N-MOD], [L3][L3], [B2][B2], [contrat](../OFFICIAL_CONNECTORS.md).
- **Filtres de mots** : surfaces, langue et version conditionnent l'effet ; aucun filtre idéologique/sémantique complet n'est établi. Le mode de non livraison Mastodon exige une réserve sur la reconstitution du passé. [X3][X3], [I2][I2], [H1][H1], [N-MOD][N-MOD].
- **Désabonnements Threads, TikTok et LinkedIn, choix de fils et curseurs de sujets** : ce sont des modifications de relation, de vue ou de réglage. Un compte peut être proposé ailleurs ; une commande inverse ne restaure pas un instantané du classement. [H1][H1], [T2][T2], [T5][T5], [L1][L1], [B1][B1].
- **Toute révocation OAuth future** : supprimer les credentials locaux, demander une révocation distante et constater son effet sont des états distincts. Un code de succès ou un SDK qui efface son stockage ne prouve pas l'annulation des anciennes actions ; les sémantiques dépendent du fournisseur. [N-GOAUTH][N-GOAUTH], [N-XOAUTH][N-XOAUTH], [N-TKOAUTH][N-TKOAUTH], [N-ROAUTH][N-ROAUTH], [N-LIACCESS][N-LIACCESS], [B5][B5], [B6][B6].

## Sources officielles et provenance

Chaque URL ci-dessous est une preuve documentaire, **jamais une route que FIL CLAIR appelle**. Les dates désignent l'accès, sauf date de publication explicitement nommée. Aucun résultat tiers n'est employé comme preuve technique.

### Preuves du 2026-10-28 réutilisées sans nouvelle validation générale

Les modes de consultation et échecs complets restent dans les recherches d'origine. D28 pour Google/Apple signifie corps de page lu ; les recherches sociales emploient aussi I28/A28. La simple reprise d'une URL ne renouvelle pas sa validation.

| Références | URL officielles et fait conservé | Provenance |
| --- | --- | --- |
| G1, G3, G4 | [Discover et intérêts masqués][G1] ; [affichage Discover][G3] ; [personnalisation Search][G4]. | Recherche Google/Apple, accès 2026-10-28, D28. |
| Y1, Y3 | [Retours et recommandations YouTube][Y1] ; [référence REST publique][Y3]. | Recherche Google/Apple, accès 2026-10-28, D28. |
| A1, A2, A3 | [Recherche Safari iPhone][A1] ; [page d'accueil iPhone][A2] ; [Recherche Safari Mac][A3]. | Recherche Google/Apple, accès 2026-10-28, D28 ; version d'appareil à choisir. |
| X1, X2, X3 | [Sourdine][X1] ; [blocage/déblocage][X2] ; [mots masqués][X3]. | Recherche sociale, accès 2026-10-28, D28 ; conflit documentaire de visibilité conservé au profit de l'aide dédiée. |
| X6, X7 | [API sourdine][X6] ; [API blocage][X7]. | Recherche sociale, accès 2026-10-28, D28 ; classement Enterprise observé pour le blocage. |
| F2, F3 | [Snooze, annonce de 2017][F2] ; [personnalisation du fil et mise à jour des noms en 2025][F3]. | Recherche sociale, accès 2026-10-28, A28/I28 ; menus actuels non testés. |
| I2, I4 | [Suggestions/mots, annonce de 2023][I2] ; [reset, annonce de 2024][I4]. | Recherche sociale, accès 2026-10-28, A28/I28. |
| H1, H2, H3, H4, H5 | [Threads et mises à jour][H1] ; [personnalisation des fils][H2] ; [existence de l'API][H3] ; [collection officielle Meta Postman][H4] ; [Dear Algo public et temporaire][H5]. | Recherche sociale, accès 2026-10-28 ; H1/H2 corps ciblés lus, H3/H5 indexés, H4 collection non exhaustive. |
| T2, T4, T5, T6 | [Recommandations TikTok][T2] ; [Control your scroll][T4] ; [sujets][T5] ; [scopes officiels][T6]. | Recherche sociale, accès 2026-10-28 ; T2/T4/T5 I28, T6 D28 ; robots/503 conservés pour certaines ouvertures. |
| R1, R2, R3, R4, R5, R6 | [Communautés masquées][R1] ; [accueil][R2] ; [blocage][R3] ; [effets du blocage][R4] ; [Data API][R5] ; [règles/API Wiki][R6]. | Recherche sociale, accès 2026-10-28, I28 ; mise à jour 2026-10-05 de R2/R4 conservée. |
| L1, L2, L3, L4 | [Suivi de sources][L1] ; [contenu du fil][L2] ; [blocage/déblocage][L3] ; [accès et permissions des API][L4]. | Recherche sociale, accès 2026-10-28, I28. |
| B1 | [Modération et fils Bluesky][B1]. | Source du catalogue contrôlé le 2026-10-28 ; complément d'index officiel ciblé sur les publications principales/réponses, sans recette. |
| B2, B3, B4 | [Blocage/déblocage][B2] ; [permissions AT Protocol][B3] ; [spécification OAuth][B4]. | OFFICIAL_CONNECTORS, accès 2026-10-28, C28/documentation ; API inactive. |
| B5, B6 | [Source OAuthClient][B5] ; [source OAuthServerAgent][B6]. | OFFICIAL_CONNECTORS, accès 2026-10-28 ; limites de révocation déjà consignées, non retestées. |
| M1, M2, M3 | [Comptes, relations et block/unblock][M1] ; [OAuth et révocation][M2] ; [types de clients OAuth][M3]. | OFFICIAL_CONNECTORS, accès 2026-10-28, C28/documentation ; API inactive. |
| META-F, META-I, META-H | [Graph API][META-F] ; [Instagram Platform][META-I] ; [Threads API détaillée][META-H]. | **Tentatives 2026-10-28 : HTTP 429, contenu non qualifié. Aucune revalidation dans cet audit.** |

### Compléments ciblés effectivement lus le 2026-10-28

| Référence | URL officielle / passage et limite | Nature |
| --- | --- | --- |
| N-GOAUTH | [Google OAuth web server — révocation][N-GOAUTH] : portée des autorisations du projet, access/refresh tokens et délai possible. Ne qualifie aucune API Discover/Search/retour YouTube. | D+ ; lecture documentaire, aucun token. |
| N-XSCOPE | [X OAuth PKCE — scopes][N-XSCOPE] : noms `mute.read/write`, `block.read/write`, `offline.access`. | D+ ; aucun scope demandé. |
| N-XMAP | [X mapping OAuth v2][N-XMAP] : ensembles précis pour mute/unmute et lectures de sourdines/blocages. Le mapping lu ne qualifie pas à lui seul l'écriture Enterprise de blocage. | D+ ; lacune de qualification conservée. |
| N-XOAUTH | [X OAuth user access token — étape 6][N-XOAUTH] : endpoint de révocation et page des applications connectées. | D+ ; aucun appel. |
| N-TKOAUTH | [TikTok User Access Token Management][N-TKOAUTH] : section 3, v2 revoke ; article affiché mis à jour le **2026-08-04**. | D+ ; aucun client/secret créé. |
| N-RAPI | [Reddit référence OAuth, blocage][N-RAPI] : scope `account`, application approuvée ; distinction avec `muted` de modération. | D+ ; lecture ciblée des scopes, existence de `block_user` déjà établie le 28/10 non présentée comme nouvelle découverte. |
| N-ROAUTH | [Wiki OAuth officiel Reddit][N-ROAUTH], section « Manually Revoking a Token » : refresh/access liés et réponse 204. Wiki édité le **2016-01-08**, dépôt archivé le **2017-11-09**. | D+ **historique** ; existence documentaire, pas garantie opérationnelle 2026. |
| N-LIACCESS | [LinkedIn, Third-party applications data use][N-LIACCESS] : retrait depuis Permitted Services, accès futur et données déjà reçues. Mise à jour relative affichée « 2 years ago », sans date absolue inférée. | D+ ; guide public lu, aucun compte ouvert. |
| N-MOD | [Mastodon, Dealing with unwanted content][N-MOD] : contextes, édition/suppression des filtres, « Hide completely », notifications et rupture des abonnements. Page affichée mise à jour le **2025-11-21**. | D+ ciblé sur la réversibilité ; aucun client/serveur réel testé. |

## Vérification et reste ouvert

Audit documentaire seulement. Les 43 identifiants ci-dessus reprennent les contrôles effectivement embarqués, sans ajouter les propositions non livrées des recherches antérieures. Les assertions personnelles, de classement, d'API et de révocation sont séparées. Les tests du 28/10 restent des preuves locales ou simulées ; aucun test fonctionnel fournisseur n'a été ajouté ou revendiqué.

Avant toute qualification API future, il resterait à établir le droit officiel exact **pour l'opération personnelle**, les scopes effectivement accordés, l'identité/cible, les conditions d'accès sans coût autorisé, la relecture indépendante, la révocation et les résultats indéterminés entre sessions. Ces inconnues maintiennent B CONNECT fermé ; elles n'appellent aucune action réelle dans cette mission. La documentation ne modifie ni cette porte ni le No-Go de publication.

[G1]: https://support.google.com/websearch/answer/2819496?hl=fr
[G3]: https://support.google.com/websearch/answer/9504726?hl=fr
[G4]: https://support.google.com/websearch/answer/17026260?hl=fr
[Y1]: https://support.google.com/youtube/answer/6342839?hl=fr
[Y3]: https://developers.google.com/youtube/data/reference/rest
[A1]: https://support.apple.com/fr-fr/guide/iphone/iph6297b394b/ios
[A2]: https://support.apple.com/fr-fr/guide/iphone/iphb3100d149/ios
[A3]: https://support.apple.com/fr-fr/guide/safari/sfria1042d31/mac
[X1]: https://help.x.com/en/using-x/x-mute
[X2]: https://help.x.com/en/using-x/blocking-and-unblocking-accounts
[X3]: https://help.x.com/en/using-x/advanced-x-mute-options
[X6]: https://docs.x.com/x-api/users/mute-user
[X7]: https://docs.x.com/x-api/users/block-user
[F2]: https://about.fb.com/news/2017/12/news-feed-fyi-snooze/
[F3]: https://about.fb.com/news/2022/10/new-ways-to-customize-your-facebook-feed/
[I2]: https://about.fb.com/news/2023/01/instagram-quiet-mode-manage-your-time-and-focus/
[I4]: https://about.fb.com/news/2024/11/introducing-recommendations-reset-instagram/
[H1]: https://about.fb.com/news/2023/07/introducing-threads-new-app-text-sharing/
[H2]: https://about.fb.com/news/2025/03/new-threads-features-more-personalized-experience-you-control/
[H3]: https://about.fb.com/news/2024/08/new-threads-features-for-creators-and-businesses/
[H4]: https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api
[H5]: https://about.fb.com/news/2026/02/threads-dear-algo/
[T2]: https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content
[T4]: https://newsroom.tiktok.com/tiktoks-new-features-to-help-you-control-your-scroll?lang=en-AU
[T5]: https://support.tiktok.com/en/account-and-privacy/account-privacy-settings/manage-topics
[T6]: https://developers.tiktok.com/docs/en/tiktok-api-scopes
[R1]: https://support.reddithelp.com/hc/en-us/articles/9810475384084-What-is-community-muting
[R2]: https://support.reddithelp.com/hc/en-us/articles/4402284777364-What-are-home-feed-recommendations
[R3]: https://support.reddithelp.com/hc/en-us/articles/214548323-How-do-I-block-someone
[R4]: https://support.reddithelp.com/hc/en-us/articles/4413520308372-How-does-blocking-work
[R5]: https://www.reddit.com/dev/api/
[R6]: https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki
[L1]: https://www.linkedin.com/help/linkedin/answer/a528074
[L2]: https://www.linkedin.com/help/linkedin/answer/a523209
[L3]: https://www.linkedin.com/help/linkedin/answer/a1338373/block-or-unblock-a-member?lang=en
[L4]: https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access
[B1]: https://blueskyweb.zendesk.com/hc/en-us/articles/19002427251981-Moderation-and-Custom-Feeds
[B2]: https://bsky.network/docs/bluesky-api/following/
[B3]: https://atproto.com/specs/permission
[B4]: https://atproto.com/specs/oauth
[B5]: https://github.com/bluesky-social/atproto/blob/main/packages/oauth/oauth-client/src/oauth-client.ts
[B6]: https://github.com/bluesky-social/atproto/blob/main/packages/oauth/oauth-client/src/oauth-server-agent.ts
[M1]: https://docs.joinmastodon.org/methods/accounts/
[M2]: https://docs.joinmastodon.org/methods/oauth/
[M3]: https://docs.joinmastodon.org/spec/oauth/
[META-F]: https://developers.facebook.com/docs/graph-api/
[META-I]: https://developers.facebook.com/docs/instagram-platform/overview/
[META-H]: https://developers.facebook.com/docs/threads
[N-GOAUTH]: https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke
[N-XSCOPE]: https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code
[N-XMAP]: https://docs.x.com/fundamentals/authentication/guides/v2-authentication-mapping
[N-XOAUTH]: https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token
[N-TKOAUTH]: https://developers.tiktok.com/docs/en/oauth-user-access-token-management
[N-RAPI]: https://www.reddit.com/dev/api/oauth/#POST_api_block_user
[N-ROAUTH]: https://github.com/reddit-archive/reddit/wiki/oauth2#manually-revoking-a-token
[N-LIACCESS]: https://www.linkedin.com/help/linkedin/answer/a519947
[N-MOD]: https://docs.joinmastodon.org/user/moderating/
