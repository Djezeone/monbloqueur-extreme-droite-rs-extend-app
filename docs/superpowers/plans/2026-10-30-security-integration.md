# Sécurité CI et consolidation V3.2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Qualifier un agrégat des six PR et supprimer les chemins de publication ou d'écriture non admissibles sans rejouer les fonctionnalités acquises.
**Architecture:** Conserver les 40 commits existants au tip 0af61de. Modifier seulement les workflows historiques et le verrou de déploiement ; conserver le shell et les connecteurs inactifs.
**Tech Stack:** Node 24, GitHub Actions standards publics, PWA statique, Playwright.
**Spec:** docs/WORK_MISSION_FIL_CLAIR.md, mandat utilisateur « Corrections, intégration, industrialisation et livraison » du 30 octobre 2026.

## Global Constraints
- Budget supplémentaire : 0 €. Aucun compte social réel, connecteur non qualifié ou secret publié.
- Main protégée, CI du SHA exact, recette et rollback avant fusion/production.
- A SAFE peut être livrée seule si ses portes propres sont franchies.
- Conserver les six branches/PR et les preuves historiques ; ne pas assimiler Linux/émulation à un appareil.
- L'autorisation d'exécution autonome et de branches/PR/fusions admissibles est explicite : ne pas redemander un choix d'exécution ou une validation intermédiaire.

## Review Focus
- Une nouvelle branche non nommée dans les anciennes exceptions Vercel ne doit pas déclencher un déploiement.
- Un événement tag/dispatch ne doit pas publier un code non qualifié ni stocker des artefacts facturables.
- Le tableau obsolète doit échouer, sans pousser directement sur main ni conserver des credentials.
- La consolidation ne doit ni dupliquer les 40 commits ni réactiver les connecteurs.
- Les preuves d'un ancien SHA et une checklist documentaire ne doivent pas devenir des PASS du candidat.

## Task 1: Inventaire et chaîne
**Files:** docs/evidence/2026-10-30-integration-audit.md, docs/evidence/integration/initial-state.json.
**Interfaces:** Consumes: GitHub PR/main/runs, git ancestry. Produces: référence 0af61de, main b7cd31b et matrice des six PR.
- [x] Relire mission et état distant.
- [x] Vérifier 40 commits/patch-id uniques, dépendances et absence de conflit sans merge de refs.
- [ ] Consigner les deux audits et les blocages, notamment accès admin et coût Vercel.
Expected: six PR ouvertes inchangées ; agrégat contient leurs têtes.

## Task 2: Livraison CI en lecture seule et verrou de coûts
**Files:** .github/workflows/release.yml, .github/workflows/tableau.yml, vercel.json, pwa/vercel.json, tests/ci-hardening.test.js.
**Interfaces:** Consumes: mêmes commandes build/tests/générateur existants. Produces: aucun workflow d'écriture/publication/cache/artifact ; Git deploymentEnabled=false dans les deux racines.
- [ ] Écrire les régressions de politique et la fixture du vrai générateur --check.
- [ ] Observer RED sur la configuration historique.
- [ ] Remplacer release par une préparation manuelle sans publication ni artefact ; figer les actions conservées et refuser les credentials persistants.
- [ ] Remplacer tableau par sa vérification --check existante avec contents:read.
- [ ] Verrouiller globalement les deux configurations Git Vercel, sans modifier les headers.
- [ ] Observer GREEN puis suite complète, audit npm et build/lint.
Expected: aucune écriture Git/release ni stockage CI ; tableau correct PASS, tableau obsolète FAIL sans réécriture.

## Task 3: Qualification et intégration admissible
**Files:** docs/GITHUB_GOVERNANCE.md, docs/DELIVERY_QUEUE.md, docs/OPERATIONS.md, docs/WORK_MISSION_FIL_CLAIR.md et journal daté.
**Interfaces:** Consumes: artefacts exacts du Task 2, six têtes inchangées. Produces: PR agrégée vers main, preuves au SHA, cockpit avec PASS/FAIL/BLOCKED/NOT TESTED explicites.
- [ ] Baseline installé 232 Node ; conserver l'échec initial d'environnement @playwright/test absent.
- [ ] Auditer dépendances/secrets/headers/code avec limites.
- [ ] Qualifier les nouveaux workflows et le périmètre applicable ; nouvelle revue indépendante avant mise à disposition.
- [ ] Publier une seule mise à jour cohérente de branche après verrou Vercel, aucune CI redondante.
- [ ] Lire les deux CI du SHA exact et vérifier qu'aucun déploiement involontaire n'a été créé.
- [ ] Appliquer main seulement si une session admin autorisée est accessible ; sinon documenter sans contournement.
- [ ] Preview/production/fusion uniquement si coûts et portes franchis ; sinon poursuivre les tâches indépendantes et consigner NO-GO.
- [ ] Relire les écritures Airtable et rapport final.

## Ledger
Ruling: exécuter sans menu de confirmation de skill — mandat utilisateur explicite d'autonomie, branches et PR autorisées — coût si erreur : choix de méthode moins adapté, aucune porte de livraison retirée.
Ruling: agréger au tip des six PR, sans cherry-pick ni modifications de leurs branches — ascendance et 40 patch-id distincts prouvés — coût si erreur : revue cumulative plus grande ; aucune ancienne PR fermée avant intégration effective.
Ruling: suspendre les publications automatiques historiques et le push du tableau, conserver préparation et commande locale — incompatibles avec les portes et le budget actuels — coût si erreur : future publication d'extension nécessitera un parcours distinct qualifié.
Ruling: verrou Git Vercel global — les exceptions par nom laissaient les nouvelles branches et main actives par défaut — coût si erreur : aucun auto-déploiement, une preview manuelle devra être demandée après preuve de coût.

