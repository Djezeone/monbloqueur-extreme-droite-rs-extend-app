# Local data lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Empêcher les réintroductions après remplacement, la perte d'un nouveau brouillon et la réactivation d'une déclaration orpheline.

**Architecture:** Conserver le snapshot, le protocole de persistance et les parcours existants. Ajouter une mutation pure de profil et périmer les seules continuations d'import appartenant à un espace remplacé.

**Tech Stack:** JavaScript ESM, Node24, Web Locks/IndexedDB existants, Playwright1.64.1 sans dépendance nouvelle.

**Spec:** `docs/superpowers/specs/2026-10-30-local-data-lifecycle-design.md`

## Global Constraints

- 0 € supplémentaire ; aucune action sociale réelle, fusion main ou publication générale.
- Format de sauvegarde et compatibilité historiques conservés ; aucune purge générale des décisions orphelines.
- Refus ou annulation conserve données et brouillons ; aucune confirmation fournisseur créée.
- Réutiliser le worktree isolé et créer une branche dédiée ; désactiver son déploiement Git Vercel.

## Review Focus

- Même identifiant avec casse/instance différentes : seule la bonne décision doit être retirée.
- Changement de plateforme pendant une sauvegarde : le nouveau brouillon et le focus doivent rester disponibles.
- Import tardif d'une sauvegarde complète : aucune confirmation ni remplacement dans un nouvel espace.
- Effacement refusé/annulé et mutation ordinaire : l'import toujours autorisé doit pouvoir terminer.
- Deux fichiers en lecture : la continuation ancienne ne vide pas le sélecteur du plus récent.

## Task 1: Ajout de profil et brouillons pendant une sauvegarde

**Files:** `pwa/core.js`, `pwa/app.js`, `pwa/flows.js`, `tests/pwa-core.test.js`, `scripts/test-pwa-data-lifecycle.mjs`.

**Interfaces:** Produire `addAccount(state, listId, input) -> nextState`, mutation pure normalisée, doublon inchangé, maximum5000 ; conserver autres données/historique et retirer seulement la décision du profil nouvellement ajouté. Les signatures `persist`/`mountFlows` restent inchangées.

- [x] Écrire les tests Node : orpheline matching retirée, autres décisions/historique conservés, doublon conservé et liste inexistante/limite refusées ; exécuter et constater RED avant implémentation.
- [x] Écrire les scénarios navigateur : ajout orphelin à faire ; nouveau brouillon compte/flux et changement de contexte/focus pendant un vrai Web Lock ; nettoyage normal et refus préservés. Exécuter RED sur les défauts.
- [x] Implémenter la mutation et son appel dans l'ajout UI ; ne vider/focaliser que les valeurs encore soumises et le focus restant dans le formulaire.
- [x] Exécuter tests ciblés puis `npm test` ; résultat attendu : aucun échec. Commit cohérent du correctif.

## Task 2: Imports périmés par remplacement réussi

**Files:** `pwa/app.js`, `pwa/sw.js`, `scripts/test-pwa-data-lifecycle.mjs`, `.github/workflows/fil-clair-pwa.yml`, `vercel.json`, `pwa/vercel.json`, docs mission/queue/utilisateur/opérations/confidentialité et preuves datées.

**Interfaces:** Compteur privé de génération d'espace ; capturer avant lecture, vérifier après chaque attente d'E/S et dans le traitement d'erreur ; incrémenter seulement dans `applyState(..., true)`. Aucun import/export de génération.

- [x] Écrire puis exécuter RED : fichier/liste publique/sauvegarde tardifs après effacement, restauration et mode temporaire, erreur tardive et fichier plus récent ; contrôles de non-annulation sur refus/annulation/mutation ordinaire.
- [x] Garder les contrôles de génération dans le fichier existant ; refuser sans écriture ni confirmation les continuations périmées. Ne vider que le fichier effectivement traité.
- [x] Bumper le shell, inscrire le scénario dans les trois moteurs CI existants, désactiver seulement la nouvelle branche Vercel ; aucun nouveau workflow/runner/cache/artifact.
- [x] Exécuter `npm test`, les tests SW/audit/liste/registre puis le scénario navigateur et les suites de régression pertinentes ; relever moteurs, logs et limites réels.
- [ ] Mettre à jour mission/queue/guide/opérations/confidentialité, empreintes et journal Fait/Ouvert/Vérifié comment/Périmé. Revue indépendante de toute la branche, une passe corrective RED→GREEN si nécessaire, puis commit.
- [ ] Vérifier gratuité du scénario GitHub public standard ; pousser les commits en un lot, créer une PR draft dépendante de #5, lire les deux CI au head exact et mettre à jour/re-lire Airtable. Aucun déploiement ni merge.

## Ledger

Baseline : arbre propre au0445454,226/226 tests Node ; cinq PR draft inchangées, deux CI PR5 success tentative1. Main protected:false/rulesets0 ; trois anciens déploiements Vercel, aucun du head. Cockpit8lots/8portes relu. PlanPro connu mais capacité gratuite non établie ; la queue antérieure disant « plan non établi » est périmée.

Pre-flight : Task1 et Task2 partagent `pwa/app.js`, sans changement de signature `persist`/`applyState`. La génération ne change que dans le chemin de remplacement réussi ; les valeurs du formulaire sont capturées après normalisation du lien profil. Les deux correctifs n'ajoutent aucune voie de persistance.

Ruling : regrouper les deux tâches d'implémentation dans un commit cohérent, car elles partagent le même fichier et le même shell — chaque groupe garde sa preuve RED→GREEN — coût si mauvais : granularité de cherry-pick plus large, sans écriture supplémentaire ni migration.

Task1 : implémenté, modèle4RED→4GREEN, six scénarios de brouillons GREEN et profil UI inclus dans21/21 par moteur ;230/230Node.

Task2 : implémenté,16FAIL/21 avant correctifs→21/21 sur trois moteurs ;9/9SW et audit/registre/liste. Non-régression locale élargie interrompue par déconnexion exec :16scripts complets conservés, trois incomplets sans verdict ; matrice complète à qualifier en CI standard gratuite, sans relancer localement les scripts déjà réussis. Revue finale et clôture distante à suivre.

Final : revue indépendante18fichiers/0Critical/0Important/1Minor ; Ruling : focus regradéImportant, car la redirection peut envoyer le prochain geste clavier dans un autre champ — aucune perte de données constatée extrapolée. Une passe corrective : test focus1RED→GREEN, deux frontières import2RED sur base044→GREENcourant ;24/24 par moteur,230/230Node,9/9SW. Aucun mineur différé. Les points non jugés et leurs coûts sont consignés dans docs/evidence/2026-10-30-local-data-review.md ; gates de production maintenues.

CI ultérieure : PWA40983277220cancelled après20min au036e66b, extensionsuccess. Ruling : traiter le blocage reproduit d'un socket HTTP sans requête comme défaut de fixture, sans affirmer disposer d'une trace TCP du runner — fermer seulement les sockets possédées par le serveur de test ; coût si mauvaise attribution : autre cause de CI encore à diagnostiquer, aucune qualification globale inventée. Aucun changement du timeout ni de la PWA. Deux régressions finales échouent sur l'ancien helper, puis passent ; oracleECONNRESET attendu côté client corrigé et échec conservé.232/232Node,9SW,14/14V3.2chaque moteur aprèsfix. Ajouter traces de progression seulement ; nouvelleCI au nouveauSHArequise. La nouvelle attestation conserve l'ancien snapshot et l'identité des fichiers PWA. Aucun second relecteur : correction de fixture issue de la CI, tests RED→GREEN explicites.


CI998 : PWA40986303042success, journal272767caractères lu (232Node,9SW,36scripts,72casdonnées). Extension40986302996failure, log67550lu : première observation tabs.active false après VérifierX, assertion immédiate ligne258. Ruling : attendre l'état réel de l'onglet exact invalid.job.tabId avec expect.poll, sans accepter false ni ajouter un délai fixe ; risque si mauvaise attribution : échec permanent toujours visible en CI. Aucun produit/workflow changé. Nouveau head canonique construit via GitHub après indisponibilité de l'environnement local ; contenu UTF8 du blob relu et comparé exactement, sans faux SHA local ni test local inventé. Le Chrome persistant local avait échoué sur AF_UNIXEPERM ; pas de contournement ni d'E2E local extension. Le nouveau head doit passer les deux CI,0/8portes candidat jusque-là.
