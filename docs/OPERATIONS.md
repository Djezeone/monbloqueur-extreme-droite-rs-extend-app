# FIL CLAIR — Exploitation, incidents et décision de livraison

Version de procédure : **2026-10-28, extension V2**. Périmètre : PWA locale, listes historiques, carnet universel et guides statiques, espace temporaire et preview isolée. Cette procédure prépare les gestes ; **elle ne fusionne, ne publie, ne déploie et ne restaure aucune ressource externe**. Le drill historique est local, gratuit et synthétique : [preuve et commande](evidence/2026-10-28-operations.md). Ses empreintes précèdent V2 ; il ne clôt pas les nouveaux parcours ni un downgrade.

Le carnet doit rester utilisable sans compte FIL CLAIR, Google, Apple ou autre fournisseur, sans extension ni abonnement, y compris avec zéro service externe sélectionné. Les aides de fournisseurs sont facultatives. Un guide peut nécessiter un compte chez ce fournisseur pour y effectuer la manipulation ; cela ne constitue pas une connexion du carnet ni une condition d’accès à « Local / autres services ». Une fiche locale ne filtre aucune autre application.

## Responsabilités et périmètre d’autorisation

| Rôle | État | Action attendue avant ouverture |
|---|---|---|
| Responsable du traitement / décision juridique | **Non renseigné** | Identifier le décideur, base légale, article 9, AIPD et traitement des violations |
| Responsable exploitation / support / astreinte | **Non renseigné** | Canal privé, suppléance, moyens d’accès et délai de réponse réaliste |
| Administrateur GitHub / Vercel | À identifier et vérifier via les permissions effectives | Moindre privilège, MFA, revue des accès, preuve du dépôt et projet concernés |
| Relecteur de livraison | À nommer | Vérifier un SHA exact, les tests et les réserves ; aucune auto-approbation implicite |

Travail autorisé par la mission : lecture, tests locaux réversibles, préparation de branche/PR et documentation. Rester dans une branche dédiée ; pas de push direct sur `main`, pas de fusion lorsque CI/QA est inconnue. Les tests utilisent des comptes fictifs et un transport simulé. Aucun achat, runner payant, dépense GitHub supplémentaire, Copilot, compte social réel ou secret dans les traces. Aucun nouveau service de surveillance, log drain, abonnement ou upload d’artefact/cache tant que le budget et la rétention ne sont pas connus.

Une future opération de production, modification irréversible, promotion de domaine, notification externe ou ouverture publique exige la décision autorisée correspondante. Une procédure prête ou un test local réussi ne la remplace pas.

## Registre de version et provenance du déploiement

Le domaine `https://fil-clair-pwa-preview.vercel.app/` mentionné dans la mission est un alias à vérifier ; **son nom ne prouve ni l’environnement Preview, ni la protection, ni le SHA servi**. Les URLs de branche suivent leur dernier déploiement. Pour une recette, conserver l’URL propre au déploiement et son identifiant fournisseur [V1].

Avant toute recette externe, relever en lecture seule et dater :

1. Dépôt, branche, SHA complet de 40 caractères, PR, état du worktree utilisé pour construire et fichier de verrouillage. Vérifier l’absence de modification non incluse dans le SHA testé.
2. Compte/équipe et projet Vercel, identifiant du déploiement, URL propre à ce déploiement, environnement, état `READY`, date, origine Git ou provenance de l’upload. Vérifier la correspondance au SHA via les métadonnées fournisseur, pas seulement le titre d’une page.
3. Répertoire de publication effectif, commande de build et version d’outil. Vérifier que seuls les fichiers PWA attendus sont servis ; pas de `.git`, fichiers d’environnement, sauvegardes ou rapports contenant des données.
4. Protection réellement applicable aux URLs testées, dont alias de domaine et ancien déploiement. Faire une requête sans session et une visite avec session autorisée ; enregistrer statut/redirection et écran observés, sans cookie ni lien de contournement secret. Une redirection d’authentification ne prouve pas le fonctionnement de l’application derrière elle.
5. Correspondance entre fichiers servis et artefact issu du SHA (empreintes ou comparaison documentée), contrôle du service worker et résultat des parcours synthétiques.
6. Lier ces preuves à la fiche de recette et au cockpit. Un alias ou statut d’un ancien SHA ne peut pas valider le head courant.

**État de cette procédure :** aucune provenance ou protection d’un déploiement externe n’a été attestée par le drill local. Reprendre les preuves de la session globale seulement si leur SHA et date correspondent. La documentation Vercel propose plusieurs périmètres de protection ; relire le réglage effectif, sans déduire la confidentialité du mot « preview » [V2]. Ne pas activer une option payante pour obtenir la protection.

## Supervision minimale sans collecte des listes ou préférences

Aucun agent de télémétrie ni tâche planifiée n’est créé par ce document. Réaliser ces contrôles manuellement après un déploiement autorisé, une mise à jour du SW et un incident. Le responsable doit décider la fréquence et l’outillage avant d’annoncer une surveillance continue.

| Contrôle | Informations admises dans la preuve | Déclencheur d’investigation / action |
|---|---|---|
| Disponibilité du shell autorisé | UTC, déploiement/SHA, chemin statique connu, statut HTTP, type MIME, durée agrégée du contrôle | Échec reproductible ou contenu inattendu : suspendre la recette, vérifier protection/CDN avant toute relance |
| Intégrité et sécurité des fichiers | Empreinte du fichier, résultat CSP, présence des seuls assets attendus | Script externe, redirection ou fichier inconnu : incident sécurité, ne pas réutiliser la session sensible |
| Service worker et mode hors ligne | Version du cache, installation/activation, chemins de shell, résultat du reload synthétique | Ancien cache ou échec d’installation : conserver les données locales, diagnostiquer avant de demander un effacement |
| Import / export / restauration / effacement | Résultat, code d’erreur générique, taille et comptes **de la fixture synthétique** | Corruption acceptée, perte silencieuse, export impossible : No-Go données |
| Carnet V2 et guides | Identifiant du contrôle statique, mode local/guide, résultat de scénario synthétique, compte de fiches et longueurs de fixture | Cible insérée dans une requête/URL, action exécutée à l’ouverture d’une aide, fausse confirmation API ou limite dépassée : No-Go carnet |
| Espace temporaire | Consentement de test, bannière visible, export synthétique, valeur persistante comparée avant/après sans en copier le contenu | Espace copié implicitement, écriture persistante, perte non annoncée ou effacement du mauvais espace : No-Go données |
| Connexion fournisseur future | Mode simulé, statut normalisé, délai / quota, identifiant de scénario de test | Résultat indéterminé ou 429 : arrêter la file, relire avant réémission, respecter le délai fournisseur |
| Coût / CI | Statut et URL d’un run réellement exécuté, quota constaté, minutes et stockage autorisés | Coût inconnu : pas d’ajout de runner, artefact, cache ou nouvelle exécution redondante |

Ne pas copier pseudos, titres de listes, cibles de fiches, sujets, sources, préférences, décisions, historique, texte brut importé, en-têtes `Authorization`/`Cookie`, paramètres OAuth, tokens ou clés dans logs, captures, issues, Airtable ou rapports. Ne pas hacher les pseudos ou les cibles pour les suivre : une empreinte stable resterait corrélable. Préférer des fixtures comme `drill_alpha`, `social.example` et « sujet synthétique ». Un rapport d’erreur utilisateur doit indiquer le navigateur, la version, la catégorie d’échec et les étapes, sans joindre automatiquement une sauvegarde.

Le catalogue V2, ses étapes et ses URL d’aide sont embarqués. Ses modules n’effectuent ni fetch de cibles, ni synchronisation, ni authentification ou mutation fournisseur. Les liens d’aide fixes utilisent `noopener noreferrer` et ne contiennent aucune cible personnelle ; leur ouverture transmet cependant au fournisseur les métadonnées normales de navigation et peut utiliser sa session. Ne pas activer un outil de suivi ni enrichir les liens avec une cible, un identifiant de fiche ou une chaîne de recherche pour mesurer les clics.

L’hébergeur peut traiter IP et métadonnées de requêtes même sans télémétrie applicative. Le responsable doit faire l’inventaire des journaux effectivement activés, accès, rétention et destinataires. Les durées des Runtime Logs ne décrivent pas tous les journaux possibles. N’activer aucun drain, analyse d’audience ou enregistrement de session pour compléter une preuve manquante [P1–P2].

## Procédure d’incident

| Priorité de travail | Exemple | Décision immédiate proposée |
|---|---|---|
| Sécurité / confidentialité | Script altéré, listes ou préférences sensibles publiées, secret dans un artefact, cible transmise dans une URL, mauvaise origine OAuth | Suspendre la livraison et toute connexion ; préserver des preuves minimales ; prévenir le responsable par le canal privé défini |
| Intégrité / perte de données | Démarrage corrompu, restauration destructrice, déclarations ressuscitées, `flows` perdu par ancien code ou mode mémoire réécrivant le stockage | Bloquer les écritures affectées ; préserver la valeur brute avant récupération ; reproduire avec une fixture |
| Disponibilité / interface | Shell indisponible, cache obsolète, navigation inaccessible | Vérifier provenance/protection puis reproduire ; garder le stockage utilisateur intact |

1. **Ouvrir le journal privé** avec identifiant, détection UTC, personne chargée, SHA/déploiement, symptômes, étendue connue et inconnue. Ne pas joindre la liste de l’utilisateur.
2. **Contenir sans destruction** : interrompre les opérations en cours, conserver l’état brut lorsqu’il est lisible, éviter `localStorage.clear()`, réinstallation ou effacement des caches comme premier geste. Une réponse réseau perdue après écriture sociale est indéterminée ; un abort n’annule pas nécessairement l’effet chez le fournisseur. Pas de retry aveugle.
3. **Préserver une preuve restreinte** : versions, enchaînement, messages expurgés, empreintes et exemple synthétique. Si un export utilisateur est exceptionnellement nécessaire, le responsable fixe avant collecte le canal protégé, les accès et la destruction ; ne pas le placer dans le dépôt ou le cockpit.
4. **Qualifier la violation** avec le responsable : confidentialité, intégrité et disponibilité, catégories de personnes, données exposées, conséquences possibles et mesures. L’absence de serveur de listes ne permet pas d’écarter automatiquement une violation.
5. **Décider les notifications** : le responsable applique les articles 33–34. Une notification à l’autorité est attendue, sauf absence de risque pour les droits et libertés, si possible dans les 72 heures après connaissance ; le risque élevé appelle l’information des personnes, sous les conditions du texte [R1]. Documenter l’analyse et les motifs, y compris en cas de non-notification. Aucun envoi n’est effectué par cette procédure.
6. **Corriger sur branche**, ajouter seulement la régression pertinente, exécuter les contrôles locaux et la revue. Préparer le rollback ou la récupération sans promouvoir de build.
7. **Fermer sur preuves** : cause établie, scope touché, données récupérées ou pertes explicites, version corrigée, résultats réels et décision autorisée. Conserver une action de prévention et réviser la notice/AIPD si le flux change.

**Gate externe :** aucun responsable ni contact d’incident opérationnel n’est renseigné aujourd’hui. Cette lacune bloque C PUBLIC ; l’existence de ce texte ne constitue pas une astreinte.

## Sauvegarde et restauration

La PWA n’a pas de serveur de sauvegarde des listes ou du carnet. Le point de reprise dépend du dernier JSON exporté par la personne. Une sauvegarde du navigateur ou du système est un service distinct. **RPO : dernier export complet disponible de l’espace concerné ; RTO réel : non mesuré.** Sans export, l’espace temporaire est entièrement perdu à sa fermeture/recharge. Aucune promesse de reprise en quelques minutes n’est faite à l’utilisateur.

### Snapshot V2 et mode temporaire

Le snapshot garde sa version externe 1 ; `flows` est un champ optionnel de version interne 1 : `setupComplete`, `platforms`, `categories`, `items`. Chaque fiche contient seulement `id`, `platform`, `control`, `target`, `status`, `createdAt`, `updatedAt`. Maximum : 500 fiches, cible de 1 à 200 caractères sur une ligne, 10 Mo pour le snapshot complet. Les catégories et contrôles viennent du catalogue statique ; la cible n’est pas utilisée pour construire un lien d’aide. Aucun champ de token ou confirmation fournisseur n’est admis dans le carnet. Les valeurs textuelles peuvent néanmoins contenir des données sensibles : ne jamais utiliser de données réelles dans une fixture.

En mode normal, anciennes listes et nouveau carnet partagent le même `persist`, le même verrou Web Locks et le même remplacement de snapshot. Si la lecture du stockage ou le verrou manque, les modifications persistantes sont suspendues. La lecture/export portent uniquement sur les données effectivement accessibles dans l’onglet ; un accès refusé ne permet pas de récupérer magiquement les données du navigateur.

Après avertissement et confirmation, le bouton d’espace temporaire démarre un `newState()` vide en mémoire. Il **ne copie, n’écrit ni n’efface les données persistantes**. La bannière doit rester visible ; les mutations et les restaurations concernent seulement cet espace, perdu à la fermeture/recharge. Exporter avant de partir. Ne pas présenter ce repli comme une sauvegarde automatique, une migration depuis le stockage inaccessible ou une persistance garantie en navigation privée.

### Sauvegarder

1. Utiliser l’export complet pour obtenir listes, déclarations, événements et `flows` lorsqu’il est présent. L’export de la seule liste active n’inclut pas le carnet et ne remplace pas cette sauvegarde. En mode temporaire, l’export complet concerne cet espace ; le bouton dédié peut produire `fil-clair-espace-temporaire.json`. Hors mode temporaire, si le démarrage a détecté des données illisibles, l’export complet donne plutôt `fil-clair-recuperation.json`, comme « Exporter la source de récupération » : texte brut non validé à préserver pour diagnostic, pas une sauvegarde présumée restaurable.
2. Conserver le JSON dans un emplacement protégé choisi par l’utilisateur. C’est un fichier en clair, sans chiffrement applicatif. Ne pas le téléverser dans GitHub, CI, Airtable ou Vercel.
3. Noter pour soi date, version de l’application et emplacement. Une empreinte locale permet de détecter une altération mais ne chiffre ni n’authentifie à elle seule le fichier.
4. Tester une copie **avec V2** dans un profil de navigateur distinct / origine de test sans données utiles. Comparer listes, comptes, provenance/révision, déclarations, historique et configuration/fiches `flows` attendues. Les statuts `planned`, `declared`, `local` ne sont jamais des confirmations API. Éprouver explicitement l’absence de champ `flows` pour une sauvegarde historique, et sa présence/restauration pour une sauvegarde V2 ; ne pas présenter ces deux cas comme un aller-retour validé vers une ancienne application.

### Restaurer

1. Préserver l’état actuel par un export, ou l’export brut de récupération si le démarrage détecte une corruption. Si le stockage est refusé, traiter d’abord le risque de perte en mémoire ; ne pas annoncer « enregistré » sur une écriture échouée.
2. Examiner le fichier hors de tout ticket public. L’import de liste est limité à 2 Mo ; une sauvegarde complète à 10 Mo, 30 listes, 5 000 profils par liste, 10 000 décisions et 1 000 événements. Le carnet optionnel est limité à 500 fiches et ses cibles à 200 caractères. La validation d’un `flows` présent est stricte ; un vieux fichier sans carnet reste admissible sur V2.
3. `parseBackup()` valide avant remplacement : version, schéma, identifiants, tailles, doublons, dates et statuts admis. Un fichier corrompu doit produire une erreur et laisser l’état précédent disponible. `loadState()` expose l’échec et le contenu brut ; l’UI intégrée conserve la valeur source et refuse les mutations ordinaires. Seuls une restauration validée ou un effacement explicitement confirmé autorisent ce remplacement.
4. Après cette validation, demander la confirmation du remplacement de l’espace courant. Une annulation garde cet espace. La restauration d’un fichier sans `flows` ne conserve pas le carnet remplacé. Une restauration réussie peut réintroduire d’anciennes données d’un export : prévenir la personne et les réexaminer. En mode temporaire, le remplacement reste en mémoire et ne modifie pas les données persistantes.
5. Vérifier la liste active, les comptes et métadonnées, les quantités, l’historique, les services/catégories et les fiches du carnet. En mode normal, vérifier après reload ; en mode temporaire, vérifier son export avant un reload qui doit perdre cet espace. Ne jamais convertir une ancienne déclaration ou une confirmation importée en preuve fournisseur fraîche.

Les écritures persistantes de la version actuelle sont sérialisées entre onglets par Web Locks et comparent la valeur brute chargée avant remplacement. Un onglet périmé refuse d'écrire et demande export/rechargement. Ne pas interpréter ce conflit comme une panne à contourner : conserver la vue exportée, relire la version courante puis réimporter volontairement les éléments utiles. L'absence de Web Locks ou une lecture initiale de stockage refusée suspend les modifications persistantes ; l'export des données accessibles reste disponible et l’espace temporaire exige un choix explicite. Fermer/recharger les onglets d'une ancienne version avant une mise à jour : un ancien script qui ignore ces verrous ou `flows` n'offre pas la même garantie. Les exports complets sont compacts pour respecter la même limite de 10 Mo que la restauration.
6. Supprimer uniquement les copies temporaires devenues inutiles et relevant de ce test. La suppression dans l’application ne retire pas les fichiers téléchargés ni leurs sauvegardes.

### Effacer

Le retrait d’un compte ou d’une liste purge ses décisions actives via `removeAccount()` / `removeList()` ; **les événements historiques sont conservés**, jusqu’à la limite de 1 000 ou l’effacement global. Réajouter le même profil ne doit pas réactiver une décision supprimée. La suppression de la dernière liste crée une liste personnelle vide, sans décisions, mais conserve le journal.

`removeFlow()` retire une fiche du carnet et sa déclaration, sans journal parallèle du carnet. Une autre fiche, une ancienne liste ou une copie exportée contenant une cible similaire ne disparaît pas pour autant. Désélectionner un service/catégorie garde les fiches existantes ; « Remettre à faire » change seulement `declared` en `planned`. Ces gestes ne débloquent, ne réabonnent et ne réautorisent rien chez un fournisseur ; même un guide de retrait d’exclusion doit être exécuté manuellement chez ce dernier.

En mode normal, « Effacer toutes mes données » persiste un `newState()` : listes vides, aucun carnet, aucune déclaration ni événement, si l’écriture locale réussit. En mode temporaire, ce même geste réinitialise seulement l’espace en mémoire ; **les données persistantes restent intactes**. Aucun de ces gestes ne supprime les téléchargements, caches applicatifs, journaux hébergeur ou données sociales. Pour retirer aussi stockage/caches/service worker, effacer les données de l’origine dans le navigateur et vérifier après fermeture/réouverture ; supprimer séparément exports, corbeilles et copies. La désinstallation seule n’est pas une preuve d’effacement. La recette Android/iOS physique demeure ouverte.

### Exercice effectué

Le drill daté antérieur à V2 a copié le `pwa/core.js` identifié par son empreinte dans un répertoire temporaire puis utilisé une `Map` pour **simuler** le stockage. Il a écrit et relu un JSON synthétique, vérifié l’aller-retour, le refus d’une corruption avant écriture, l’export brut récupérable, la conservation provenance/révision, la suppression des décisions sans résurrection, l’historique conservé au retrait et l’effacement global. Le fichier téléchargé simulé reste présent jusqu’au nettoyage explicite, ce qui démontre la séparation des deux périmètres.

**Limites :** pas de `flows` V2, de mode temporaire, de downgrade, de navigateur, de `localStorage` physique, de quota, de cache navigateur, de restauration Vercel, de rollback de domaine, d’OAuth ou de compte réel dans ce drill. Cette preuve ne clôt pas la recette V2 ou la reprise fournisseur. Voir les empreintes et la sortie exacte dans [la preuve datée](evidence/2026-10-28-operations.md).

La [preuve QA PWA antérieure](evidence/2026-10-28-pwa-qa.md) distingue les anciens résultats rouges de l’intégration et des empreintes alors testées. Elle ne qualifie pas automatiquement le carnet, le mode temporaire et le shell V4. La recette V2 doit produire ses preuves au SHA courant : zéro fournisseur choisi, 500 fiches/cible 200, statuts sans API, sauvegardes avec/sans `flows`, suppression/reset sans effet distant, liens d’aide fixes sans cible, mode mémoire neuf sans écriture persistante, perte au reload annoncée, export/restauration de cet espace et conservation du CSS de la notice. Ces tests ne remplacent ni les appareils physiques ni l’audit complet.

## Rollback d’un déploiement immuable — procédure préparée

Un rollback de fichiers servis **ne restaure pas** les données locales, ne défait pas un blocage social et ne retire pas automatiquement un ancien service worker actif. Les URLs de commit servent à identifier une version ; vérifier la politique de rétention des déploiements et l’éligibilité de la cible avant de compter dessus [V1, V3]. Aucun rollback externe n’a été exécuté ici.

**Risque V2 bloquant avant retour à une application antérieure au carnet :** la version externe du snapshot reste 1, mais le champ `flows` est optionnel. Un ancien parseur peut l’ignorer puis le supprimer de fait lors d’une réécriture. La lisibilité d’un fichier historique sur V2 ne prouve pas l’aller-retour inverse. Avant un tel rollback, exporter le snapshot complet depuis V2, vérifier la présence et les quantités de `flows` attendues et en tester la restauration dans V2 sur un contexte isolé. Conserver cette copie protégée pour la reprise V2. Un export fait après réécriture par l’ancienne application peut déjà être incomplet. **Sans sauvegarde V2 complète dont la restauration V2 est éprouvée, No-Go pour un downgrade risquant la réécriture. Aucun aller-retour via une ancienne application n’est déclaré vérifié ici.**

### Préparer une cible sans l’activer

1. Sélectionner un déploiement antérieur connu, immuable, dont l’identifiant et l’URL correspondent au SHA approuvé. Vérifier qu’il est encore disponible et compatible avec le format de données courant, dont `flows` et ses statuts. **Ne pas revenir à une version dont le loader effacerait silencieusement un état illisible ou perdrait le carnet lors d’une écriture.**
2. Comparer versions de schéma, champs optionnels, clés de stockage, verrous, cache SW, périmètre CSP et routes. Exporter intégralement l’espace V2 concerné et prouver sa restauration sur V2 avant toute réécriture par un ancien code ; les exports d’une seule liste ne suffisent pas. Fermer les anciens onglets et distinguer l’espace temporaire des données persistantes. Un rollback de shell peut obliger à une correction compatible plutôt qu’à une régression.
3. Relire les réglages et permissions effectifs : protection des previews et domaines, environnement, alias, variables non exposées et intégrations. Ne jamais copier leur valeur dans le rapport. Une ancienne configuration ou variable peut rester attachée au build.
4. Tester le déploiement cible **protégé** avec des fixtures, puis sans session pour vérifier le contrôle d’accès. Ne pas utiliser un secret de contournement dans une URL publiée. Enregistrer les réserves ; un shell refusé à l’authentification ne valide pas la PWA.
5. Préparer une fiche de changement : version en service, cible, domaine impacté, motif, compatibilité locale, preuves, décideur et retour possible. S’arrêter avant promotion / changement d’alias tant que l’opération n’est pas spécifiquement autorisée.

### Appliquer seulement après décision autorisée

1. L’administrateur autorisé relit les domaines et la cible dans Vercel. `Instant Rollback` concerne des déploiements déjà associés à la production ; une preview ordinaire n’est pas automatiquement éligible. Les droits et limites dépendent du plan [V3]. Aucun upgrade payant ne doit être entrepris pour le faire.
2. Exécuter une seule opération contrôlée et noter heure, identifiant source/cible et réponse réelle du fournisseur, sans secret. Pas de deuxième mutation en parallèle.
3. Vérifier depuis une session neuve la provenance servie, l’accès prévu, shell et notice ; tester le SW et les données préexistantes dans un contexte isolé. Le cache de l’ancien client peut continuer à servir des fichiers jusqu’à son cycle de mise à jour : ne pas promettre une bascule instantanée pour tous les appareils.
4. Surveiller les mêmes contrôles synthétiques et noter toute perte/non-récupération. Vercel peut désactiver l’affectation automatique de domaines après un rollback ; relire cet état avant tout futur déploiement [V3].
5. Revenir à la version corrigée seulement avec la même chaîne de preuves et une nouvelle décision. Ne pas utiliser une fusion Git comme mécanisme implicite de rollback ou de publication.

Le SW actuel précharge un shell explicite avec `credentials: "omit"` et `redirect: "error"` : une protection Vercel peut faire échouer son installation si les fichiers exigent une session. **La disponibilité d’une preview protégée n’est donc pas une preuve de mode hors ligne.** Valider ce comportement sans assouplir la protection ou mettre une page d’authentification, un callback ou une réponse privée en cache. Les ressources OAuth/API restent hors du shell autorisé ; toute modification demande une revue.

## Go / No-Go A SAFE, B CONNECT, C PUBLIC

**État au 2026-10-28 dans ce dossier : aucun Go global, aucune fusion, aucune publication.** Le drill couvre seulement son périmètre synthétique. Un critère partiellement prouvé reste ouvert ; une erreur de collecte de preuve ne devient pas un succès.

| Livraison | Critères à prouver pour le Go | État / blocages restant dans ce lot |
|---|---|---|
| **A SAFE** — parcours manuel et données locales | Tests unitaires/E2E au SHA courant ; accès au carnet sans compte/service imposé ; 500 fiches/cibles 200, guides sans cible transmise, mémoire neuve isolée ; import/export/restore/effacement incluant `flows` sans perte silencieuse ; récupération de corruption ; états déclarés ; shell hors ligne et exclusions ; revue sécurité ; preview dont provenance et protection sont vérifiées | Drill historique documenté ; il ne clôt pas V2. Résultats V2 navigateur/CI à rattacher à leur SHA ; downgrade non vérifié. Appareils physiques et audit complet non établis ici. **OUVERT, pas de Go de ce dossier** |
| **B CONNECT** — API officielles | Tous critères A applicables ; OAuth officiel complet, permissions minimales, identité liée au token et à l’instance, consentement explicite, révocation, exclusion caches/exports/logs ; tests timeout/quota/idempotence ; recette réversible sur comptes de test autorisés ; bases/cartographie à jour | Transports simulés et qualification documentaire ne prouvent pas une connexion. Comptes de test OAuth, choix de stockage des sessions et validation sensible/juridique **OUVERTS** |
| **C PUBLIC** — ouverture générale | Tous critères mission : CI verte réelle, pas de vulnérabilité critique/élevée non traitée, tests unitaires/E2E et Android/iOS physiques, WCAG 2.2 AA complet, données/restauration/effacement, API réellement vérifiables si proposées, incidents/rollback, notices et décision juridique, responsable/support opérationnels, revue et autorisation spécifique | Responsable/contact/base légale, décision AIPD, contrats/hébergement, preuves physiques/accessibilité et autorisation de publication **OUVERTS — No-Go public** |

Le contrôle d’accessibilité automatique ou l’émulation mobile ne remplace ni l’audit WCAG complet ni les appareils physiques. Une URL Vercel disponible ne remplace pas CI verte ou revue. Une CI locale ne remplace pas un run GitHub effectivement exécuté. Une analyse de dépendances sans vulnérabilité détectée ne certifie pas l’absence de toute vulnérabilité.

### Fiche de décision à compléter

```text
Date UTC :
Décideur / relecteur :
Livraison demandée : A SAFE / B CONNECT / C PUBLIC
PR / SHA complet :
Déploiement immuable / environnement / protection vérifiée :
Liens de preuves unitaires / E2E / CI / audit / appareils :
Résultat restauration / effacement / rollback réellement exercé :
Risques et gates ouverts :
Décision : GO limité au périmètre prouvé / NO-GO
Autorisation de mutation ou publication, si distincte :
Date et condition de réexamen :
```

Journaliser les évolutions au format **FAIT / OUVERT / VÉRIFIÉ COMMENT / PÉRIMÉ**. Indiquer explicitement lorsqu’un résultat concerne un ancien SHA, un test simulé ou un alias non vérifié. Le cockpit ne doit contenir que le statut, les risques et les liens de preuves expurgées ; aucun contenu utilisateur.

## Références primaires vérifiées le 2026-10-28

- **[R1]** [CNIL — RGPD, chapitre IV, articles 33–36](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).
- **[P1]** [Vercel — Privacy Notice](https://vercel.com/legal/privacy-notice), informations des utilisateurs finaux et limites de son périmètre contractuel.
- **[P2]** [Vercel — Log Drains Reference](https://vercel.com/docs/drains/reference/logs), capacités de journaux statiques et de requêtes, sans présumer leur activation.
- **[V1]** [Vercel — Accessing Deployments through Generated URLs](https://vercel.com/docs/deployments/generated-urls), distinction URL de commit / alias de branche et rétention.
- **[V2]** [Vercel — Deployment Protection](https://vercel.com/docs/deployment-protection), périmètre à vérifier dans le projet.
- **[V3]** [Vercel — Performing an Instant Rollback on a Deployment](https://vercel.com/docs/instant-rollback), éligibilité, configuration conservée et état après rollback.
