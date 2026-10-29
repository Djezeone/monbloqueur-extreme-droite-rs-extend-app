# FIL CLAIR V3.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parcours visuel, assistance locale et unique entrée CONTRIB.OS indépendante.
**Architecture:** Catalogue et snapshot existants, fonctions pures pour le lot, modules UI sans transport. Configuration publique de soutien désactivée par défaut.
**Tech Stack:** JavaScript natif, Node test, Playwright/axe déjà verrouillés ; aucune dépendance nouvelle.
**Spec:** docs/superpowers/specs/2026-10-29-v32-guided-help-design.md

## Global Constraints
- Budget supplémentaire0€ ; aucun achat/IA API/connexion sociale/main merge/publication générale.
- Maximum500fiches,200caractères,32événements et10Mo inchangés.
- Sources, déclarations et preuves fournisseur distinctes ; aucune identité de source inventée.
- Tests physiques, WCAG complet, OAuth réel et déploiement restent des portes indépendantes.

## Review Focus
- Doublon déjà déclaré : garder son historique, ne pas le remettre à faire.
- Erreur de limite ou refus de stockage : aucune insertion partielle, brouillon conservé.
- Remplacement d'espace : supprimer nom/recherche/brouillons de l'ancien espace.
- Retour/aide/clavier : conserver le contexte et restaurer le focus.
- Soutien mal configuré/hors ligne : aucune navigation automatique ni donnée transmise, carnet utilisable.

### Task 1: Modèle de parcours et configuration
Files : créer pwa/guided-core.js, pwa/support-config.js, pwa/help-data.js ; tests/guided.test.js, tests/help-support.test.js.
Interfaces : buildGuidedPlan(flows,{category,target,platforms,selections},now,idFactory) retourne {flows,added,existing}; guidedOptions(category,platforms) expose uniquement le catalogue. supportDestination(config) retourne URL revue ou null. searchHelp(query,system) reste pure.
- [x] RED : lots atomiques, doublons/500, sélection invalide/confirmée, configuration HTTPS et recherche locale.
- [x] GREEN puis npm test complet ; commit52af387,151/151.

### Task 2: Interface et assistance
Files : créer pwa/guided.js, pwa/help.js ; modifier app.js,index.html,styles.css,flows.js si nécessaire.
Interfaces : mountGuided({getState,save,notify,navigate,onSaved}) avec open/reset ; mountHelp() avec reset ; montage sans réseau/stockage. Reprendre le carnet existant après enregistrement.
- [x] UI quatre étapes, détails accessibles, résultats dans carnet existant, soutien secondaire ; E2E créés après ce montage, sans revendication TDD préalable pour l'UI.
- [x] Tester refus/annulation et remplacement d'espace ; pas d'URL sensible. Bugs offline/quota/layout/concurrence et revue ont leurs RED→GREEN conservés.

### Task 3: Cache et recette
Files : sw.js (version6 et allowlist exacte), utils/tests SW/audit et workflow existant, scripts/test-pwa-v32.mjs ; docs/evidence/v32/.
- [x] Ajouter seulement ressources publiques nécessaires ; tester exclusions OAuth/API/auth/cross-origin.
- [x] Exécuter unitaires/sécurité et E2E nouveaux + régressions trois moteurs ; archiver résultats/empreintes et réserves exactes.

### Task 4: Livraison traçable et cockpit
Files : mission/guide/architecture/ops/privacy et docs/evidence/2026-10-29-v32-guided-help.md.
- [x] Revue indépendante si outils disponibles, sinon self-review explicite et limitation ; traiter écarts importants avec régressions.
- [ ] Commits groupés, branche/PR draft dépendante#2, une publication Git pour éviter CI redondante ; vérifier arbres et deux runs gratuits existants.
- [ ] Actualiser8lots/8portes/session Airtable, relire ; prouver ou signaler absence de déploiementVercel ; laisser A/B/C ouvertes.

## Ledger
- Préflight : arbre propre b3b0660, baseline144/144. Interfaces1→2→3 partagées décrites ci-dessus ; aucune contradiction.
- Décision : branche dédiée dans checkout propre existant ; pas de nouvelle copie du dépôt. Méthodes de questions intermédiaires écartées par mandat d'autonomie explicite.
- Deux agents ont atteint leur limite Work ; aucune relance payante. Leurs observations ne valent pas recette et seront revérifiées avant usage.
- Ruling : échec WebKit réel de concurrence observé (deux formulaires vidés, une seule addition relue dans un troisième onglet). La trace ciblée suivante passe et ne démontre pas la cause exacte. Injecter lecture périmée et absence d'événement pour éprouver le défaut du contrôle localStorage seul. Ajouter une empreinte SHA256 transactionnelle IndexedDB avant écriture, sans copie du carnet ni clé secrète. Web Locks reste requis. Coût si indisponible/interruption : écriture refusée, lecture/export et espace temporaire consenti ; ne pas perdre de données pour préserver la disponibilité. Cette modification de sécurité prime sur le périmètre UI initial.
- Ruling : Vercel ne fournit pas le plan/capacité et le navigateur exige login. Désactiver uniquement les déploiements Git automatiques de la branche V3.2 dans la configuration, sans modifier les autres branches, les protections ou un domaine. Aucun déploiement manuel avant qualification du coût.
- Final review : revue indépendante, aucun Critical trouvé ; I1 gel de sauvegarde lente, M1 état conservé du doublon. M1 reclassé Important : risque d'incitation à refaire un geste distant, alors que le statut est déjà déclaré. Deux régressions RED vérifiées avant une seule passe de correction4f51658 ;14/14 ciblés par moteur après correction. Aucune seconde revue revendiquée, aucun Minor différé.

- Vérification finale locale : 151/151 Node,9/9 SW+audit,27/27 suites au contenu0fafbfa,14/14 V3.2 et6/6 concurrence chacun ;81scans axe,0violation et69incomplets.69hashes source et27logs vérifiés. Réserves distantes (publication de branche/CI/cockpit) suivies dans la PR finale sans poussée documentaire supplémentaire.
