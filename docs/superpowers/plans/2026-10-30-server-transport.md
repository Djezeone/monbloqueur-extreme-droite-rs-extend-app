# Server transport implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for root tasks; a disjoint policy task may use a specialized agent. Steps use checkbox syntax.

**Goal:** Frontière Mastodon serveur bornée sans retry implicite, secrets hors frontend et déconnexion locale honnête.
**Architecture:** Politique réseau pure séparée d'une session/transport Node natifs ; aucune route/activation/déploiement.
**Tech Stack:** Node24, https/dns/net/crypto natifs, node:test/OpenSSL éphémère ; dépendances inchangées.
**Spec:** docs/superpowers/specs/2026-10-30-server-transport-design.md.

## Global Constraints
Budget0€, aucune requête sociale réelle/login/révocation/achat/fusion/publication. Base42a70ca, branche feat/fil-clair-server-transport. PWA/SW/backup inchangés. Scopes3exacts, TTL900000ms/max3600000 ; timeout10000/max30000 ; corps65536/max1048576 ; en-têtes16384 ; DNS1..16 ; liste32origines.

## Review Focus
- DNS mixte/rebinding, IPv4mapped/IPv6spéciales, URL canonique trompeuse : refuser avant socket (task1/2).
- Token/état expiré ou déconnexion pendant DNS : aucune requête différée ne doit partir (task2).
- POST appliqué puis connexion coupée,421/503/redirect : un seul dispatch et aucune fausse confirmation (task2).
-401/403 avec corps invalide, headers/cookies/messages sensibles : arrêt immédiat et aucune fuite (task2).
- JSON UTF8 tronqué/gzip/oversized et ID différent : refus borné ; TLS de nom invalide refusé (task2).

### Task1 — politique réseau pure
Files : server/connectors/network-policy.js, tests/network-policy.test.js.
Interfaces : normalizeOrigin, isPublicAddress, selectPublicAddress, normalizeMastodonRequest ; formes exactes dans spec.
- [x] Tests RED des classes/limites/IPv4/IPv6 et quatre routes, y compris toute query/options non qualifiées.
- [x] Implémentation minimale puis tests GREEN et suite Node.
- [x] Commit groupé, résultats/RED conservés.

### Task2 — session locale et transport HTTPS
Files : server/connectors/mastodon-transport.js, tests/server-transport.test.js, tests/fixtures/server-transport-helpers.js.
Consumes : task1 et ConnectorError/decimalId ; produit handle exact décrit dans spec.
- [x] Tests RED : token isolé, TTL/disconnect, DNS/abort, un seul POST421/503/redirect, fermeture après effet,200 borné/validé,401/403, vérification TLS.
- [x] Implémenter Node HTTPS sans refresh/retry ni options de contournement ; borner toutes attentes/réponses.
- [x] Assembler avec adaptateur/exécuteur et journal de test, prouver confirmation par GET et incertitude/quarantaine après coupure ; suite complète GREEN.
- [x] Commit cohérent.

### Task3 — revue, preuves et pilotage
Files : docs/SERVER_TRANSPORT.md, mission/queue/privacy/ops, recherche datée, journal Fait/Ouvert/Vérifié/Périmé, configurations Vercel/audit existants.
- [x] Docs et scope inactif précis ; déploiement Git interdit pour cette seule branche.
- [x] Audits et revue indépendante fraîche de toute branche ; une passe RED→GREEN pour constats importants, réserves documentées.
- [ ] Preuves/hash/commits et PR draft dépendant#4 ; scénario CI gratuit revérifié, aucun upload/cache ni relance inchangée.
- [ ] Lire CI au SHA exact, déploiements et cockpit ; mettre à jour/re-lire8lots/8portes/session. A/B/C restent No-Go.

## Ledger
-30/10Paris : mission relue ; PR4draft42a70ca et deuxCI finales vertes inchangées, main protected:false, preview ancienne7348dbe0. Baseline183/183Node. Checkout lié propre, nouvelle branche depuis42a70ca.
- Ruling : autonomie déjà explicite, pas de nouvelle approbation intermédiaire. Choix Node HTTPS natif au lieu du fetch à rejeu possible ; aucun fournisseur réellement sollicité. Coût d'erreur : maintien obligatoire en module inactif avant qualification.
- Pre-flight : task1 normalise strictement les entrées que task2 reçoit de l'adaptateur existant ; aucun secret ni appel réseau dans task1. Task3 ne transforme pas métadonnées OAuth déclarées en preuve d'authentification réelle.

- Task1 complete :17groupes de tests de politique RED→GREEN, pas de réseau.
- Task2 complete :18tests initiaux RED→GREEN et6qualifications supplémentaires ;24/24TLS/session. Suite complète224/224Node,9/9SW+audit et14imports shell sans connecteur.
- Ruling : le driver de test réoriente seulement le fil vers127.0.0.1 avecCAéphémère, après vérification de la sélection publique/TLS. IPv6 paramètres validés, pas de connectivité IPv6externe certifiée ; coût d'erreur : activation interdite avant qualification egress réelle.

- Revue indépendante gpt-6-astra/high sur42a70ca..faab750 :0Critical,0Important,1Minor ;41tests ciblés exécutés par le relecteur, pas de CI/service externe.
- Final: Ruling: deadline évalué seulement par timer reclassé Important : construction tardive et fausse incertitude peuvent bloquer une opération ; cela ne prouve pas un POST réel tardif. Coût d'erreur : envoi inattendu/quarantaine trompeuse.
- Final: fixed deadline —2régressions RED/26 puis26/26GREEN, garde monotone aprèsDNS/avantdispatch/avantacceptation ; suite complète226/226. Une passe, pas de seconde revue.
- Final: Ruling: OAuth/scopes réellement accordés, routes/auth/CSRF, sessions/journal serveur durables, révocation, réseau IPv6 externe/egress/proxy/NAT, drivers/serveur compromis, déploiement/coût/CI/distants, physique/WCAG et décisions juridiques restent hors qualification indépendante. Activation interdite avant leurs preuves ; ces risques ne sont pas supprimés par les tests.
- Final: minor(deferred): aucun ; le seul Minor a été reclassé et corrigé.
