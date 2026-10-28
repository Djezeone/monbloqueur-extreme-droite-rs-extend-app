# Mission Work — FIL CLAIR · autonomie maximale

## Références immuables
- GitHub : https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app
- PR existante : https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/pull/1
- PWA isolée : https://fil-clair-pwa-preview.vercel.app/
- Airtable cockpit : https://airtable.com/appXkTDooEjMD9lCs
- Date de gouvernance : 2026-10-28

## Mission
Poursuivre en autonomie l'industrialisation FIL CLAIR en 8 lots : (1) sécurité/CI, (2) UX/PWA, (3) listes, (4) API officielles, (5) orchestration, (6) RGPD, (7) QA, (8) publication. Livraisons successives A SAFE, B CONNECT, C PUBLIC.

## Règles absolues
1. **Preuves avant statut** : ne jamais écrire PASS sans lien vers commit, sortie de test ou déploiement réellement vérifié. Tenir à jour le cockpit Airtable.
2. Intervenir sur branches de fonctionnalité + PR revues ; jamais pousser directement sur main, ni fusionner une PR dont CI ou QA est inconnue.
3. Ne pas provoquer de blocages réels sur des comptes sociaux, ni manipuler des comptes utilisateurs, ni utiliser TinyFish pour contourner l'interface ou les règles d'un réseau. Les futures API exigent OAuth officiel, consentement, comptes de test, conformité et possibilité de révoquer.
4. Status `déclaré` ≠ status `confirmé par fournisseur`. Aucun faux succès ni promesse d'absence de bannissement.
5. Aucun achat, publication grand public, envoi extérieur, exposition de clé/secrets ni modification irréversible d'une ressource existante sans autorisation spécifique.
6. Local-first et protection des opinions/identifiants, collecte minimale, export, effacement et contrôle RGPD ; évaluer AIPD.
7. Workstreams de sous-agents possibles : architecture/sécurité, API officielles, UI/accessibilité, qualité, RGPD. Ne pas masquer leurs limites de vérification.
8. Vérifier et journaliser les états réels avant chaque changement ; reprendre seulement les tâches restantes et **ne pas répéter les travaux déjà validés**.

## Critères de sortie obligatoires
- CI GitHub exécutée et verte ; absence de vulnérabilité critique/élevée non traitée.
- Tests unitaires + E2E + appareils physiques Android/iOS, WCAG 2.2 AA.
- Import/export/restore/effacement éprouvés, absence de perte silencieuse de données.
- Connecteurs officiels uniquement, états API vérifiables quand les plateformes le permettent.
- Journal d'exploitation, incidents, restauration, rollback et décision Go/No-Go documentés.

## Actions immédiates, sans sollicitation
1. Vérifier PR #1 et ses commits, workflows, status GitHub, paramètres Actions et protections (en lecture).
2. Corriger les défauts mesurables du socle PWA dans une branche dédiée avec tests.
3. Lancer/évaluer la CI, documenter sans inventer.
4. Vérifier le prototype sur navigateur, mobile et hors ligne autant que les outils le permettent.
5. Compléter Airtable avec statut, risques et liens preuves.
6. Préparer l'intégration Bluesky/Mastodon par revue des API et protocole de test, sans exécuter d'opération réelle.
7. Journaliser au format AAAA-MM-JJ : fait/ouvrir/vérification/périmé.

## Format du bilan
- Commit/PR et URL Vercel **réellement vérifiés**
- Tests avec résultats exacts, sans extrapoler
- Statuts huit lots + huit critères de recette
- Risques/réserves explicitement bloquants
- Décision sur la fusion et publication (par défaut non)
