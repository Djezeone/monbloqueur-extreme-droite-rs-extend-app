# Revue indépendante FIL CLAIR V2 — 28 octobre 2026

Périmètre lu : base 98550a8 → candidat local91d1d1a, conception/plan et documentation V2 en consolidation. Revue par un spécialiste en contexte neuf, en lecture seule. Aucun service distant ou compte social actionné ; deux reproductions Chromium ciblées avec données synthétiques, sans relancer toutes les suites antérieures.

## Verdict initial

Aucun défaut critique identifié, **deux défauts importants**. Candidat à corriger avant validation technique. Fusion/publication restent séparément No-Go pour les portes externes déjà ouvertes.

Points vérifiés : validation stricte des snapshots, statuts sans fausse preuve API, verrou commun/comparaison de source, désélection non destructive, rendu texte/liens fixes, espace mémoire consenti, cache public exact et aucune activation d’adaptateur. Les portées documentaires X/Mastodon/Bluesky examinées correspondent aux distinctions affichées ; aucune manipulation fournisseur n’a servi de preuve.

| Réf. | Constat et effet | Décision de l’implémenteur |
| --- | --- | --- |
| I1 Important | Cible/recherche de Mes flux et anciens champs/filtres restent après remplacement ; une restauration peut sembler vide et un texte sensible survivre à l’effacement. | Accepté. Vider les brouillons, filtres, sélections dépendantes et anciens nœuds de profils/historique seulement après remplacement réussi ou mémoire consentie. Conserver tout en cas d’annulation, quota ou conflit. |
| I2 Important | Confirmation de restauration mentionne listes/historique, omet les préférences supprimées ; portée mémoire non précisée. | Accepté. Mentionner tout l’espace : listes, Mes flux, déclarations et historique ; distinguer mémoire/persistance et sauvegarde ancienne sans flux. |
| M1 Documentation | Registre annoncé sans son tableau, document encore en consolidation. | Terminer le registre demandé dans Task 3 : 14 modules et43 contrôles. Ce travail documentaire prévu est nécessaire pour distinguer contrôles embarqués et simples propositions des recherches. |

## Vérification des corrections

Des scénarios ciblés `scripts/test-pwa-replacements.mjs` sont écrits avant correction : effacement, restauration V2/ancienne, nouvel espace mémoire, annulations et refus de stockage. Les constats RED et le résultat final GREEN sont consolidés dans le journal V2 après exécution ; aucune seconde revue n’est revendiquée.

Résultat constaté : **5/11 avant correction**, les six échecs reproduisent I1/I2 ; puis **11/11 sur Chromium, Firefox et WebKit**. I1/I2 sont corrigés avec ces régressions. Le tableau de capacités M1 est présent et relu dans `UNIVERSAL_FLOWS.md`. Les suites complètes après correction sont rattachées au journal et aux logs finaux ; aucune absence exhaustive de défaut n’est déduite de cette passe.

## Limites examinées et décisions explicites

- Appareils physiques, Safari commercial, installation, VoiceOver/TalkBack et WCAG complet : non certifiés ; leur absence empêche une promesse universelle validée et maintient la recette concernée ouverte.
- Menus par compte/pays/version : recherche officielle seulement, réserves affichées ; une erreur ferait suivre un guide indisponible, jamais une action clandestine ou un faux succès.
- OAuth/transport/révocation/preuve fournisseur : adaptateurs inactifs ; activation interdite sans qualification, risque d’action non autorisée sinon.
- Juridique/responsable/contact/bases légales/AIPD/hébergement : non validés, publication bloquée ; risque de traitement sensible mal encadré sinon.
- Protection main/quota/capacité gratuite Vercel/future CI/provenance de déploiement : vérifications d’accès et résultats effectifs seulement ; aucun Go ni frais supposés gratuits sans preuve.
- Rollback fournisseur/downgrade : non exercés ; sauvegarde V2 testée requise, risque de perte de préférences avec une ancienne version.
- Sécurité exhaustive : audit limité aux contrôles exécutés ; aucune certification générale ni absence absolue de faille annoncée.

Ces réserves ne sont pas des fonctionnalités prétendument terminées. Les huit lots et A SAFE → B CONNECT → C PUBLIC conservent leur recette complète.
