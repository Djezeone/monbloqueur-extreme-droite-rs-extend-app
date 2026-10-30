# X : pondérations publiques et limites de preuve — FIL CLAIR V3

Vérification effectuée le **29 octobre 2026, vers 00 h 39 (Europe/Paris)**, soit le 28 octobre vers 23 h 39 UTC. Recherche en lecture seule sur des sources primaires, sans action sociale ni service payant supplémentaire. Les statuts A/B/C restent **No-Go** : cette documentation ne débloque aucune capacité distante de FIL CLAIR.

## Résultat vérifiable

La branche publique `main` de `xai-org/x-algorithm` pointe, lors de la consultation, vers **`5ed796374ea48ee26058aab66ab10c266bea2bef`**, daté du **28/10/2026 à 02:49:03 UTC**. L'arbre associé est `002a7b9c3c1fd856031063050a874be756f02d93`. La référence de branche a été contrôlée par l'API GitHub, puis les fichiers ont été lus au SHA figé. [Commit figé][commit-current] ; [arbre figé][tree-current].

Les cinq coefficients demandés existent dans `home-mixer/params/param.rs` à ce SHA. Ce sont des **valeurs par défaut de paramètres**, pas des points retranchés au compte d'un auteur à chaque action. Un autre composant du même dépôt, `vm-ranker/params.rs`, publie une valeur différente pour `NotInterestedWeight`. La configuration réellement résolue pour une requête sur X n'a pas été observée. [S1][s1] [S2][s2] [S5][s5] [S6][s6]

| Paramètre | Historique : Home Mixer, 13/08/2026 | Revérifié : Home Mixer, 28/10/2026 | Revérifié : VM Ranker, même SHA du 28/10 |
| --- | ---: | ---: | ---: |
| `ReportWeight` | -234.0 | -234.0 | -234.0 |
| `MuteAuthorWeight` | -58.8 | -58.8 | -58.8 |
| `NotInterestedWeight` | **-43.2** | **-52.272** | **-47.52** |
| `BlockAuthorWeight` | -31.2 | -31.2 | -31.2 |
| `NotDwelledWeight` | -0.02 | -0.02 | -0.02 |

Sources du tableau : [historique S11][s11], [Home Mixer actuel S1][s1], [VM Ranker actuel S2][s2]. Confiance **élevée sur les littéraux publiés**, sans conclusion sur les valeurs appliquées à un lecteur réel. Le tableau compare deux instantanés ; il ne reconstitue pas chaque changement intermédiaire.

| Instantané lu | Commit du dépôt | SHA du blob de paramètres |
| --- | --- | --- |
| Home Mixer, 13/08/2026 | `47c1bcdadfe4911568fd6db4f8838b194325beab` | `dc3a12e43eefb97940ee728062a210384859be47` |
| Home Mixer, 28/10/2026 | `5ed796374ea48ee26058aab66ab10c266bea2bef` | `240123ecdaac4d0a33336835f99fe84b855a9a04` |
| VM Ranker, 28/10/2026 | `5ed796374ea48ee26058aab66ab10c266bea2bef` | `626997804154fa340e6163e01034d694d0b173b8` |

Le fichier Home Mixer actuel indique une synchronisation des valeurs par défaut le `2026-10-27T16:00:37Z` ; celui du 13 août indique `2026-08-12T04:09:22Z`. Ces mentions sont celles du dépôt, pas une attestation de déploiement indépendante. [S1][s1] [S11][s11]

## Formule : une prédiction pour un lecteur et une publication

Pour le lecteur `u`, la publication candidate `p` et leur contexte, le calcul de base se décrit par :

```text
S(u,p) = somme_i [ w_i × y_prédit_i(u,p) ]
```

Pour une action binaire, `y_prédit_i` représente sa probabilité prédite, par exemple `P(report | u,p,contexte)`. Certaines têtes prédisent des valeurs continues ; des termes combinent une probabilité d'ouverture et une durée conditionnelle. Une valeur absente contribue zéro. Les cinq termes négatifs du tableau multiplient les champs `report_score`, `mute_author_score`, `not_interested_score`, `block_author_score`, `not_dwelled_score`. [S3][s3]

La fusion applique ensuite un décalage, avec `epsilon = 0.001`, `N = negative_sum()` et `T = total_sum()` :

```text
si T = 0 : F(S) = max(S, 0)
sinon, si S < 0 : F(S) = ((S + N) / T) × epsilon
sinon : F(S) = S + epsilon
```

`N` est l'opposé de la somme des cinq poids négatifs ; `T` additionne ce `N` et la liste de poids positifs définie dans `positive_sum()`. Cette transformation ne convertit pas des actions en compteurs de sanctions. [S3][s3] [S4][s4]

Home Mixer lit ces poids par `query.params.get(...)`. VM Ranker dispose de sa propre résolution et peut réutiliser un score déjà calculé ; ses valeurs locales ne prouvent donc pas quels coefficients ont servi à une publication particulière. D'autres étapes peuvent ajuster ou réordonner les candidats : diversité, exploration d'auteurs, remise à l'échelle et réordonnancement DPP selon la configuration. La somme n'est pas à présenter comme une formule exhaustive du fil finalement affiché. [S5][s5] [S7][s7] [S8][s8] [S9][s9]

**Aucune équivalence « une action annule un nombre de likes », aucun score global d'auteur, aucune baisse chiffrée de portée ne découle de ces coefficients.** Les prédictions, leur calibration, le contexte et la configuration effective manquent pour un tel calcul. Le dépôt explique lui-même la distinction entre probabilités prédites et volumes d'actions ; ses commentaires ne constituent pas une mesure indépendante de l'effet d'une campagne coordonnée. [S3][s3] [S12][s12]

## Chemins : ne pas mélanger les versions

| Version publique vérifiée | Chemin et constat |
| --- | --- |
| 20/01/2026, `aaa167b3de8a674587c53545a43c90eaad360010` | `home-mixer/scorers/weighted_scorer.rs` contient l'ancienne fusion et référence des poids `p::...`. L'arbre public ne contient pas le module de paramètres correspondant : aucune valeur numérique ne lui est attribuée ici. [S10][s10] [Arbre initial][tree-initial] |
| 13/08/2026, `47c1bcdadfe4911568fd6db4f8838b194325beab` | `home-mixer/params/param.rs` expose les valeurs historiques du tableau. [S11][s11] |
| 28/10/2026, `5ed796374ea48ee26058aab66ab10c266bea2bef` | L'arithmétique partagée est dans `xai-value-model/scoring.rs`, la définition des poids dans `xai-value-model/weights.rs`, et l'adaptateur Home Mixer dans `home-mixer/scorers/value_model.rs`. L'ancien `weighted_scorer.rs` est absent de cet arbre. [S3][s3] [S4][s4] [S5][s5] [Arbre actuel][tree-current] |

Au SHA actuel, le README emploie encore le nom explicatif `RankingScorer`. Le pipeline publié appelle notamment `VMRanker` et des étapes supplémentaires ; le nom du README ne doit pas servir à reconstruire un chemin de fichier supposé. [S12][s12] [S14][s14]

## Ce que la publication du code ne prouve pas

| Affirmation examinée | Statut et confiance |
| --- | --- |
| Présence des cinq paramètres et calcul de fusion | **Vérifié, élevée** : lecture des fichiers au SHA et contrôle des littéraux. |
| Défauts publics proches des principaux réglages de production | **Déclaration des mainteneurs** : le README décrit une synchronisation des défauts et des expérimentations. Ce n'est pas une vérification de production par FIL CLAIR. [S12][s12] |
| Réglages effectifs d'une requête | **Non vérifiés** : lecture de configuration, choix par destinataire et overrides sont visibles ; les fichiers d'exploitation `rust_home_mixer.yml` et `abdecider.yml` référencés ne sont pas fournis dans l'arbre examiné. [S6][s6] [S15][s15] [Arbre actuel][tree-current] |
| Modèle, prédictions et score d'un utilisateur réel | **Non observés** : aucun appel à X, aucune donnée de compte, aucune inférence de production ou expérience sur le fil n'a été réalisée. |
| Exhaustivité du système public | **Non établie** : le README indique que des prompts Grox, certaines règles Botmaker et des éléments d'infrastructure ne sont pas publiés. Ne pas généraliser les paramètres visibles à ces composants. [S12][s12] |
| Déploiement du SHA inspecté sur X | **Non prouvé** : le dernier commit public est une référence documentaire, pas une version d'exécution attestée pour tous les lecteurs. |

Le filtrage explicite doit également être distingué de la prédiction. `AuthorSocialgraphFilter` retire des candidats lorsque les listes du lecteur contiennent l'auteur bloqué ou masqué ; il contrôle aussi certaines relations avec l'auteur d'une citation ou d'un repost. Cela documente un filtrage relatif au lecteur, pas une pénalité universelle sur la diffusion de l'auteur. L'exécution réelle reste soumise au pipeline et aux données reçues. [S13][s13]

## Recommandations pour le registre documentaire de la PWA

Chaque entrée devrait conserver `plateforme`, `effet_documenté`, `portée`, `composant`, `source_url`, `source_sha`, `vérifié_le`, `confiance_code` et `effet_réel_mesuré`. Les coefficients restent dans un détail technique daté ; ils ne deviennent ni une jauge d'efficacité ni une estimation de portée. Une nouvelle lecture manuelle pourra remplacer la référence courante en conservant l'historique ; cette note ne crée aucune automatisation.

| Entrée proposée | Texte publiable dans le registre | Limite à afficher |
| --- | --- | --- |
| Classement personnalisé | « Le code public de X combine des prédictions d'actions pour classer les publications proposées à chaque lecteur. » | « Version publique vérifiée le 29/10/2026 ; effet sur votre fil non mesuré. » |
| Masquer ou bloquer sur X | « Le code public contient un filtre qui écarte des candidats selon les relations de masquage et de blocage du lecteur. » | « Ce constat ne mesure aucune baisse de portée générale. Une note FIL CLAIR n'exécute pas cette action sur X. » |
| Pas intéressé | « Le modèle public comporte une prédiction “pas intéressé” pondérée négativement. » | « La pondération dépend du composant et de la configuration. Aucun effet chiffré d'un clic n'est établi ici. » |
| Tête de prédiction de signalement | « Le signalement figure parmi les actions prédites par le modèle public. » | « Information technique seulement ; aucun bouton de campagne, incitation, envoi ou automatisation de signalement. » |
| `NotDwelled` | « Le code comporte une tête de prédiction `not_dwelled` et un poids négatif. » | « Ne pas inventer un seuil temporel ni attribuer un effet mesurable à une simple absence de clic. » |

L'interface peut relier ces entrées à la note et au SHA, avec les états **« code public vérifié »** et **« effet réel non mesuré »**. Elle ne doit pas transformer l'intention enregistrée dans le carnet en preuve d'action effectuée sur X ou en preuve d'effet algorithmique. Aucune recommandation de signalements coordonnés, aucune mesure de rendement des blocages et aucune promesse de “déclasser” un auteur ne sont justifiées par cette recherche.

## Sources primaires figées

Les liens de fichiers ci-dessous portent un SHA complet ; `main` n'est utilisé que pour constater la référence de branche au moment de la recherche. Méthode : API GitHub `branches/main`, collection des commits, arbres récursifs non tronqués, puis lecture des blobs à référence figée. Les deux arbres de comparaison contiennent respectivement 93 et 2 875 entrées. Aucun contenu de résultat de moteur de recherche n'a remplacé la lecture des sources.

- [S1 — Home Mixer : défauts actuels, dont les cinq poids][s1].
- [S2 — VM Ranker : défauts actuels, dont la divergence de `NotInterestedWeight`][s2].
- [S3 — Fusion, valeurs absentes, produits conditionnels et décalage][s3].
- [S4 — Sommes, ajustements et perturbation des poids][s4].
- [S5 — Lecture des paramètres Home Mixer et adaptation des scores][s5].
- [S6 — Résolution de configuration VM Ranker et overrides par lecteur][s6].
- [S7 — Calcul du modèle de valeur dans VM Ranker][s7].
- [S8 — Sélection du calcul et réordonnancement dans VM Ranker][s8].
- [S9 — Appel distant VM Ranker et repli sur des scores locaux][s9].
- [S10 — Ancien WeightedScorer, janvier 2026][s10].
- [S11 — Paramètres historiques, août 2026][s11].
- [S12 — README : scoring, expériences, configuration et omissions déclarées][s12].
- [S13 — Filtre relatif aux relations du lecteur][s13].
- [S14 — Étapes du pipeline de candidats actuel][s14].
- [S15 — Code de synchronisation des fichiers de configuration][s15].

[commit-current]: https://github.com/xai-org/x-algorithm/commit/5ed796374ea48ee26058aab66ab10c266bea2bef
[tree-current]: https://api.github.com/repos/xai-org/x-algorithm/git/trees/5ed796374ea48ee26058aab66ab10c266bea2bef?recursive=1
[tree-initial]: https://api.github.com/repos/xai-org/x-algorithm/git/trees/aaa167b3de8a674587c53545a43c90eaad360010?recursive=1
[s1]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/home-mixer/params/param.rs#L396-L514
[s2]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/vm-ranker/params.rs#L107-L132
[s3]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/xai-value-model/scoring.rs#L28-L170
[s4]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/xai-value-model/weights.rs#L1-L118
[s5]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/home-mixer/scorers/value_model.rs#L8-L87
[s6]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/vm-ranker/ranking_config.rs#L22-L65
[s7]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/vm-ranker/scoring/value_model.rs#L71-L190
[s8]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/vm-ranker/scoring/mod.rs#L40-L130
[s9]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/home-mixer/scorers/vm_ranker.rs#L60-L136
[s10]: https://github.com/xai-org/x-algorithm/blob/aaa167b3de8a674587c53545a43c90eaad360010/home-mixer/scorers/weighted_scorer.rs#L39-L91
[s11]: https://github.com/xai-org/x-algorithm/blob/47c1bcdadfe4911568fd6db4f8838b194325beab/home-mixer/params/param.rs#L423-L448
[s12]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/README.md#L350-L460
[s13]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/home-mixer/filters/author_socialgraph_filter.rs#L9-L58
[s14]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs#L443-L475
[s15]: https://github.com/xai-org/x-algorithm/blob/5ed796374ea48ee26058aab66ab10c266bea2bef/vm-ranker/config_sync.rs#L16-L43
