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
**Files:** Create `pwa/flows.js`, `scripts/test-pwa-flows.mjs`; modify `pwa/app.js`, `pwa/index.html`, `pwa/styles.css`, `pwa/sw.js`, `scripts/pwa-test-utils.mjs`, `scripts/audit-pwa.mjs`, `scripts/test-pwa-sw.mjs`.
**Interfaces:** `mountFlows({getState,save,notify,navigate}) → {render,openSetup}` ; le module UI ne touche jamais au stockage directement.
- [ ] Écrire E2E premier démarrage sans compte, trois étapes, choix modifiables, fiche locale, déclaration guidée confirmée/annulée, sauvegarde/restauration, offline et repli mémoire ; constater RED.
- [ ] Implémenter UI responsive et accessible, navigation « Mes flux », repli mémoire consenti, cache v4 strict et aide installation/stockage.
- [ ] Exécuter nouveaux parcours sur trois moteurs, puis matrice existante touchée par shell/persistence ; vérifier axe, reflow iPhone/iPad/Android émulés et absence de requêtes externes.
- [ ] Commit du code/tests seulement après succès vérifié.

### Task 3: Documentation, recette et revue
**Files:** Modify mission, PWA README/privacy, docs de confidentialité/exploitation/connecteurs ; create `docs/UNIVERSAL_FLOWS.md`, `docs/USER_GUIDE.md`, `docs/evidence/2026-10-28-universal-v2.md` ; ajouter le nouveau test à la CI standard existante.
**Interfaces:** preuves locales datées et empreintes ; liens SHA de la mise à jour distante dans PR/Airtable.
- [ ] Intégrer recherches officielles, matrice capacités/compatibilité, guide novice et limites concrètes.
- [ ] Revue indépendante du diff V2, corriger défauts importants RED→GREEN, suite complète verte.
- [ ] Grouper les commits puis une mise à jour distante sous lease ; comparer l’arbre distant testé ; vérifier les deux CI gratuites sans les relancer inutilement.
- [ ] Lire déploiements/état branche ; mettre à jour mission, huit lots/recette et journal Fait/Ouvert/Vérifié comment/Périmé dans Airtable ; relire les écritures.

## Ledger
- Départ vérifié : HEAD98550a8, worktree propre sur branche de fonctionnalité ; deux CI vertes. Ne pas réexécuter un baseline déjà validé. Checkout dédié existant conservé pour éviter duplication et mélanges avec les documents de recherche des spécialistes.
- Préflight : Task1 produit flows validé pour Task2 ; Task2 écrit via persist existant, export/effacement couvrent les deux ; Task3 qualifie les mêmes états sans transformer déclaration en preuve API.
- Décision : exécution native autonome demandée, spécialistes pour recherches indépendantes puis revue finale. Aucune attente d’approbation de conception additionnelle.

- Task 1: complet localement ; 8 nouveaux tests RED (fonctions/catalogue absents), puis suite 133/133 GREEN. Sortie /tmp/fil-clair-v2-unit.log ; commit produit modèle/catalogue séparé.
- Task 2: première tentative E2E bloquée par absence de binaires navigateur, aucun PASS produit attribué ; spécialiste QA restaure les binaires officiels sans modifier les dépendances.
