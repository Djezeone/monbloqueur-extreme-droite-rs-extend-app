# 2026-10-30 · FIL CLAIR · Sécurité CI et consolidation V3.2

Ce dossier est le **snapshot local avant publication** de la nouvelle branche d'intégration. Les conclusions des deux CI au SHA canonique final, l'URL de la PR et la relecture Airtable sont consignées dans le corps de cette PR et la session Airtable, sans push documentaire provoquant une nouvelle CI.

## Registre initial vérifié

| Fait | À corriger | Bloqué | Preuve | Priorité |
|---|---|---|---|---|
| Main b7cd31b036cca17b48dbf726c047847191c01a5b, protected:false, rulesets=[] | Appliquer le ruleset prêt et relire son enforcement | API protection 403, administration absente du connecteur ; navigateur GitHub non connecté, CLI gh absente | GET branches/main, rulesets, branches/main/protection ; [configuration](../main-ruleset.json) | P0 |
| Six PR ouvertes/draft, mergeable clean | Préparer un agrégat sans rejeu | Fusion suspendue aux contrôles | [snapshot JSON](integration/initial-state.json) ; matrice ci-dessous | P0 |
| Deux CI success au 0af61de, tentative 1 | Qualifier le nouveau candidat à son SHA | Ancien succès ne vaut pas CI du nouveau head | [PWA40987904888](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/actions/runs/40987904888), [extension40987904767](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/actions/runs/40987904767) | P0 |
| Release conserve cache/artifact/actions mutables/publication automatique ; tableau pousse directement | Supprimer ces chemins dans le candidat | Ne pas exécuter les workflows historiques publiés sur main | Git show 0af61de:.github/workflows/release.yml et tableau.yml ; RED ci-policy | P0 |
| Deux configs excluent seulement quatre noms de branches | Verrou global avant push d'une branche nouvelle | Coût Vercel non établi | [Git Vercel officiel](https://vercel.com/docs/project-configuration/git-configuration) ; deux JSON du candidat | P0 |
| Alerte GitHub officielle relue, 3000/3000 minutes Actions incluses au16/10, reset annoncé01/11 | Ne pas assimiler l'alerte au compteur actuel | Compteur live/budgets non accessibles | Notification privée lue et authentification DKIM/SPF/DMARC pass ; aucun contenu privé publié | P0 |
| Vercel projet prj_NXqsPNu36zUfalaQ40AcYbWxdD1R, ancienne preview READY ; plan Pro identifié | Preview exacte et vérification post-déploiement | Charges API 404 Plan not found, aucune preuve de capacité sans supplément | GET projet/charges ; trois déploiements historiques seulement lors de la reprise | P0 |
| Cockpit : trois lots bloqués, cinq en revue ; une porte automatisée sur huit | Ajouter résultat explicite, SHA et prochaine action | A/B/C non livrées | Tables Lots/Recette relues | P1 |

La notification identifie les minutes **Actions incluses**, sans déduire un épuisement de montants de facture ni prétendre connaître Copilot ou le compteur live. Source publique pour le scénario retenu : [facturation Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions), dépôt public et runners standards ubuntu-latest. Aucun cache ou artifact uploadé par le candidat ; aucune consommation Copilot/agent GitHub, achat, abonnement ou dépassement engagé.

## A. GitHub et intégration

| PR | Base | Head exact | Commits propres | Cumul |
|---|---|---|---:|---:|
|#1|main b7cd31b|51abcd35adefb757cc4f8831d23131a465b9f52a|11|11|
|#2|#1|b3b0660584429dfe6acdf031e03064a95eafd8c6|5|16|
|#3|#2|839049a1f675873ff6aedf0471e659f4a211bb0c|9|25|
|#4|#3|42a70ca528245100fe9866c9d8485c31d2cfa9e2|5|30|
|#5|#4|04454543f3df190f54f5fdacbccb82a413f901c0|5|35|
|#6|#5|0af61dee2141ac15a64f1ab3ca0a169f43b4c0ce|5|40|

Audit indépendant en lecture seule : 40 SHA et 40 patch-id --stable distincts, zéro merge, toutes les têtes ancêtres du tip, merge-base main exact. git merge-tree --trivial-merge sur chaque segment : zéro conflit ; réintégrer chaque ancêtre dans le tip : zéro octet de delta. Le checkout shallow initial limitait le parcours ; un fetch --unshallow a rétabli l'historique, sans changer les fichiers.

Branche **integrate/fil-clair-v32-safe**, issue du tip #6 : aucune fonction reconstruite ni cherry-pick. Les six branches et PR restent ouvertes et inchangées. Une PR d'agrégation vers main prépare une seule intégration ; aucune ancienne PR ne doit ensuite être fusionnée automatiquement. Le squash unique est compatible avec le ruleset linéaire préparé, mais produit un nouveau SHA nécessitant contrôle post-fusion. Aucun merge effectué.

### Corrections du candidat

- Workflows conservés en contents:read, actions figées à des SHA connus, persist-credentials:false.
- Tableau : commande --check déjà implémentée réutilisée ; tableau périmé refusé sans réécriture. Suppression du commit/push bot direct.
- Release : préparation manuelle des paquets seulement. Aucun trigger tag, publication, création de tag, jeton d'écriture, cache ou artifact upload. Les paquets éphémères restent dans le job ; aucun téléchargement distribué par ce workflow.
- git.deploymentEnabled=false global dans les **deux** configurations. Une branche nouvelle ou main n'échappe plus au verrou par défaut. Une preview manuelle reste soumise à vérification de coût.
- Les deux workflows de validation et leurs checks pwa-quality-gate/verifier restent identiques.
- Aucun fichier JS/HTML/CSS PWA, code extension ou serveur, format de sauvegarde ou dépendance modifié.

Ces protections sont **présentes dans le candidat**, pas réputées actives sur main avant fusion. Aucun relâchement du ruleset, jeton nouveau ou bypass pour lever le blocage d'administration.

## B. Vercel

La référence https://fil-clair-pwa-preview.vercel.app/ correspond au déploiement historique dpl_CzH7vb6CMiYPggYBPiv6FyGKKcj7, commit 7348dbe05871e29c6bbe952493a96b35fd84395e. L'autre ancienne preview ee515c17 ne contient pas non plus V3.2. READY est une lecture de métadonnées, pas une recette du candidat.

Aucun build, déploiement, promotion, domaine ou rollback Vercel demandé par cette tranche. Le coût sans supplément n'est pas démontré par une réponse 404 ou le nom du plan. Relecture du fournisseur après le push indispensable pour constater l'absence d'auto-déploiement.

## C. Application, tests et sécurité

Preuves locales : [receipt et empreintes](integration/receipt.json), sorties jointes au même dossier.

| Vérification | Résultat local |
|---|---|
| Baseline sans node_modules | 230 PASS et un fichier échoué : @playwright/test absent ; trace conservée |
| npm ci --ignore-scripts puis baseline | 232/232 PASS ; aucun changement du lockfile |
| Nouvelles régressions avant configuration | 1 PASS / 8 FAIL attendus |
| Après correction | 9/9 PASS |
| Suite Node finale | 241/241 PASS |
| Service worker / audit statique | 9/9 PASS, 14 modules du shell |
| Chromium qualité / axe / profils émulés | 30/30 PASS |
| Chromium V3.2 / boutons / aide / offline / sauvegarde lente | 14/14 PASS |
| Build dev, build production, lint Firefox, préparation v2.3.0 | Commandes locales exécutées ; aucune publication |
| actionlint1.7.12 | Exit0 ; analyse sémantique des quatre workflows, shellcheck désactivé |
| Liste et registre --check | Exit0 |
| npm audit | 0 critical/high/moderate, 3 low de développement |

La première rédaction du test de credentials arrêtait la lecture sur with: au même niveau qu'un uses: nommé. L'oracle a été corrigé **avant** modification des workflows : RED final vise bien tableau.yml. La première trace reste séparée. Les tests de politique sont des gardes statiques ciblées, pas une preuve de tous les comportements YAML ; actionlint et la revue complètent leur portée.

Chromium officiel 156.0.8078.4 / Playwright1.64.1, headless shell révision1248, archives Google vérifiées taille/MD5/CRC. Le CDN Playwright renvoyait du HTML ; aucune source tierce utilisée. Aucune bibliothèque OS nouvelle. Chrome complet channel:chromium reste bloqué par AF_UNIX EPERM, donc aucun E2E local extension revendiqué. Firefox/WebKit locaux absents pour cette tranche ; leurs résultats doivent provenir du nouveau run distant, pas être déduits du 0af61de.

Audit indépendant du socle à0af : aucun défaut exploitable P0/P1 identifié dans le shell examiné ; ce n'est pas une certification. CSP et empreinte privacy cohérentes, rendering textContent, liens sûrs, SW borné ; headers réels du futur déploiement non testés. Recherche de patterns de secrets à haute confiance sur 593 blobs, fichiers suivis et trois ZIP : zéro correspondance, sans prétendre couvrir tout secret possible. Trois ZIP de15entrées sans chemin dangereux et code JS conforme à extension/.

Les trois alertes faibles sont une même chaîne dev web-ext→addons-linter→deepmerge, [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). Source officielle relue : aucun correctif publié, dernier npm4.3.1. Ne pas appliquer la proposition automatique rétrogradant web-ext10.8.0 vers3.2.1. Le risque reste ouvert dans l'outil de lint, hors runtime PWA ; entrées du lint et contributions doivent être revues. Aucun ignore d'audit ou seuil affaibli.

Connecteurs, OAuth et transport restent inactifs ; aucune opération sur un compte social réel. Socle local, boutons/QCM, FAQ, historique, portées déclarées/confirmées et séparation CONTRIB.OS conservés. Soutien désactivé sans URL officielle validée.

## D. Cockpit : lots et critères

| Lot | Statut | Prochaine action |
|---|---|---|
|01 Sécurité & CI|Bloqué|Session admin, ruleset effectif et revue GitHub ; CI du candidat|
|02 UX & PWA|En revue|Recette physique et audit WCAG complet|
|03 Listes & historique|En revue|Éviction/crash/versions mixtes et restauration sur appareils|
|04 Connecteurs|En revue|OAuth officiel et recette autorisée sans action réelle|
|05 Orchestration|En revue|Stockage/session/journal serveur durables et récupération qualifiée|
|06 RGPD|Bloqué|Décisions responsable/contact, bases légales/article9/AIPD/contrats|
|07 QA|En revue|CI agrégat, physique et contrôles externes manquants|
|08 Release|Bloqué|Preview à coût vérifié, supervision/support/restauration/rollback|

| Critère | État de reprise | Limite |
|---|---|---|
|Sécurité|FAIL|Main non protégée, correction administrative bloquée|
|Mobiles & accessibilité|NOT TESTED|Recette physique et WCAG complet ; contrôles automatisés partiels acquis|
|Parcours critiques|PASS au0af61de|Automatisés Linux seulement ; nouveau head à qualifier|
|Preuve action|BLOCKED|Preuve API réelle et OAuth/session absents|
|Résilience|BLOCKED|Crash/éviction/versions mixtes et reprise serveur réelle|
|Conformité automatisation|BLOCKED|Activation interdite sans conformité/scopes/instance/comptes qualifiés|
|RGPD|BLOCKED|Décisions humaines et revue spécialisée|
|Exploitation|BLOCKED|Preview/coût/rollback/supervision/support non qualifiés|

Un seul critère coché ne livre pas A/B/C. Les champs Résultat, Version vérifiée et Prochaine action ajoutent un suivi explicite ; leurs écritures doivent être relues après clôture des CI. Aucun lot n'est promu Validé sur intention.

## E. Exploitation et juridique

[Procédures existantes](../OPERATIONS.md), [cartographie RGPD](../PRIVACY_ASSESSMENT.md), [suite d'exécution](../DELIVERY_QUEUE.md). La documentation n'est pas une validation juridique ni un exercice de rollback.

Retour arrière : export intégral V3 et source brute séparée, restauration isolée avec loader compatible, fermeture des anciens onglets ; ne retirer ni events ni statuts pour forcer V2. Rollback du code ≠ restauration des données, SW ou annulation fournisseur. Cible Vercel immuable et protection, coût et contrôle post-rollback requis ; aucun rollback externe exécuté.

Surveillance existante réutilisée en lecture seule : FIL CLAIR · Suivi qualité, identifiant6ae165ec8d948191a95ba1433298e7ef, active. Dernier run enregistré terminé et résultat correspondant relus ; livraison de notification inconnue, aucun nouveau robot créé. Aucun correctif ou déploiement automatique ajouté.

## F. Décision

**A SAFE : NO-GO. B CONNECT : NO-GO. C PUBLIC : NO-GO.**
Le socle local peut progresser indépendamment de B, sans retirer ses propres portes de sécurité, preview, physiques/accessibilité, sauvegarde et exploitation. Les autorisations conditionnelles de fusion/production sont reconnues ; leurs conditions ne sont pas satisfaites dans ce snapshot.

## Journal

**Fait :** audit lot01 et six PR, agrégat sans rejeu, corrections de workflows et verrou global, tests locaux et empreintes. PR#6 actualisée avec ses deux succès finaux ; aucun merge ou déploiement.

**Ouvert :** administration GitHub, CI du nouveau head, preview et coût, physique/WCAG, décisions RGPD, backend OAuth durable et exploitation. Les éléments réellement développables restent dans la suite, sans prétendre que seul le propriétaire bloque tout.

**Vérifié comment :** appels GitHub/AT/Vercel, ascendance et patch-id, tests listés/empreintes ; portée locale et historique clairement distinguée.

**Périmé :** environnement indisponible rétabli ; ancien fichier en attente identique au blob canonique puis fast-forward propre. Qualification PR#6 en cours désormais close, deux CI success. « Quota exact inconnu » remplacé par identification de l'alerte Actions3000minutes, sans compteur live. Exceptions Vercel par noms insuffisantes pour une nouvelle branche ; ancien push bot/publication rendus inertes dans le candidat. Aucune ancienne réserve physique/juridique/production n'est levée.
