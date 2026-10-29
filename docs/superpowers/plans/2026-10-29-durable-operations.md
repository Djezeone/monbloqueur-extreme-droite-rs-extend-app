# Durable operations — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Empêcher le rejeu d'une opération fournisseur incertaine entre onglets et redémarrages, sans activer les connecteurs.
**Architecture:** Journal IndexedDB CAS et nouvel exécuteur isolé ; attente du checkpoint au point d'envoi des adaptateurs existants. Aucun changement d'interface principale.
**Tech Stack:** JavaScript natif, IndexedDB, Node test, Playwright déjà verrouillé.
**Spec:** `docs/superpowers/specs/2026-10-29-durable-operations-design.md`.

## Global Constraints
- Budget supplémentaire0€, aucun compte social réel, pas de fusion/publication générale.
- Journal v1 :128voies, un checkpoint par voie,100envois max, strict durability, timeout5000ms par défaut (1..10000).
- Consentement mémoire unique, TTL60000ms par défaut,1..300000ms ; restauration sans confirmation.
- La PWA principale reste locale sans compte ; nouveaux modules non importés/non précachés.
- Conserver PR1/2/3 et leurs preuves ; branche dédiée dépendant de PR3.

## Review Focus
- Sending ancien encore en vol : une observation conforme ne doit pas autoriser une action inverse (tâche2).
- Prepared repris pendant une prélecture lente : l'ancien runner doit perdre sa CAS avant son POST (tâche2).
- Transaction dont put réussit puis abort : aucun POST ne doit démarrer (tâches1/2).
- Deuxième suppression Bluesky et consentement expiré/stockage refusé : arrêt sans perdre le premier changement (tâche2).
- Données de journal forgées/incomplètes ou cooldown rechargé : aucun faux consentement/confirmation ni contournement de pause (tâches1/2).

### Task1 — journal transactionnel borné
Files : `pwa/connectors/operation-journal.js`, `tests/operation-journal.test.js`, `scripts/test-operation-journal.mjs`.
Produces : `createOperationJournal({indexedDB,timeoutMs})`, read(lane), compareAndSet(lane,expectedRevision,next). Record/raison et règles : spec.
- [ ] Écrire tests RED validation et véritable transaction navigateur ; vérifier le refus observable avant implémentation.
- [ ] Implémenter validation, CAS, borne, intégrité tuple/clé, résolution sur complete et refus sûr.
- [ ] Passer tests Node et navigateur ; conserver logs RED/GREEN, commit cohérent.

### Task2 — exécution et récupération sans rejeu
Files : `pwa/connectors/durable-orchestration.js`, `pwa/connectors/{orchestration,mastodon,bluesky}.js`, `scripts/test-durable-orchestration.mjs`, `tests/durable-orchestration.test.js`.
Consumes : journal task1 ; connectorImplementation et createOrchestrator existants.
Produces : createDurableOrchestrator, grantConsent/execute/recover/getCheckpoint/cancel ; hooks beforeSend attendus avant chaque POST.
- [ ] Tests RED : concurrence/reload, prelecture suspendue, envoi incertain, tentative inverse, checkpoint refusé/aborted, expiration, quota, auth, suppressions multiples.
- [ ] Implémenter enveloppe de consentement, réservation/checkpoints/clôture, récupération lecture seule et quarantaine.
- [ ] Suite Node complète, intégration journal et fournisseur simulé, trois moteurs ; logs et commit.

### Task3 — preuve d'inactivité, revue et livraison traçable
Files : workflow PWA existant, configurations Vercel branche, `docs/DURABLE_OPERATIONS.md`, mission, queue, privacy, opérations, journal de session, preuves.
- [ ] Ajouter scripts au workflow standard existant et empêcher autobuild Vercel de cette seule branche ; aucun service/dépendance ajouté.
- [ ] Vérifier absence d'import dans le shell/précache et absence de réseau réel dans les tests ; audits existants + non-régression appropriée.
- [ ] Revue indépendante de toute la branche ; une passe RED→GREEN pour constats importants ; conserver réserves non jugées.
- [ ] Commits groupés, vérifier arbres, nouvelle PR draft ; CI uniquement si dépôt public/runners standards et absence cache/upload revérifiés.
- [ ] Lire CI au SHA exact et absence de nouveau déploiement ; cockpit8lots/8portes/session actualisé et relu. Aucun A/B/C validé par ce seul changement.

## Ledger
- 2026-10-29 : mission et queue relues ; HEAD839049a, PR3draft inchangée et CI finales vertes, main protected:false, Vercel0déploiement duhead, Airtable1/8porte. Base Node151/151pass.
- Ruling : autonomie déjà explicite, aucune nouvelle validation intermédiaire ; choix IndexedDB local plutôt que serveur non qualifié — modules restent inactifs, activation impossible avant portes B.
- Ruling : worktree frère `fil-clair-durable` branche dédiée, dépendances déjà présentes liées localement sans installation ; aucun changement dans le checkout V3.2.
- Pre-flight : tâche1 produit CAS/read exactement consommées par tâche2 ; adaptateurs doivent await beforeWrite. Le journal ne sait pas restaurer un ticket ni une preuve. Tâche3 qualifie code/test, pas production.
- Exécution : tâche1 spécialisée sur ses fichiers seulement ; tâche2 exécutée par root, revue finale distincte. Aucun script de workflow externe téléchargé/exécuté ; ce ledger versionné porte les transitions.
