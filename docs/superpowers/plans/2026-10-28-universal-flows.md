# Universal Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Main implements the shared state/UI; specialists research disjoint official sources and review the final changes.

**Goal:** Ajouter un carnet universel des flux avec onboarding simple et guides officiels, sans compte ni dépendance Google/Apple.

**Architecture:** Catalogue statique pur, modèle strict sans réseau, module UI séparé utilisant le snapshot/verrou existants. Aucun raccordement des adaptateurs API inactifs.

**Tech Stack:** JavaScript ES modules, HTML/CSS, Node test, Playwright Chromium/Firefox/WebKit, axe.

**Spec:** docs/superpowers/specs/2026-10-28-universal-flows-design.md

## Global Constraints

- Zéro dépense, inscription, synchronisation ou action sociale réelle.
- Sauvegardes anciennes préservées ; données corrompues récupérables ; plafond 10 Mo du snapshot.
- 500 fiches maximum ; cible texte 200 caractères ; statuts `planned`, `declared`, `local` seulement.
- Aucun statut API importable ; aucune cible transmise à un fournisseur ; guides explicites et facultatifs.
- Vérifications physiques, installation système, VoiceOver et WCAG complet toujours distinctes de l’émulation.

## Review Focus

- Import forgé, champs de secrets ou faux statut fournisseur : rejet atomique avec source récupérable.
- Désélection d’un service/catégorie : aucune perte des fiches existantes.
- Stockage/verrou refusé : aucun écrasement ; repli mémoire consenti et averti.
- Navigation clavier/zoom/longue cible : commandes nommées, focus conservé, pas de débordement.
- Chargement hors ligne : tous les modules locaux sont précachés ; aucune réponse fournisseur ni préférence dans le cache.

### Task 1: Catalogue et modèle local

**Files:** Create `pwa/platforms.js`, `pwa/flow-core.js`, `tests/flow-core.test.js`; modify `pwa/core.js`.
**Interfaces:** `PLATFORMS`, `CATEGORIES`, `getControl(platform,id)` ; `newFlows()`, `validateFlows(raw)`, `configureFlows(flows,platforms,categories)`, `addFlow(flows,{id,platform,control,target},now)`, `setFlowStatus(flows,id,status,now)`, `removeFlow(flows,id)`.
- [x] Écrire les assertions de catalogue, absence de Google obligatoire, portées distinctes, immutabilité, doublons/plafonds et sauvegarde stricte ; exécuter et constater RED.
- [x] Implémenter le catalogue sourcé et les fonctions pures, étendre parseBackup uniquement si flows présent.
- [x] Exécuter `npm test` : toute la suite verte ; consigner la sortie ; commit cohérent.

### Task 2: Onboarding, carnet et repli navigateur

**Files:** Create `pwa/flows.js`, `scripts/test-pwa-flows.mjs`, `scripts/test-pwa-replacements.mjs`; modify `pwa/app.js`, `pwa/index.html`, `pwa/styles.css`, `pwa/sw.js`, `scripts/pwa-test-utils.mjs`, `scripts/audit-pwa.mjs`, `scripts/test-pwa-sw.mjs`.
**Interfaces:** `mountFlows({getState,save,notify,navigate}) → {render,openSetup,resetDraft}` ; le module UI ne touche jamais au stockage directement.
- [x] Écrire E2E premier démarrage sans compte, trois étapes, choix modifiables, fiche locale, déclaration guidée confirmée/annulée, sauvegarde/restauration, offline et repli mémoire ; constater RED.
- [x] Implémenter UI responsive et accessible, navigation « Mes flux », repli mémoire consenti, cache v4 strict et aide installation/stockage.
- [x] Exécuter nouveaux parcours sur trois moteurs, puis matrice existante touchée par shell/persistence ; vérifier axe, reflow iPhone/iPad/Android émulés et absence de requêtes externes.
- [x] Commit du code/tests seulement après succès vérifié.

### Task 3: Documentation, recette et revue

**Files:** Modify mission, PWA README/privacy, docs de confidentialité/exploitation/connecteurs ; create `docs/UNIVERSAL_FLOWS.md`, `docs/USER_GUIDE.md`, `docs/evidence/2026-10-28-universal-v2.md` ; ajouter le nouveau test à la CI standard existante.
**Interfaces:** preuves locales datées et empreintes ; liens SHA de la mise à jour distante dans PR/Airtable.
- [x] Intégrer recherches officielles, matrice capacités/compatibilité, guide novice et limites concrètes.
- [x] Revue indépendante du diff V2, corriger défauts importants RED→GREEN, suite complète verte.
- [ ] Grouper les commits puis une mise à jour distante sous lease ; comparer l’arbre distant testé ; vérifier les deux CI gratuites sans les relancer inutilement.
- [ ] Lire déploiements/état branche ; mettre à jour mission, huit lots/recette et journal Fait/Ouvert/Vérifié comment/Périmé dans Airtable ; relire les écritures.

## Ledger

- Départ vérifié : HEAD98550a8, worktree propre sur branche de fonctionnalité ; deux CI vertes. Ne pas réexécuter un baseline déjà validé. Checkout dédié existant conservé pour éviter duplication et mélanges avec les documents de recherche des spécialistes.
- Préflight : Task1 produit flows validé pour Task2 ; Task2 écrit via persist existant, export/effacement couvrent les deux ; Task 3 qualifie les mêmes états sans transformer déclaration en preuve API.
- Décision : exécution native autonome demandée, spécialistes pour recherches indépendantes puis revue finale. Aucune attente d’approbation de conception additionnelle.

- Task 1: complet localement ; 8 nouveaux tests RED (fonctions/catalogue absents), puis suite 133/133 GREEN. Sortie /tmp/fil-clair-v2-unit.log ; commit produit modèle/catalogue séparé.
- Task 2: première tentative E2E bloquée par absence de binaires navigateur, aucun PASS produit attribué ; spécialiste QA restaure les binaires officiels sans modifier les dépendances.

- Task 2: complet localement : flux Chromium17/17, Firefox16/16, WebKit18/18 ; qualité30/30,29/29,30/30 ; anciens parcours/stockage/récupération/concurrence verts sur trois moteurs. Snapshot9 769 347 octets avec500 préférences multioctets restauré. Node133/133, SW8/8.
- Régressions constatées puis corrigées : reflow200% (378px/320), découpe Historique sur2lignes, ancien brouillon masquant une restauration (resetDraft explicite). Tests avant/après exécutés.
- Diagnostic offline : Firefox peut envoyer sw.js malgré émulation réseau. Le garde navigator.onLine ne suffisait pas à cet oracle ; le serveur HTTP est désormais arrêté pendant le parcours puis repris au même port. Les trois moteurs passent avec serveur effectivement arrêté, sans ignorer une URL de la comparaison.
- Corrections des oracles : sélecteur de fiches limité aux enfants directs (hors étapes imbriquées), fixture X réduite à15caractères et seed validée par parseBackup, attente de fin d’effacement avant lecture du stockage. Aucune de ces anciennes sorties rouges ne sert de preuve finale.

- Revue finale indépendante au candidat 91d1d1a : aucun Critical identifié, I1 brouillons/filtres sensibles après remplacement, I2 confirmation de restauration incomplète acceptés Important. Six scénarios échouent avant correction (5/11 PASS), puis11/11 GREEN sur chaque moteur ; suite complète relancée après les changements de persistance/UI.
- I1 corrigé : effacement/restauration réussis et mémoire consentie vident brouillons, filtres, sélections dépendantes et anciens nœuds ; annulations et refus de stockage les conservent. I2 corrigé : toutes données remplacées nommées, mémoire distincte, avertissement sauvegarde ancienne sans flux.
- M1 concernait le registre documentaire encore en consolidation dans Task 3 ; tableau14 modules/43 contrôles maintenant présent. Pas de nouveau chantier de finition ajouté.
- Décisions sur les éléments non certifiés par le reviewer : conserver toutes les portes physiques/menusfournisseurs/OAuth/juridique/gouvernancebudgetdéploiement/rollback/sécuritéexhaustive ouvertes, motifs et risques explicites dans docs/evidence/2026-10-28-universal-v2-review.md. Aucune seconde revue ne remplace ces preuves ; corrections vérifiées par régressions et suite.

- Instantané avant mise à jour distante : étapes de push/CI/cockpit consignées ensuite dans le bilan de PR#1 et la session Airtable pour éviter un push de preuve qui relancerait la CI. Source, tests et documentation livrés ensemble ; aucun statut distant anticipé.
