# FIL CLAIR V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intégrer quatre accès universels, un suivi vérifiable et un registre d'effets documentés dans la PWA existante.

**Architecture:** Catalogue V2 conservé ; registre public et projection commune séparés du snapshot personnel. Historique optionnel strict et borné, écritures existantes atomiques, aucun connecteur activé.

**Tech Stack:** JavaScript natif, node:test, Playwright/axe existants, PWA statique.

**Spec:** `docs/superpowers/specs/2026-10-29-universal-v3-design.md`

## Global Constraints
- 0 € supplémentaire, aucun service GitHub payant/Copilot/crédit premium ; CI standard publique sans uploads redondants.
- Aucun blocage/signalement réel, automatisation clandestine, secret, fusion ou publication générale.
- Snapshot fil-clair-v1 et flows.version:1, 500 fiches/200 caractères, 32 événements par fiche, plafond 10 Mo.
- Local sans compte obligatoire ; statut déclaré jamais transformé en confirmation API ; sources documentaires séparées des preuves d'action.
- A/B/C et les huit lots/portes V2 restent ouverts selon leurs réserves, profils émulés ne valent pas appareils physiques.

## Review Focus
- Ancienne sauvegarde sans events : source et données intactes, aucun faux passé créé.
- Import d'événement confirmé, date falsifiée ou champ secret : refus global avec récupération brute.
- Catégorie désélectionnée avec fiches existantes : fiches conservées et accessibles dans le carnet.
- Retour arrière suivi annulé/échec : état local seulement, avertissement explicite avant déclaration sensible.
- Registre périmé et source annonce ancienne : confiance documentaire/date visibles, aucune preuve compte ou effet global déduit.

### Task 1: Modèle commun et historique sûr
**Files:** `pwa/flow-core.js`, `pwa/actions.js`, `tests/action-model.test.js`.
**Interfaces:** `actionRecord(item) -> {service,nature,scope,method,state,verification,date,revocation,history}` ; `undoFlowStatus(flows,id,now) -> flows`, `setFlowStatus` enrichi ; `flowMetrics(flows) -> counts`.
- [ ] Écrire tests : projection déclarée non confirmée, échec/revue/annulé, undo, limite32, immutabilité, V2 sans événements, import falsifié et borne500.
- [ ] Exécuter `node --test tests/action-model.test.js`, constater fonctions absentes/statuts refusés.
- [ ] Implémenter schéma optionnel strict, seed connu seulement, journal borné et projection sans réseau.
- [ ] Exécuter `npm test` ; attendu aucun échec. Commit cohérent modèle/tests.

### Task 2: Registre documentaire maintenable
**Files:** `pwa/effects.js`, `tests/effects.test.js`, `docs/research/2026-10-29-x-algorithm.md`, `docs/research/2026-10-29-effects-register-audit.md`.
**Interfaces:** `getEffect(service,control) -> effect|null`, `registryEntries() -> effect[]`, `reviewState(effect,asOf)`, `X_ALGORITHM_EVIDENCE` (source figée, valeurs et réserve).
- [ ] Écrire tests : 43 contrôles exacts, URL officielle/aucun secret, sources/date/confiance/échéance, API inactive/scopes explicites, révocation prudente, formule X et absence de promesse de pénalité globale.
- [ ] Constater RED module manquant, puis implémenter à partir des recherches officielles réutilisées/revérifiées, sans requalifier les comptes.
- [ ] `npm test` ; attendu vert. Commit registre/tests.

### Task 3: Expérience quatre entrées et suivi intégré
**Files:** `pwa/index.html`, `pwa/styles.css`, `pwa/app.js`, `pwa/flows.js`, `pwa/sw.js`, `scripts/test-pwa-v3.mjs`, scripts QA existants selon contrats affectés, `scripts/audit-pwa.mjs`, `.github/workflows/fil-clair-pwa.yml`.
**Interfaces:** `mountFlows` conserve render/openSetup/resetDraft ; expose `openCategory(id)` ; registre intégré à Mes flux, sans requêtes fournisseur. Compteurs sans étoiles, historique et détails accessibles.
- [ ] E2E RED sur accueil quatre entrées et action/suivi ; assertions sauvegarde/restore, catégorie masquée conservée, registre périmé/absence de preuve fournisseur, cible non transmise, undo, offline.
- [ ] Implémenter UI avec détails avancés secondaires et confirmation ; ajouter actifs publics au SW et au contrôle statique sans nouvelle origine CSP.
- [ ] Exécuter nouveau script puis sept scripts de non-régression sur Chromium/Firefox/WebKit et Node/SW/audit. Examiner chaque échec, corriger cause sans affaiblir les oracles. Commit UI/tests.

### Task 4: Recette, revue, documentation et traçabilité
**Files:** mission, guide utilisateur, architecture/matrice/registre V3, confidentialité/opérations, journal et logs `docs/evidence/v3/`.
- [ ] Documenter résultat/limites/32événements/retour local/modèle, sources X exactes, matrice réelle/API inactive et compatibilité honnête.
- [ ] Revue indépendante de toute la branche ; Critical/Important corrigés en un passage RED→GREEN puis suites affectées vertes ; différés explicites.
- [ ] Vérifier empreintes, liens, worktree ; commit docs/preuves. Publier branche et PR draft dépendante de #1 en une mise à jour cohérente.
- [ ] Lire CI au SHA exact sans relance inutile, Vercel/absence de nouveau déploiement, mettre à jour huit lots/huit portes et nouvelle session Airtable Fait/Ouvert/Vérifié comment/Périmé puis relire.

## Ledger
Pré-vol : Task1 produit le modèle/statuts consommés par Task3 ; Task2 produit getEffect et sources consommés par Task1/actionRecord et Task3. Pour éviter cycle, actionRecord conserve les métadonnées d'action du catalogue et lit getEffect seulement une fois Task2 intégrée ; aucune copie modifiable côté snapshot.
Ruling : exécution native dans le checkout dédié avec deux spécialistes documentaires, puis revue indépendante — les changements UI/modèle partagent trop d'interfaces pour des implémentations concurrentes.
Transition V2 : 29/10, PR#1 au51abcd3, deux CI success et0artefact, cockpit8lots/8portes relu, sessionrecSl5qjw0wmOQvyg. Blocages consignés dans la spec ; V3 autorisée sans automatisation future programmée.
