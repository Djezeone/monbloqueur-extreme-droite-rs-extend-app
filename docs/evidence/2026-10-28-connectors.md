# 2026-10-28 — preuves locales connecteurs et orchestration

## Complément après revue indépendante

Les résultats 55/55 et 116/116 ci-dessous identifient le snapshot du workstream avant les corrections de revue. Le coordinateur a ajouté huit cas de réponse HTTP après mutation (500/502/503/408/201/302/0/700), d'abord **8 échecs**, puis **8/8** après maintien de l'incertitude. Aucun second POST n'est possible, y compris après une lecture différente qui ne prouve pas la fin de l'ancienne requête.

Une régression supplémentaire a reproduit la réconciliation d'une ancienne opération confirmée libérant le verrou courant : échec `reconciled-by-read` au lieu de `no-unresolved-operation`, puis **1/1** après contrôle du propriétaire du verrou. `npm test` complet après ces deux corrections : **125/125**, exit0, aucune défaillance. Les tests exécutent les vrais modules avec des frontières HTTP synthétiques, sans appel fournisseur ni confirmation sociale réelle.

Les autres gates B CONNECT restent inchangées : durable/multi-onglets/OAuth/transport officiel et recette fournisseur non qualifiés. La protection multi-onglets ajoutée à la sauvegarde de la PWA ne constitue pas une coordination durable des futures opérations sociales.

## Fait

Socle local inactif ajouté dans `pwa/connectors/{internal,mastodon,bluesky,orchestration}.js`, avec les tests de comportement `tests/connectors.test.js` et `tests/orchestration.test.js`. Qualification et réserves : `docs/OFFICIAL_CONNECTORS.md`.

Aucun changement app.js, CSP, service worker ou package n'a été effectué par ce workstream. Aucun transport réel, OAuth production, compte social, achat, CI distante, stage, commit ou push. Les transports injectés sont des simulateurs de frontière HTTP ; les vrais modules sont exécutés. Tout `globalThis.fetch` accidentel ferait échouer les tests de ce scope.

Base locale vérifiée : `ee515c17a736ceb865c605eacc9aee37a9776c7a` (HEAD). Les nouveaux fichiers sont non commités ; ce hash n'est donc pas une livraison du code ajouté. Runtime : Node `v24.22.1`.

## Vérifié comment

| Vérification locale exécutée | Résultat observé |
| --- | --- |
| Tests initiaux avant modules, `node --test --test-reporter=dot tests/connectors.test.js tests/orchestration.test.js` | Exit 1 ; 49 cas échouent sur factories absentes. |
| Premier GREEN, `node --test tests/connectors.test.js tests/orchestration.test.js` | Exit 0 ; 49 tests, 49 réussites, 0 échec. |
| Régressions ajoutées : acceptation partielle d'un déblocage multiple | Exit 1 ; 55 tests, 53 réussites, 2 échecs sur trace `changed` manquante après première suppression acceptée. |
| Correction de cette trace, même commande | Exit 0 ; 55 tests, 55 réussites, 0 échec. |
| Régression revue : état relu différent après écriture indéterminée | Test ciblé exit 1 avant correction ; une lecture différente libérait à tort la cible. |
| Correction : conserver le verrou si l'ancienne requête peut encore s'appliquer, suite ciblée complète | Exit 0 ; 55 tests, 55 réussites, 0 échec. |
| `npm test` avant la correction de verrou, sur le workspace partagé | Exit 0 ; 116 tests, 116 réussites, 0 échec. Nouvelle exécution finale consignée ci-dessous. |

Les cas couvrent : construction inactive ; session/transport obligatoires ; origine fixée ; IDs/DID/rkey ; scopes minimaux ; identité différente ; recontrôle après prélecture ; consentement spécifique, périssable et non importable ; double clic ; annulation avant/après envoi ; 401/403 sans reprise ; 429 avec délai sans retry ; vrai deadline de transport simulé ; réponse perdue ; acceptation distincte de confirmation ; relecture indépendante ; conflit rkey ; pagination complète et curseurs invalides ; déblocage de plusieurs records ; annulation/expiration/refus après progrès partiel ; aucun crédit donné à des flags importés.

Le seul warning npm observé concernait la configuration d'environnement `http-proxy` inconnue ; les tests eux-mêmes n'ont émis ni warning ni échec. Aucune configuration npm n'a été modifiée pour ce workstream.

## Ouvert

- Revue indépendante finale et futur commit coordonnés par le parent.
- B CONNECT fermé : OAuth E2E, SDK/transport authentifié réel, comptes de test, endpoints/CORS/scopes effectifs, révocation et recettes sur appareils physiques non vérifiés.
- Opérations indéterminées en mémoire uniquement : politique durable inter-onglets/rechargements/sessions indispensable avant intégration.
- Pagination Bluesky non transactionnelle et écritures concurrentes : la preuve est un constat relu, sans garantie de stabilité future ou propagation globale.
- Aucun test ne démontre un OAuth sécurisé sans backend Mastodon, une révocation réelle, une conformité juridique ou une absence de bannissement.
- Aucune publication générale ni fusion main avant critères de la mission et recette complète.

## Périmé

Une évolution des scopes, métadonnées OAuth, SDK, quotas ou endpoints invalidera la qualification correspondante. Les sources `main` sont mouvantes ; une intégration ultérieure devra figer et réexaminer les versions choisies. Les observations du simulateur ne vieillissent jamais en preuve de compte réellement connecté.

## Dernière vérification finale

Après correction du verrou et stabilisation des modules :

```text
$ node --test tests/connectors.test.js tests/orchestration.test.js
tests 55 / pass 55 / fail 0 / cancelled 0 / skipped 0 / todo 0
exit 0

$ npm test
> node --test tests/*.test.js
tests 116 / pass 116 / fail 0 / cancelled 0 / skipped 0 / todo 0
duration_ms 260.341553
exit 0
```

Les huit fichiers du scope ont aussi été contrôlés : `node --check` sur les six modules/tests JavaScript, présence des fins de fichier et absence d'espaces terminaux. Sortie : `8 files checked; no syntax or whitespace errors`, exit 0. Le warning npm d'environnement décrit plus haut demeure sans incidence sur le résultat observé.

`rg -n 'connectors|official-oauth' pwa/app.js pwa/index.html pwa/sw.js package.json` ne retourne aucune référence (exit 1 attendu). Ce constat local confirme l'absence de branchement dans les points d'entrée examinés ; il n'affirme aucun état de déploiement distant.
