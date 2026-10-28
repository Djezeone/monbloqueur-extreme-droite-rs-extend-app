# 2026-10-28 — Protocole QA universel FIL CLAIR V2

**État : protocole préparé, scénarios V2 non exécutés par ce volet.** Recherche et lecture uniquement ; aucun test ancien relancé, appareil physique utilisé, déploiement, installation système, appel social, paiement ou écriture externe effectué. Ce document ne vaut ni recette Safari, ni audit WCAG, ni autorisation de fusion/publication.

Base inspectée : `98550a8e67e736db28dc9b97f92b703673e9c4c9`. La [mission complète](../WORK_MISSION_FIL_CLAIR.md) et les scripts PWA existants ont été lus. La dernière preuve PWA existante est l'[annexe à 09:53:58 UTC](../evidence/2026-10-28-pwa-qa.md) ; elle ne qualifie pas les modifications V2 à venir. La coordination conserve la responsabilité du produit, des E2E et des nouvelles exécutions.

## Contrat V2 à éprouver

Contrat transmis par la coordination, à comparer au code réellement livré avant exécution :

- Le snapshot atomique `fil-clair-v1` conserve listes, déclarations et historique. Il reçoit une propriété optionnelle `flows` : `{version:1, setupComplete, platforms, categories, items}`. Catégories prévues : `accounts`, `sources`, `topics`, `recommendations`. Un item contient `id`, `platform`, `control`, `target`, `status`, `createdAt`, `updatedAt` ; statuts admis : `planned`, `declared`, `local`.
- Un ancien snapshot sans `flows` donne un modèle de préférences vide, sans perdre les données existantes. La sauvegarde complète exporte les préférences ; l'effacement confirmé les efface aussi. L'export de liste active reste un export de liste, avec un libellé qui permet de le distinguer de la sauvegarde complète.
- Le parcours en trois étapes est modifiable. Un module local générique reste utilisable sans compte, sans choix Google et sans sélection obligatoire d'un réseau. Sélecteurs envisagés : `#view-flows`, `#flow-setup`, `#flow-platforms`, `#flow-categories`, `#flow-add`, `#flow-items`.
- Les préférences ne déclenchent aucun fetch, OAuth, synchronisation ou action chez un fournisseur. `declared` reste une déclaration personnelle ; aucun import ne devient « confirmé par API ». Supprimer un item est local. Le rouvrir le remet à préparer, sans prétendre annuler une action distante. Le texte de cible sensible ne doit jamais être ajouté à une URL sortante.
- Sans stockage local ou Web Locks, un mode de session vide et indépendant peut être démarré **après choix explicite**. La source persistante existante reste intacte, le mode temporaire reste annoncé et son contenu doit pouvoir être exporté avant fermeture. Il ne remplace pas silencieusement une lecture inconnue ou corrompue.

Les libellés exacts pourront changer ; les oracles de préservation, de consentement et d'absence d'action distante ne doivent pas être assouplis pour faire passer un test.

## Couverture acquise et écarts

Les résultats ci-dessous sont rapportés par la preuve existante, pas réexécutés ici.

| Couverture actuelle | Ce qu'elle établit | Écart V2 à fermer |
| --- | --- | --- |
| `test-pwa.mjs`, trois moteurs | Parcours listes, déclarations, historique, export/restore/effacement, métadonnées et shell hors ligne | Aucune préférence ni étape de configuration ; absence de perte des listes pendant le nouveau parcours à vérifier |
| `test-pwa-storage.mjs` | Refus `SecurityError`, quota, formulaire conservé, état antérieur exportable | Refus lors de la configuration et des préférences ; consentement et comportement du nouveau mode de session |
| `test-pwa-recovery.mjs` | Source corrompue préservée/exportée exactement ; export compact proche de 10 Mo | Corruption sémantique de `flows`, distinction export brut/session, limite cumulée listes + préférences en octets UTF-8 |
| `test-pwa-concurrency.mjs`, 4/4 par moteur | Conflits visibles, lecture initiale inconnue protégée, absence de Web Locks en lecture/export, oracle dans un troisième onglet frais | Course préférences contre listes/restore/effacement ; le nouveau mode temporaire ne doit jamais écrire la source persistante |
| `test-pwa-quality.mjs`, 25/25 Chromium, 24/24 Firefox, 25/25 WebKit | Quatre vues, focus et noms de boutons, progression, reflow 320/1280 px, axe ; profils Pixel/iPhone émulés | Ajouter la cinquième vue, les trois étapes, les erreurs et le bandeau temporaire. Les contrastes sur dégradés restent à examiner humainement |
| `test-pwa-sw.mjs`, huit scénarios ; `audit-pwa.mjs` | Cache shell exact, exclusions sensibles, pas de cache dynamique | Si un module est ajouté : mise à jour explicite du SW, de l'allowlist serveur QA et des deux tableaux d'assets attendus ; conserver toutes les exclusions |

Les scripts sont exécutés via Playwright sur serveur local. Ils ne prouvent pas les menus d'installation, le sélecteur de fichiers du téléphone, le retour après suspension système, VoiceOver ou une conformité WCAG 2.2 AA complète. Les anciennes validations ne sont à répéter que si les fichiers, le comportement ou l'environnement concernés ont changé.

## Niveaux de preuve et faits navigateur

| Niveau | Étiquette à conserver dans la preuve | Limite |
| --- | --- | --- |
| Moteur automatisé | `Playwright Chromium`, `Playwright Firefox`, `Playwright WebKit`, version et OS hôte | Les binaires Firefox/WebKit de Playwright sont modifiés pour l'automatisation. WebKit n'est pas le Safari commercial ; les résultats varient aussi selon l'OS [S1] |
| Émulation | Moteur + profil exact + viewport + `physicalDevice:false` | User-agent, écran, tactile et autres paramètres sont simulés ; un profil « iPhone » n'est pas un iPhone [S2] |
| Navigateur commercial desktop | Marque, version, canal, OS/build, installation normale ou profil géré | Chrome/Edge exigent un canal commercial réellement lancé pour revendiquer cette marque. Tester Safari réel séparément [S1] |
| Appareil physique | Fabricant/modèle, OS/build, navigateur/version, mode onglet/privé/app | Nécessaire pour les menus système, installation, clavier virtuel, fichiers, suspension et lecteur d'écran mobile |

Conséquences documentaires et de test :

- Safari iPhone et iPad propose une installation manuelle par Partager puis ajout à l'écran d'accueil ; les guides actuels présentent aussi « Ouvrir comme app web ». Relever les libellés réels de la version testée [S3–S4]. L'absence d'événement `beforeinstallprompt` doit laisser une aide manuelle et l'usage normal disponibles ; elle ne prouve ni un navigateur défaillant ni une installation réussie [S5].
- Sur Mac, Apple décrit l'ajout au Dock à partir de macOS Sonoma 14. L'app web possède des données et réglages séparés de Safari : aucune promesse de synchronisation entre ces contextes ; vérifier chaque contexte et proposer l'export/import si nécessaire [S6]. Ne pas extrapoler cette règle Mac à un comportement de partage iOS non mesuré.
- Le stockage WebKit est soumis à quota et à éviction ; son mode par défaut ne garantit pas la conservation. Une estimation de quota ou une installation ne constitue pas une sauvegarde. Injecter les erreurs en QA sans remplir le disque ; conserver une consigne d'export et un message de perte locale possible [S7].
- La navigation privée Safari est éphémère [S8]. Tester son comportement réel, y compris après fermeture de **tous** les onglets privés. Une API disponible ou une écriture réussie ne justifie pas une promesse de conservation après cette session. Ne pas essayer de détecter le mode privé par contournement ou profilage.
- Ne pas écrire « Firefox desktop ne peut pas installer ». Mozilla documente désormais les apps web sur Windows à partir de Firefox 143, et 150 pour la distribution Microsoft Store ; cette fonction est décrite comme propre à Windows et hors navigation privée. Cela ne crée pas un support universel de `beforeinstallprompt` [S9].
- Les guides Google et Mozilla donnent des chemins d'installation Android différents [S10–S11]. La documentation Samsung consultée est officielle mais contient un contexte ancien de versions 5/6 : elle confirme le principe d'ajout à l'accueil, pas les menus exacts de la version actuelle. Les vérifier sur Samsung réel ; ne pas coder une promesse de bannière ou d'icône « + » [S12].

## Matrice de recette à remplir

**Toutes les lignes V2 sont À EXÉCUTER.** Aucun téléphone ni iPad physique n'est disponible dans ce volet. Une cellule sans matériel reste « NON TESTÉ — matériel indisponible », jamais « PASS via émulation ». Relever les versions stables réellement installées à la date du test ; ajouter la version minimale seulement si elle est annoncée comme supportée.

| Priorité | OS / surface | Navigateur ou moteur | Modes/parcours obligatoires |
| --- | --- | --- | --- |
| 0 | Linux QA local | Playwright WebKit | Tous les nouveaux cas automatisables, puis émulations iPhone et iPad ; ce n'est pas Safari |
| 0 | Linux QA local | Playwright Chromium et Firefox | Même contrat et mêmes oracles ; profil Pixel émulé sur Chromium |
| 0 | iPhone physique | Safari | Onglet normal, privé, ajout à l'accueil, lancement installé, fichiers, hors ligne, reprise, VoiceOver |
| 0 | iPad physique | Safari | Mêmes cas, portrait/paysage, fenêtre étroite/multitâche, clavier tactile et matériel si disponible |
| 0 | macOS réel | Safari commercial | Normal/privé, clavier, export/import, VoiceOver, ajout au Dock et stockage séparé |
| 1 | Windows 11 réel | Chrome, Edge, Firefox commerciaux | Un résultat distinct par navigateur ; normal/privé, clavier, fichiers, installation ou aide adaptée |
| 1 | macOS réel | Chrome, Edge, Firefox commerciaux | Même socle ; installation seulement si effectivement proposée, alternative navigateur toujours disponible |
| 1 | Linux desktop réel, distribution/version relevées | Chrome, Edge, Firefox commerciaux | Un résultat distinct par navigateur ; clavier, fichiers, offline, aide lorsque la fonction système manque |
| 1 | Android physique | Chrome | Onglet normal/privé, clavier, fichiers, installation, offline et reprise |
| 1 | Téléphone Samsung physique Android | Samsung Internet / Samsung Browser, nom et version relevés | Même socle ; menu, installation et mode privé réellement observés |
| 1 | Android physique | Firefox | Même socle ; menu d'installation Mozilla réellement observé, pas déduit du Firefox desktop |
| 2 | Chromebook réel | Chrome | Socle navigateur, clavier, fichiers et installation ; nécessaire avant de revendiquer une recette ChromeOS |

Un même téléphone Android peut accueillir plusieurs navigateurs, mais les données de chaque navigateur constituent un contexte de test distinct. Safari Windows/Linux n'est pas une cible de recette ajoutée artificiellement. Un simulateur iOS éventuel doit avoir sa propre étiquette et ne remplace pas les lignes physiques.

## Préparation et preuves minimales

Préparer exclusivement des fixtures synthétiques : ancien backup v1 sans `flows` avec listes/déclarations/historique ; backup V2 avec chaque catégorie/statut ; texte `qa_cible_privée_é_🙂` ; JSON cassé ; `flows` sémantiquement invalide ; état proche de la limite de 10 000 000 octets. Conserver la chaîne initiale exacte pour les assertions de non-écriture.

Pour chaque résultat, enregistrer UTC, SHA complet et état du worktree, URL/origine locale ou déploiement précisément identifié, version des outils et du navigateur, OS, mode de navigation, identifiant du cas, attendu/observé, sortie/trace/capture synthétique et réserve. Indiquer si l'on a testé du code local, un artefact ou un déploiement. Une trace ne doit contenir ni vraies cibles, ni sauvegarde utilisateur, ni token. Aucun compte social réel n'est nécessaire.

États permis : **À EXÉCUTER**, **PASS** avec preuve, **FAIL** avec observation, **BLOQUÉ ENVIRONNEMENT** avec motif, **NON APPLICABLE** avec justification précise. Un menu non disponible peut être non applicable pour l'installation, jamais pour le parcours local qui doit rester utilisable.

## Nouveaux cas automatisables

Ces cas sont des recommandations pour la coordination ; aucun nouveau script n'est créé ou exécuté ici. Privilégier les rôles/noms accessibles et assertions sur l'état final. Les IDs proposés servent aux points d'entrée. Ne pas supprimer un oracle de refus ou remplacer une attente observable par un sommeil fixe.

### Parcours, sémantique et confidentialité

| ID | Manipulation | Résultat attendu |
| --- | --- | --- |
| U01 | Nouveau profil, ouvrir `#view-flows`, parcourir les trois étapes, revenir et modifier une sélection ; changer de vue puis recharger après validation | Étapes compréhensibles, choix modifiables et conservés après écriture réussie ; `setupComplete` cohérent ; aucune liste existante modifiée |
| U02 | Ne sélectionner aucun réseau/compte/Google ; conserver une catégorie et créer un item générique local | Le parcours local fonctionne ; aucun écran d'authentification, compte ou installation obligatoire |
| U03 | Sélectionner puis retirer plateformes et catégories ; exercer chacune des quatre catégories et les combinaisons permises | Contrôles sélectionnés annoncés ; retrait de sélection sans destruction silencieuse des items existants ; validation explicite des combinaisons refusées |
| U04 | Créer un item, déclarer personnellement une action, le rouvrir, puis le supprimer ; exercer aussi l'état local | `planned`/`declared`/`local` conformes au contrat ; texte sans confirmation fournisseur ; retour à préparer et suppression sans promesse de déblocage ou annulation distante |
| U05 | Champ vide, espaces seuls, limite autorisée, dépassement, accents/emoji, longue cible sans espace, texte ressemblant à du HTML ; double activation rapide de l'ajout | Message lié au champ ; cible rendue comme texte ou refusée explicitement ; aucune exécution HTML ; pas de doublon involontaire ; brouillon conservé après refus |
| U06 | Observer requêtes, popups et URLs pendant configuration, création, édition, suppression, export et changement de catégorie | Aucun réseau/onglet/auth déclenché par ces opérations. La cible n'apparaît jamais dans URL, query, fragment, référent ou nom de fichier sortant ; le cache reste limité au shell |
| U07 | Inspecter puis activer explicitement un lien d'aide officiel avec interception de navigation, sans ouvrir de vrai compte social | Destination statique attendue, sans cible sensible ; ouverture seulement après geste ; nouvel onglet sans accès à `opener` ; aucun état local marqué comme confirmé par la navigation |
| U08 | Événement d'installation absent ; puis simulation de l'événement présent, acceptation, refus et erreur de `prompt()` | Aide/utilisation normale disponibles ; pas de bouton inactif promettant une installation ; refus/erreur sans perte de formulaire ou boucle ; un événement synthétique ne vaut pas preuve d'installation |

### Stockage, migration, session et récupération

| ID | Manipulation | Résultat attendu |
| --- | --- | --- |
| D01 | Charger l'ancien snapshot v1 sans `flows`, ouvrir la nouvelle vue, ajouter une préférence et exporter | Listes, ordre, déclarations, historique et métadonnées conservés ; initialisation vide des seules préférences ; aucune écriture destructive au seul démarrage |
| D02 | Importer un backup V2 avec `flows` malformé : version/statut inconnu, identifiant dupliqué, type ou date invalide, taille excessive ; tester aussi au démarrage | Import rejeté avant remplacement, source précédente inchangée. Au démarrage corrompu, avertissement et récupération brute ; pas d'effacement ni de suppression silencieuse de la partie invalide |
| D03 | Export complet avec chaque statut/catégorie, listes et historique ; restaurer dans un profil vide ; exporter à nouveau | Données attendues comparées structurellement, y compris cibles Unicode et dates ; aucune promotion vers une confirmation fournisseur ; distinguer de l'export de liste active |
| D04 | Export compact à la limite cumulée listes + préférences, avec caractères multioctets ; importer au-dessus de la limite | Toute sauvegarde produite reste restaurable et sous la borne en **octets** ; dépassement refusé sans mutation ; pas de budget séparé qui dépasse le plafond total |
| D05 | Annuler puis accepter l'effacement global avec listes, historique et préférences ; recharger | Annulation sans effet ; confirmation retire l'ensemble annoncé. En mode de session, libellé et résultat doivent préciser l'effacement de la session ; ne pas toucher une source persistante inconnue protégée |
| D06 | Injecter quota ou erreur de `setItem` sur validation de configuration, ajout, changement de statut et suppression | Ancien snapshot exact intact ; succès absent, brouillon/choix récupérables ; export de l'état antérieur toujours possible ; pas de `setupComplete` affiché durablement après refus |
| D07 | Rendre le getter `localStorage` inaccessible, puis tester la lecture initiale refusée une seule fois alors que le stockage redevient lisible | Application navigable ; aucune écriture sur état initial inconnu. Aucune bascule temporaire avant consentement. Instrumentation/native conservée pour vérifier la source sans utiliser l'API refusée comme oracle |
| D08 | Retirer `navigator.locks` avec un ancien snapshot valide ; tenter une mutation puis choisir explicitement le mode de session | Avant le choix : lecture/export de l'ancien état, écriture refusée. Après : session vide indépendante, création locale possible, **zéro `setItem`, `removeItem` ou `clear`** de la source persistante ; export temporaire distinct |
| D09 | En session, créer plusieurs items et une liste, changer de vue, essayer export/import/effacement ; rétablir ensuite stockage/verrou et recharger | Avertissement temporaire durable ; export complet de la session restaurable ; aucune sauvegarde automatique ni fusion avec la source. Après rechargement, retrouver la source persistante d'origine ; perte de mémoire annoncée avant fermeture |
| D10 | Source JSON corrompue lisible ; tenter configuration, ajout, restore refusé et éventuel démarrage de session autorisé | Texte original préservé caractère pour caractère et export brut exact. Une sauvegarde de session valide ne doit pas être confondue avec l'export brut de récupération ; aucune prétention à restaurer le JSON cassé |
| D11 | Deux onglets : A modifie une préférence pendant que B ajoute un profil ; puis course préférence/restore et préférence/effacement | Snapshot final lu depuis un **troisième onglet frais** : deux modifications conservées ou perdant explicitement refusé, brouillon préservé ; aucune réapparition silencieuse d'un item effacé |
| D12 | Effacer les données du site depuis un autre onglet/contexte de contrôle puis agir dans l'onglet ancien | L'onglet ancien ne ressuscite pas automatiquement listes ou préférences ; conflit/état inconnu explicite et reprise documentée ; export d'une vue ancienne identifié comme telle |

Le scénario historique sans Web Locks reste valable **avant** consentement au nouveau mode. Il ne faut pas le supprimer sous prétexte que le mode temporaire devient disponible. Tester le mode de session sans modifier les réglages globaux du navigateur ni effacer un profil utilisateur réel.

### Hors ligne et intégration du shell

| ID | Manipulation | Résultat attendu |
| --- | --- | --- |
| O01 | Première ouverture en ligne, attendre SW actif et contrôlant, couper le réseau, recharger et exécuter configuration/préférences/export/restore/aide locale | Shell V2 complet, données cohérentes, opérations locales disponibles ; aucun accès réseau nécessaire ni statut de synchronisation inventé |
| O02 | Profil neuf, première navigation sans réseau ; puis profil avec SW refusé mais réseau présent | Aucune promesse de premier démarrage hors ligne. Refus du SW sans bloquer le parcours local en ligne ni attente infinie ; limite offline expliquée |
| O03 | Tester un ancien cache de shell, charger la V2 en ligne, puis relancer hors ligne | Modules/styles réellement utilisés disponibles, version cohérente ; pas de mélange JS/HTML ancien incompatible ; pas d'effacement du snapshot pour résoudre le cache |
| O04 | Inspecter le cache après édition de préférences, récupération et export ; tester les exclusions OAuth/API/query existantes | Seulement l'allowlist publique exacte, aucun contenu de cible, sauvegarde, token ou réponse privée. Ajouter les nouveaux modules statiques explicitement, sans élargir le cache aux chemins arbitraires |

## Parcours manuels Safari prioritaires

À faire sur une origine HTTPS de test identifiée, avec données synthétiques et consentement du testeur pour ses données de test. La recette physique reste ouverte tant qu'elle n'est pas effectuée.

| ID | Geste concret | Preuve et oracle |
| --- | --- | --- |
| SF01 | Sur iPhone et iPad : ouvrir Safari normal, suivre les trois étapes, saisir avec clavier virtuel, tourner l'appareil, faire défiler puis modifier le dernier item | Aucun champ/bouton masqué par clavier, barre navigateur ou zone système ; scroll jusqu'aux actions, cibles longues lisibles ; saisie et choix conservés pendant les changements de vue |
| SF02 | Depuis Safari, utiliser Partager → ajout à l'accueil, choisir le mode app web quand proposé, lancer depuis l'icône ; tester aussi le raccourci navigateur si proposé | Captures du menu, version OS et comportement réellement observé ; pas d'installation déclarée par le seul clic dans FIL CLAIR. Même parcours utile dans l'onglet et dans l'app ; documenter séparément les données retrouvées [S3–S4] |
| SF03 | Sur Mac Safari : ajouter au Dock puis ouvrir l'app ; comparer avec l'onglet et transférer une fixture par export/import | Ne pas assimiler les stockages ; absence de synchronisation expliquée, pas de perte masquée par une vue vide. Vérifier export puis restauration dans le contexte souhaité [S6] |
| SF04 | Exporter une sauvegarde complète depuis onglet puis app installée ; retrouver réellement le fichier, vérifier sa taille/son JSON, importer avec le sélecteur Fichiers ; annuler puis réessayer le même fichier | Téléchargement local utilisable, pas seulement événement JS. Le fichier téléchargé doit restaurer les préférences et les listes ; annulation sans mutation et second choix du même fichier pris en compte. Apple indique Fichiers/Téléchargements comme point de recherche [S13] |
| SF05 | Refuser/interrompre une opération de sauvegarde, revenir à l'app, puis utiliser l'alternative explicite si le produit en propose une | Pas de message « sauvegardé » sans fichier réellement obtenu. Si une copie de texte locale est proposée, sélection/copie sur geste, sans transfert tiers ni permission imposée. Sans export utilisable, classer l'échec de sauvegarde comme bloquant ; ne pas inventer une alternative absente |
| SF06 | Faire le parcours en navigation privée, exporter avant fermeture, fermer tous les onglets privés puis rouvrir ; comparer avec le mode normal | Noter ce qui survit à chaque étape réelle. Message sur la fragilité du stockage local toujours accessible ; pas de promesse de conservation après session privée ni de détection privée supposée. La perte attendue d'une session explicitement temporaire n'est pas une corruption du stockage normal [S8] |
| SF07 | En mode persistant, enregistrer puis mettre Safari/app en arrière-plan, verrouiller, revenir, fermer/relancer ; répéter hors ligne après préparation du shell | Dernier état confirmé retrouvé, aucun doublon ou faux succès au retour. En mode temporaire, tester la reprise possible mais ne jamais promettre une survie à suspension/fermeture système |
| SF08 | VoiceOver réel sur iPhone/iPad et Mac : parcourir titres, étapes, groupes, cases, formulaires, erreur, item et actions ; terminer sans regarder l'écran | État sélectionné annoncé, nom de cible contextuel, changement d'étape compréhensible, message utile annoncé sans répétition intrusive, focus logique après ajout/retrait. Noter lecteur/version et observations. **NON TESTÉ ici** |

Sur iPad, ajouter une fenêtre étroite et le clavier matériel si disponible ; relever les conditions exactes. Sur Mac, noter les réglages effectifs de navigation clavier avant d'interpréter un Tab qui saute certains contrôles. Une différence de menu liée à la version doit conduire à corriger l'aide, pas à contourner les protections du navigateur.

## Accessibilité et présentation

Ajouter aux scans axe la nouvelle vue dans les états début, étapes suivantes, formulaire invalide, items longs, erreur de stockage et session temporaire. Conserver les `incomplete` comme actions de revue ; zéro violation automatique n'est pas une déclaration de conformité [S14].

Vérifications humaines à consigner : clavier seul et ordre de focus ; aucun contrôle focalisé entièrement masqué par un élément de l'application ; labels/groupes/erreurs compréhensibles ; lecture sans couleur seule ; contraste réel texte/contrôles sur chaque dégradé ; reflow à 320 px et zoom réel ; texte agrandi ; orientation ; cibles tactiles et espacement selon WCAG 2.2. Les critères de focus et de taille minimum sont respectivement 2.4.11 et 2.5.8 ; les exceptions doivent être examinées avant de conclure [S15]. Un contrôle de largeur ou une capture ne remplace pas ces manipulations.

## Ordre d'exécution et critères de décision

1. Figer le contrat et le SHA V2, adapter seulement les scénarios touchés et l'allowlist si un module est ajouté. Éprouver d'abord migration, limite de backup, non-écriture temporaire et absence d'action distante sur les trois moteurs.
2. Élargir le parcours/qualité à la nouvelle vue ; WebKit prioritaire, puis parité Chromium/Firefox. Garder les étiquettes d'émulation explicites. Conserver les preuves acquises sur code inchangé ; rejouer les contrôles concernés par une modification de persistance, core ou shell.
3. Exécuter Safari physique iPhone/iPad et Safari Mac, puis la matrice commerciale Android/desktop. Consigner un blocage matériel comme tel et poursuivre les autres cellules indépendantes.
4. Joindre les résultats au SHA et aux fixtures, puis décider dans le journal global. Perte silencieuse, écrasement de source, export inutilisable, cible envoyée hors de l'app, consentement temporaire absent ou action distante faussement confirmée bloquent la livraison concernée.

La mission exige appareils physiques et WCAG 2.2 AA pour sa sortie finale. Tant que les contrôles physiques, lecteurs d'écran, contrastes et autres critères nécessaires restent ouverts, **ne pas annoncer une compatibilité universelle validée, une recette Safari physique ou une conformité WCAG complète**. Ce protocole ne lève aucun gate CI, juridique, gouvernance ou publication existant.

## Sources primaires consultées le 2026-10-28

Les sources décrivent les produits ; les résultats de FIL CLAIR doivent venir des tests. Les pages d'aide évoluent : recontrôler les menus lors de la recette sur la version réellement disponible.

- **[S1]** Microsoft Playwright — [Browsers](https://playwright.dev/docs/browsers) : moteurs modifiés, canaux commerciaux et dépendance à l'OS.
- **[S2]** Microsoft Playwright — [Emulation](https://playwright.dev/docs/emulation) : portée des profils et paramètres simulés.
- **[S3]** Apple — [Turn a website into an app in Safari on iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).
- **[S4]** Apple — [Turn a website into an app in Safari on iPad](https://support.apple.com/guide/ipad/open-as-web-app-ipad8f1f7a29/ipados).
- **[S5]** Google web.dev — [Installation prompt](https://web.dev/learn/pwa/installation-prompt) : fallback quand l'événement manque. Page ancienne ; ses affirmations historiques sur les autres navigateurs iOS ne servent pas de matrice actuelle.
- **[S6]** Apple — [Use Safari web apps on Mac](https://support.apple.com/en-us/104996), version consultée publiée le 2 juin 2026 : ajout au Dock et données séparées.
- **[S7]** WebKit — [Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/), 10 août 2023 : quota, éviction et conservation non garantie.
- **[S8]** WebKit — [Private Browsing 2.0](https://webkit.org/blog/15697/private-browsing-2-0/), 16 juillet 2024 : navigation éphémère et protections.
- **[S9]** Mozilla — [Use web apps in Firefox for Windows](https://support.mozilla.org/en-US/kb/web-apps-firefox-windows), mise à jour affichée le 24 juin 2026.
- **[S10]** Google Chrome Help — [Use web apps — Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en), résultat officiel indexé consulté ; ouverture directe en timeout. [Version ordinateur ouverte](https://support.google.com/chrome/answer/9658361?hl=en). La recette doit confirmer les menus Android réels.
- **[S11]** Mozilla — [Use Web Apps with Firefox for Android](https://support.mozilla.org/en-US/kb/use-web-apps-firefox-android), mise à jour affichée le 4 juin 2025.
- **[S12]** Samsung Developer — [Web Development Guide](https://developer.samsung.com/browser/android/web-developer-guide.html) : contexte ancien explicite de versions 5/6 ; ne qualifie pas les menus actuels.
- **[S13]** Apple — [Where to find downloads on your iPhone or iPad](https://support.apple.com/en-in/102440), version consultée datée du 22 décembre 2025.
- **[S14]** Microsoft Playwright — [Accessibility testing](https://playwright.dev/docs/accessibility-testing) : limite des contrôles automatiques.
- **[S15]** W3C — [WCAG 2.2](https://www.w3.org/TR/WCAG22/) : référentiel de recette, pas preuve de conformité du produit.

## Annexe — reprise de l'environnement navigateur après reset

Extension de mission reçue de la coordination après rédaction du protocole : récupérer les moteurs locaux manquants, sans modifier les sources, les versions npm, les réglages OS ou installer de paquet système. **Seuls des smokes d'environnement sur une page HTML synthétique en mémoire ont été exécutés ici**, pas les scénarios V2 ci-dessus ni les anciennes suites PWA. Les fichiers de récupération sont temporaires ; ne pas relancer les téléchargements s'ils sont déjà intacts.

Environnement observé : Ubuntu 24.04.3 LTS x86_64, Node 24.22.1, Playwright 1.64.1. `npx playwright install --dry-run chromium-headless-shell firefox webkit` fournit les révisions attendues. La coordination a rapporté cinq échecs ZIP du CDN Chromium ; le fallback officiel utilisé antérieurement fournit cette fois une archive valide. Aucun changement de version n'est nécessaire.

| Archive officielle effectivement téléchargée | Taille | SHA-256 local, après contrôle CRC ZIP |
| --- | --- | --- |
| [Chrome Headless Shell 156.0.8078.4](https://storage.googleapis.com/chrome-for-testing-public/156.0.8078.4/linux64/chrome-headless-shell-linux64.zip), révision Playwright 1248 | 125 797 539 octets | `c3e50596aef52c58f8fda3c6b3411c33d34c88b177b3ed1c2243359fd3b8ba20` |
| [Firefox 157.0, révision 1555](https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/firefox/1555/firefox-ubuntu-24.04.zip) | 116 377 639 octets | `564f74fa3c46cb83c6252145cf1569c95236c8c404d6a5a80cc736cf32265f0c` |
| [WebKit 27.2, révision 2370](https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/webkit/2370/webkit-ubuntu-24.04.zip) | 108 122 739 octets | `63b31a5d68d908d9aee2e445b88edc4c1e1d1eba488f5bd7e35668f91315b968` |

Les empreintes sont celles des téléchargements observés, pas une signature indépendante publiée par le fournisseur. Les ZIP ont été extraits respectivement dans `/root/.cache/ms-playwright/chromium_headless_shell-1248`, `/root/.cache/ms-playwright/firefox-1555` et `/root/.cache/ms-playwright/webkit-2370`. Le moteur Chromium headless est présent ; cela n'installe ni ne qualifie Google Chrome commercial.

Firefox démarre mais sa première page crashe avec le sandbox de contenu par défaut du conteneur. Le réglage **local explicite déjà prévu par le helper**, `PWA_FIREFOX_NO_SANDBOX=1`, permet la page synthétique. Ne pas généraliser ce réglage à un navigateur utilisateur ou à une recette physique.

WebKit manquait de bibliothèques natives. Les bibliothèques ont été téléchargées depuis le snapshot Ubuntu officiel signé `https://snapshot.ubuntu.com/ubuntu/20260828T000000Z`, suites `noble`, `noble-updates`, `noble-security`, composants `main universe`, puis **extraites par `dpkg-deb -x`**, sans `apt install` ni `dpkg -i`. La clé utilisée est `/usr/share/keyrings/ubuntu-archive-keyring.gpg`. Le premier rafraîchissement isolait les listes mais héritait d'un hook de nettoyage système ; ce hook a rencontré un refus de permission. La configuration suivante isole aussi les fragments/hooks pour la reprise :

```conf
Dir::Etc::parts "/tmp/fil-clair-browser-recovery/apt/parts";
Dir::Etc::main "/dev/null";
Dir::Etc::sourcelist "/tmp/fil-clair-browser-recovery/apt/sources.list";
Dir::Etc::sourceparts "/tmp/fil-clair-browser-recovery/apt/sourceparts";
Dir::State::lists "/tmp/fil-clair-browser-recovery/apt/lists";
Dir::Cache::archives "/tmp/fil-clair-browser-recovery/apt/archives";
APT::Sandbox::User "root";
APT::Get::List-Cleanup "false";
Acquire::Check-Valid-Until "false";
Acquire::Languages "none";
```

Créer ces répertoires temporaires, dont `lists/partial` et `archives/partial`, et enregistrer cette configuration dans `/tmp/fil-clair-browser-recovery/apt/isolated.conf`. Le fichier `sources.list` contient trois lignes `deb [signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg] https://snapshot.ubuntu.com/ubuntu/20260828T000000Z SUITE main universe`, en remplaçant `SUITE` par chaque suite ci-dessus. Avec `APT_CONFIG=/tmp/fil-clair-browser-recovery/apt/isolated.conf`, `apt-get update` alimente les seuls index temporaires ; `apt-get download` lancé dans `/tmp/fil-clair-browser-recovery/deps` récupère les paquets. Le snapshot fixe les candidats ; les archives sont vérifiées par APT avant extraction.

Paquets effectivement récupérés, y compris dépendances transitives détectées par `ldd` et `libgles2` détectée par le journal de lancement dynamique :

```text
libabsl20220623t64 libavif16 libdw1t64 libelf1t64 libenchant-2-2
libevent-2.1-7t64 libgav1-1 libgles2 libgstreamer-gl1.0-0
libgstreamer-plugins-bad1.0-0 libgstreamer-plugins-base1.0-0
libgstreamer1.0-0 libgtk-4-1 libharfbuzz-icu0 libhyphen0
libmanette-0.2-0 liborc-0.4-0t64 libsecret-1-0 libsoup-3.0-0
libwayland-server0 libwoff1 libyuv0
```

Extraire les 22 `.deb` dans `/tmp/fil-clair-browser-recovery/deps/root`. Le wrapper officiel WebKit du bundle remplace `LD_LIBRARY_PATH` : une variable injectée avant `pw_run.sh` ne suffit donc pas. Le launcher temporaire `/tmp/fil-clair-webkit-launch.sh`, rendu exécutable, reprend les chemins WPE du bundle et ajoute les bibliothèques extraites :

```sh
#!/bin/sh
FIL_CLAIR_WK=/root/.cache/ms-playwright/webkit-2370/minibrowser-wpe
FIL_CLAIR_WK_DEPS=/tmp/fil-clair-browser-recovery/deps/root/usr/lib/x86_64-linux-gnu
export WEBKIT_EXEC_PATH="$FIL_CLAIR_WK/bin"
export WEBKIT_INJECTED_BUNDLE_PATH="$FIL_CLAIR_WK/lib"
export WEBKIT_INSPECTOR_RESOURCES_PATH="$FIL_CLAIR_WK/share"
export LD_LIBRARY_PATH="$FIL_CLAIR_WK/lib:$FIL_CLAIR_WK/sys/lib:$FIL_CLAIR_WK_DEPS${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export WEBKIT_FORCE_COMPLEX_TEXT=1
exec "$FIL_CLAIR_WK/bin/MiniBrowser" "$@"
```

Commandes d'environnement à utiliser par la coordination pour les seuls scripts nécessaires :

```sh
node scripts/test-pwa-flows.mjs
PWA_BROWSER=firefox PWA_FIREFOX_NO_SANDBOX=1 node scripts/test-pwa-flows.mjs
PWA_BROWSER=webkit PWA_EXECUTABLE_PATH=/tmp/fil-clair-webkit-launch.sh node scripts/test-pwa-flows.mjs
```

`test-pwa-flows.mjs` est le script V2 effectivement créé par la coordination ; les smokes ci-dessous restent limités à l’environnement et ne valent pas résultats de cette suite.

Smokes observés : Chromium **156.0.8078.4**, Firefox **157.0** et WebKit **27.2** ont chacun lancé un navigateur, créé une page, reçu un HTML synthétique par `setContent`, lu le titre `FIL CLAIR environment smoke` et le bouton `Fixture locale`, puis fermé proprement. WebKit a terminé ce smoke à **18:10:37 UTC, exit 0**. Son stderr conserve un avertissement `is-controlled-by-automation ... falling back to default session` ; la page est accessible, mais cette observation ne qualifie ni l'isolation des contextes applicatifs ni les parcours du produit. Les nouvelles suites et tous les contrôles physiques restent à exécuter par leurs responsables.
