# FIL CLAIR V2 — contrôles sociaux officiels

Recherche documentaire : **28 octobre 2026**, sans connexion à un compte, appel d'API authentifié, lecture d'un fil privé, scraping, achat ni action sociale. Périmètre : `x`, `facebook`, `instagram`, `threads`, `tiktok`, `reddit`, `linkedin`. Les liens ci-dessous sont des sources primaires des plateformes ; ils ont été recherchés ou ouverts à cette date. Une page officielle décrit une capacité, elle ne prouve pas sa présence sur chaque compte.

## Contrat produit recommandé

Les 25 contrôles proposés sont **guidés uniquement** dans cette livraison. FIL CLAIR affiche l'effet, ses limites, des étapes et un lien officiel. La personne effectue elle-même le réglage chez le fournisseur puis peut le déclarer fait, indisponible ou ignoré. Ouvrir un guide ne signifie pas qu'une action a été effectuée. Une déclaration reste locale et non vérifiée : ne jamais l'afficher comme un blocage confirmé, une recommandation supprimée ou une preuve obtenue du fournisseur. Un import ne peut pas transformer cette déclaration en confirmation distante.

Les actions ne sont pas interchangeables :

| Action | Sens à préserver |
| --- | --- |
| `block` | Limiter les interactions avec un compte selon les règles propres au fournisseur ; des exceptions peuvent subsister. |
| `mute` | Masquer le contenu d'une source sur des surfaces données, souvent en conservant l'abonnement. |
| `unfollow` | Retirer un abonnement ; le contenu peut rester accessible ou recommandé ailleurs. |
| `not-interested` | Donner un signal au classement ; ne constitue pas un bannissement de compte ou de sujet. |
| `filter-keywords` | Filtrer du texte selon les surfaces et règles proposées ; ne garantit pas une reconnaissance des images ou du sens. |
| `feed-choice` | Choisir un autre fil ; ne modifie pas automatiquement l'ensemble des recommandations. |
| `reset-recommendations` | Repartir d'un historique de recommandation réinitialisé, puis personnaliser à nouveau par l'usage. |

Les étapes marquées **indicatives** ne sont pas une transcription d'une interface actuelle testée. Les sources accessibles prouvent la fonction mais pas tous ses menus contemporains. En cas d'écart, présenter le guide officiel et permettre « option indisponible », sans recherche d'API privée ni automatisation du navigateur. Les libellés français sont des traductions explicatives ; conserver les variantes locales de l'application.

## `x` — quatre contrôles

| ID stable | Catégorie et effet | Étapes guidées | Portée et réserve | Guide officiel |
| --- | --- | --- | --- | --- |
| `x.mute-account` | Compte · mettre en sourdine | Ouvrir le profil ou une publication → menu de plus d'options → masquer le compte. | Retire ses publications du fil sans désabonnement. Les messages privés restent possibles ; les mentions et réponses des comptes suivis peuvent rester visibles. | [X1][X1] |
| `x.block-account` | Compte · bloquer | Profil → menu de plus d'options → bloquer → vérifier le compte puis confirmer chez X. | Retire les publications du compte du fil et limite ses interactions. Un compte bloqué peut encore voir des publications publiques ; des publications d'autres comptes qui le mentionnent peuvent rester visibles. Le blocage rompt les abonnements réciproques. | [X2][X2] |
| `x.mute-words` | Sujets · mots masqués | Notifications → roue des réglages → éléments masqués → mots masqués → ajouter un mot ; choisir accueil/notifications et durée ; enregistrer. | Mots, expressions, hashtags et autres termes sur les surfaces documentées. La recherche reste exclue ; certaines notifications de publication activées pour un compte échappent au filtre. Une mention `@compte` dans la liste ne masque pas ce compte lui-même. | [X3][X3] |
| `x.following-feed` | Recommandations · fil des abonnements | À l'accueil, sélectionner l'onglet des comptes suivis plutôt que le fil de recommandations. | Le fil « Following » montre les comptes suivis, dans l'ordre chronologique inverse selon la documentation du système. Ne pas promettre la disparition de toutes publicités ou de tous repartages. | [X4][X4], [X5][X5] |

**Qualification API.** `POST /2/users/{id}/muting` est bien documenté : il serait erroné d'affirmer que X ne possède aucune API de mise en sourdine. `POST /2/users/{id}/blocking` est présenté dans la section Enterprise au jour de consultation. Cela ne constitue ni un accès acquis par FIL CLAIR, ni une qualification des conditions commerciales, scopes, quotas ou règles d'automatisation. Aucun accès n'est demandé ni acheté. Les filtres de mots et le choix du fil restent non qualifiés pour une intégration API dans cette recherche. [X6][X6], [X7][X7]

**Conflit documentaire relevé.** Une page générale de recommandations de X indique encore que les comptes bloqués ne peuvent voir les publications ; la page dédiée au blocage précise au contraire le cas des publications publiques. Pour le produit, retenir cette dernière limite, plus précise, et ne jamais présenter le blocage comme une garantie de confidentialité. [X2][X2], [X8][X8]

## `facebook` — quatre contrôles

| ID stable | Catégorie et effet | Étapes guidées | Portée et réserve | Guide officiel |
| --- | --- | --- | --- | --- |
| `facebook.unfollow-source` | Source · ne plus suivre | **Indicatif :** menu d'une publication ou préférences du fil → ne plus suivre la personne, Page ou groupe concerné. | Réduit le contenu suivi de cette source dans le fil ; ne correspond pas à un blocage ni à une suppression d'ami. La documentation consultée liste l'outil, sans recette d'interface actuelle accessible sans connexion. | [F1][F1] |
| `facebook.snooze-source` | Source · masquer temporairement | Menu en haut d'une publication → masquer cette personne, Page ou groupe pendant 30 jours. | Pause de contenu dans le fil, réversible avant échéance. Aucun avis n'est envoyé à la source selon l'annonce officielle ; les autres surfaces ne sont pas couvertes par cette promesse. | [F2][F2] |
| `facebook.not-interested` | Recommandations · signal négatif | Menu de la publication → « Pas intéressé » ou libellé équivalent ; répondre au détail facultatif seulement si souhaité. | Influence le classement du fil et des contenus similaires, sans exclusion absolue d'un sujet ou d'un auteur. Meta a renommé les anciens boutons « Voir plus / Voir moins » en 2025 ; les anciens guides peuvent conserver ces termes. | [F3][F3], [F4][F4] |
| `facebook.your-algorithm` | Sujets · préférences formulées en texte | Si disponible, menu de la publication → « Your algorithm » → gérer les sujets et préférences proposés. | Contrôle de recommandations pour Feed et Reels annoncé le **13 octobre 2026**, encore en déploiement. La source ne donne pas une liste exhaustive de pays, langues ou comptes éligibles. Les préférences ne sont pas un filtre de mots garanti. | [F4][F4] |

**Qualification API.** Aucun endpoint de gestion du fil personnel correspondant à ces quatre opérations n'a été qualifié ici. La documentation Graph API a renvoyé une limitation HTTP 429 ; la recherche ne permet donc pas de conclure à une absence universelle d'API ou à une disponibilité contractuelle. Garder les guides officiels sans proposer de connexion. [A1][A1]

**Option ancienne à exclure.** Ne pas présenter l'ancien « Keyword Snooze » comme disponible : Meta indique explicitement que son test est terminé depuis janvier 2021. Cette réserve concerne ce produit précis, pas toute évolution ultérieure des préférences de sujets. [F1][F1]

## `instagram` — quatre contrôles

| ID stable | Catégorie et effet | Étapes guidées | Portée et réserve | Guide officiel |
| --- | --- | --- | --- | --- |
| `instagram.mute-account` | Compte · mettre les publications en sourdine | **Indicatif :** ouvrir le profil suivi → menu de l'abonnement → sourdine → publications. | Les publications du compte sont masquées dans le fil en conservant l'abonnement. Le profil reste consultable ; les notifications de commentaires ou identifications peuvent subsister. Le document Meta accessible confirme l'effet, pas ce chemin de menu contemporain. | [I1][I1] |
| `instagram.keyword-recommendations` | Sujets · mots à éviter dans les suggestions | **Indicatif :** réglages de contenu suggéré / mots masqués → ajouter les mots, emojis ou hashtags à éviter si cette option est présente. | La source décrit les mots des légendes et hashtags des publications recommandées. Ne pas étendre cette promesse à tout contenu suivi, aux textes dans les images, à l'audio ou à une exclusion sémantique complète. Le chemin historique de 2023 passe par Confidentialité → mots masqués. | [I2][I2] |
| `instagram.not-interested` | Recommandations · signal négatif | Sur une suggestion ou dans Explore, ouvrir les options → « Pas intéressé ». | Retour sur les recommandations ; Meta vise à réduire les contenus similaires sur d'autres surfaces comme Reels et Search. Ce n'est ni un blocage de l'auteur ni la garantie de ne plus revoir le sujet. | [I2][I2], [I3][I3] |
| `instagram.reset-recommendations` | Recommandations · réinitialiser | Profil → menu à trois barres → préférences de contenu → réinitialiser le contenu suggéré ; lire les conditions et confirmer dans Instagram. | Réinitialise les recommandations d'Explore, Reels et Feed. Elles se personnalisent ensuite à nouveau selon les interactions. Une révision des abonnements est proposée ; la réinitialisation ne vaut pas désabonnement global. | [I4][I4] |

**Qualification API.** Aucun des quatre réglages de consommation personnelle n'est qualifié pour une API FIL CLAIR. L'URL officielle d'aperçu Instagram Platform a renvoyé HTTP 429 pendant cette recherche. Une API de publication ou de modération d'un compte professionnel ne prouverait pas, à elle seule, la possibilité de piloter les recommandations personnelles. Cette dernière phrase est une règle de qualification du produit, pas une affirmation d'absence de toute API. [A2][A2]

**Disponibilité.** Les annonces des filtres de suggestions et de réinitialisation datent de 2023 et 2024 ; leur consultation en 2026 ne constitue pas une recette sur chaque version de l'application. Les pages d'aide Instagram ciblées ont été limitées par HTTP 429. Afficher cette réserve et le lien officiel si le menu attendu n'apparaît pas.

## `threads` — trois contrôles

| ID stable | Catégorie et effet | Étapes guidées | Portée et réserve | Guide officiel |
| --- | --- | --- | --- | --- |
| `threads.unfollow-account` | Compte · ne plus suivre | Ouvrir le profil → menu à trois points → ne plus suivre. | Retire l'abonnement ; ne bloque pas la personne et ne garantit pas son exclusion de For You. | [H1][H1] |
| `threads.following-feed` | Recommandations · choisir les comptes suivis | À l'accueil, sélectionner le fil des abonnements. **Indicatif :** utiliser l'organisation des fils si l'on souhaite changer le fil par défaut. | Meta documente un fil chronologique limité aux profils suivis, distinct de For You. La gestion du fil par défaut existe, mais son chemin détaillé doit être vérifié dans la version utilisée. | [H1][H1], [H2][H2] |
| `threads.hidden-words` | Sujets · filtrer les réponses à ses publications | **Indicatif :** profil → réglages de confidentialité → mots masqués → définir les termes et activer le filtre proposé. | La source officielle accessible établit au minimum le filtrage des **réponses à ses propres threads**. Ne pas vendre ce guide comme un filtre garanti de tout For You ou de toute recherche sans preuve plus récente. | [H1][H1] |

**Qualification API.** L'API Threads officielle existe : l'annonce Meta et sa collection officielle Postman montrent des capacités de contenu et de gestion de réponses. Cela ne qualifie pas l'abonnement, le choix du fil ou la liste des mots masqués comme opérations d'une API personnelle. La documentation développeur détaillée a renvoyé HTTP 429. Aucun connecteur n'est activé. [H3][H3], [H4][H4], [A3][A3]

**Nouveauté hors du parcours privé de base.** « Dear Algo », annoncé en février 2026, permet de formuler une demande temporaire de sujets par une **publication publique** et agit pendant trois jours. L'annonce mentionne États-Unis, Nouvelle-Zélande, Australie et Royaume-Uni. Ne pas le remplacer par une action silencieuse ou proposer une publication implicite. Cette fonction n'entre pas dans les trois contrôles ci-dessus. [H5][H5]

## `tiktok` — quatre contrôles

| ID stable | Catégorie et effet | Étapes guidées | Portée et réserve | Guide officiel |
| --- | --- | --- | --- | --- |
| `tiktok.unfollow-account` | Compte · ne plus suivre | Ouvrir le profil → toucher le bouton indiquant que le compte est suivi. | La documentation de recommandations relie le désabonnement au retrait des publications de Following ou Friends ; ne pas garantir qu'elles ne seront jamais recommandées dans For You. Le chemin est documenté dans un ancien guide officiel, donc à vérifier dans l'application actuelle. | [T1][T1], [T2][T2] |
| `tiktok.filter-keywords` | Sujets · filtre de mots | **Indicatif :** Profil → menu → paramètres et confidentialité → préférences de contenu → filtrer les mots ; ajouter les termes et choisir les surfaces/options disponibles. | TikTok décrit les filtres dans For You, Following, Friends, LIVE et STEM. Le filtre intelligent peut élargir aux variantes ou synonymes ; il ne faut pas assimiler cette classification à une garantie exhaustive. Les annonces 2025 parlent d'un plafond porté à 200, à ne pas figer sans vérifier l'interface. | [T2][T2], [T3][T3] |
| `tiktok.not-interested` | Recommandations · signal négatif | Appui prolongé sur une vidéo → « Pas intéressé ». | Demande moins de contenus similaires ; aucun blocage de compte ni exclusion définitive de sujet n'est promis. Les détails et surfaces du menu peuvent varier. | [T4][T4], [T2][T2] |
| `tiktok.manage-topics` | Sujets · ajuster les proportions | Profil → menu → paramètres et confidentialité → préférences de contenu → gérer les sujets → ajuster les curseurs → enregistrer. | Ne concerne que For You, notamment les recommandations hors abonnements ; ne modifie pas Following, le profil ou la boîte de réception. L'adaptation peut prendre du temps et les thèmes restent ceux que TikTok propose. | [T5][T5] |

**Qualification API.** Le registre officiel de scopes consulté présente lecture du profil et des vidéos, publication, portabilité et recherche ; il n'y documente pas de scope pour les quatre réglages ci-dessus. Conclusion limitée : **aucune capacité correspondante qualifiée dans ce registre public**, pas « TikTok n'a aucune API ». Une intégration nécessiterait une nouvelle vérification des produits, approbations, scopes et conditions. [T6][T6]

**Disponibilité.** Certains articles d'aide ont été accessibles via l'index de recherche officiel mais leur ouverture directe a échoué (robots.txt ou HTTP 503). Les paramètres de personnalisation non algorithmique, distincts de ces quatre contrôles, ont une disponibilité régionale documentée ; ne pas les ajouter comme fonction mondiale. [T2][T2]

## `reddit` — trois contrôles

| ID stable | Catégorie et effet | Étapes guidées | Portée et réserve | Guide officiel |
| --- | --- | --- | --- | --- |
| `reddit.mute-community` | Source · masquer une communauté | Page de la communauté → menu de plus d'options → masquer `r/communauté` ; vérifier le nom et confirmer si demandé. | Exclut la communauté des notifications, du fil d'accueil et de Popular sur les applications et reddit.com. Ne promet pas de couvrir tout Reddit, la recherche ou la visite directe. Maximum documenté : 1 000 communautés ; réactiver leurs notifications peut annuler le masquage. | [R1][R1] |
| `reddit.disable-home-recommendations` | Recommandations · désactiver les suggestions de l'accueil | Web : préférences → désactiver les recommandations du fil d'accueil. Mobile : réglages du compte → confidentialité → désactiver le même réglage. | Contrôle des recommandations du fil d'accueil, notamment du tri Best. Ne constitue pas une désactivation des publicités ni des recommandations de toutes les autres surfaces. Article mis à jour le 5 octobre 2026. | [R2][R2] |
| `reddit.block-account` | Compte · bloquer | Profil → menu de plus d'options → bloquer le compte. | Masque ses publications dans les fils et restreint les interactions. Certains commentaires restent repliés mais dépliables ; exceptions pour les modérateurs et discussions de groupe. Ne s'applique pas aux publicités. Limite documentée : 1 000 comptes. | [R3][R3], [R4][R4] |

**Qualification API.** La référence Data API documente `POST /api/block_user`, réservé aux applications OAuth approuvées. Il ne faut donc pas affirmer que le blocage ne possède aucune API officielle. Le wiki impose un accès conforme aux règles de Reddit et une authentification OAuth ; aucune approbation n'est obtenue ici. Le masquage personnel d'une communauté ne doit pas être confondu avec `muted` dans les endpoints de modération d'un subreddit. Les deux autres contrôles restent non qualifiés pour un connecteur dans cette recherche. [R5][R5], [R6][R6]

## `linkedin` — trois contrôles

| ID stable | Catégorie et effet | Étapes guidées | Portée et réserve | Guide officiel |
| --- | --- | --- | --- | --- |
| `linkedin.unfollow-source` | Source · ne plus suivre | Mon réseau → abonnements et abonnés → onglet des sources suivies → bouton d'abonnement → confirmer le désabonnement. | Réduit le contenu suivi d'une personne ou entreprise dans le fil ; ce réglage n'est pas un blocage. Les modifications de préférences sur mobile s'appliquent aussi au web selon l'aide. | [L1][L1] |
| `linkedin.not-interested` | Recommandations · signal négatif | Menu de plus d'options d'une publication → « Pas intéressé » quand proposé. | Retire la publication et peut améliorer les recommandations futures. Une croix peut seulement cacher une publication ; une option relative à l'auteur peut avoir un autre effet. Présenter exactement le choix disponible, sans les fusionner. | [L2][L2] |
| `linkedin.block-member` | Compte · bloquer un membre | Profil → plus d'options → signaler ou bloquer → bloquer le membre → confirmer le bon nom. | Action de relation et de visibilité, plus forte qu'un simple réglage de fil. Après déblocage, attendre 48 heures avant de rebloquer ; certaines recommandations de profil perdues ne sont pas rétablies. Une exception de notification peut concerner les comptes Recruiter partagés. | [L3][L3] |

**Qualification API.** Les permissions ouvertes de la documentation LinkedIn couvrent notamment l'identité et `w_member_social` pour publier/commenter/aimer ; cette liste ne qualifie pas la gestion du fil personnel, le désabonnement ou le blocage. La plupart des autres permissions relèvent d'une approbation. Conclusion limitée aux produits et permissions inspectés ; aucune absence globale d'API partenaire n'est affirmée. [L4][L4]

## Limites de la recherche et règles de maintenance

- Aucun compte ni appareil réel n'a servi à vérifier l'apparition des menus, leur traduction, une disponibilité régionale, un état avant/après ou une synchronisation entre appareils.
- Les pages d'aide Meta exigeaient parfois une connexion ou renvoyaient HTTP 429 ; des annonces officielles plus anciennes établissent alors l'effet, avec les étapes indicatives clairement marquées. Ne pas retirer cette réserve sans recette documentaire ou fonctionnelle nouvelle.
- Les sources TikTok accessibles par le moteur ont parfois un index âgé de plusieurs mois. La consultation du 28 octobre ne signifie pas que le fournisseur a révisé l'article ce jour-là.
- « Annoncé », « en déploiement », « disponible pour mon compte » et « déclaré effectué » doivent rester des états distincts. Une annonce récente ne justifie pas une disponibilité mondiale.
- La recherche est ciblée sur les contrôles retenus, sans audit exhaustif des contrats partenaires ou des API privées. L'absence de capacité qualifiée n'est jamais une preuve de son inexistence.
- Avant toute future API : vérifier la permission officielle exacte, l'éligibilité de l'application, le consentement lié au compte et à la cible, les quotas, les règles d'automatisation, la lecture indépendante du résultat et la gestion des états indéterminés. Ce document n'autorise aucune intégration ni action réelle.

## Registre des sources primaires

Toutes les sources et tentatives ci-dessous ont été consultées/recherchées le **2026-10-28**. Les liens vers des pages d'aide servent de guides ; les annonces servent surtout de preuve de fonction et de portée. Aucune source tierce n'est utilisée comme preuve technique.

| Réf. | Source officielle et élément vérifié | État de consultation |
| --- | --- | --- |
| X1 | [X — mise en sourdine des comptes][X1] | Page ouverte ; effets et étapes accessibles. |
| X2 | [X — blocage][X2] | Page ouverte ; exceptions et étapes accessibles. |
| X3 | [X — options avancées de mots masqués][X3] | Page ouverte ; surfaces, recherche exclue, durées et étapes. |
| X4 | [X — fonctionnement des fils][X4] | Résultat officiel indexé ; choix et persistance du dernier fil. |
| X5 | [X — système de recommandations For You][X5] | Résultat officiel indexé ; fil Following chronologique. |
| X6 | [X API — Mute User][X6] | Page ouverte ; endpoint officiel existant. |
| X7 | [X API — Block User][X7] | Page ouverte ; classement Enterprise observé. |
| X8 | [X — politique de recommandations][X8] | Résultat officiel indexé ; divergence sur la visibilité après blocage. |
| F1 | [Meta — fin du test Keyword Snooze][F1] | Article officiel avec mise à jour du 13 janvier 2021. |
| F2 | [Meta — Snooze][F2] | Article officiel indexé ; pause de 30 jours. |
| F3 | [Meta — personnalisation du fil Facebook][F3] | Mise à jour officielle du 11 mars 2025 sur le changement de noms. |
| F4 | [Meta — Your algorithm][F4] | Page ouverte et passage ciblé relu ; annonce du 13 octobre 2026. |
| I1 | [Meta — outils de gestion du temps Facebook/Instagram][I1] | PDF officiel indexé ; effet de mute sur le fil. |
| I2 | [Meta — réglages des recommandations Instagram][I2] | Article officiel indexé ; mots de légendes/hashtags et retour Not interested. |
| I3 | [Meta — fonctionnement du classement et contrôles][I3] | Article officiel indexé ; centres de préférences et contrôle négatif. |
| I4 | [Meta — réinitialiser les recommandations Instagram][I4] | Article officiel indexé ; étapes et nouvelle personnalisation. |
| H1 | [Meta — Threads et mises à jour][H1] | Page ouverte et passages ciblés relus ; abonnements, mots des réponses, fil Following. |
| H2 | [Meta — personnalisation des fils Threads][H2] | Page ouverte et passage ciblé relu ; ordre et fil par défaut. |
| H3 | [Meta — API et outils Threads][H3] | Article officiel indexé ; existence et finalité de l'API. |
| H4 | [Meta — collection officielle Threads API sur Postman][H4] | Page ouverte ; publication et autorisation OAuth visibles. Collection non exhaustive. |
| H5 | [Meta — Dear Algo][H5] | Article officiel indexé ; publication publique, durée et pays annoncés. |
| T1 | [TikTok — guide officiel de désabonnement][T1] | Ancien article officiel indexé ; chemin du profil. Ne pas reprendre ses anciennes règles de DM. |
| T2 | [TikTok — fonctionnement des recommandations][T2] | Contenu officiel indexé ; ouverture canonique en HTTP 503. |
| T3 | [TikTok — Smart Keyword Filters][T3] | Article officiel de 2025 indexé ; annonce et limites d'un déploiement. |
| T4 | [TikTok — Control your scroll][T4] | Article officiel de 2025 indexé ; appui long et filtre intelligent. |
| T5 | [TikTok — gérer les sujets][T5] | Aide officielle indexée ; étapes et portée For You. |
| T6 | [TikTok for Developers — registre de scopes][T6] | Page ouverte et liste de scopes inspectée. |
| R1 | [Reddit — masquage des communautés][R1] | Aide officielle indexée ; surfaces, étapes, plafond et notifications. |
| R2 | [Reddit — recommandations de l'accueil][R2] | Aide officielle indexée ; mise à jour du 5 octobre 2026. |
| R3 | [Reddit — bloquer un compte][R3] | Aide officielle indexée ; parcours web et mobile. |
| R4 | [Reddit — effets du blocage][R4] | Aide officielle indexée ; mise à jour du 5 octobre 2026. |
| R5 | [Reddit — référence Data API][R5] | Référence officielle indexée ; `block_user` réservé aux applications OAuth approuvées. |
| R6 | [Reddit — Data API Wiki][R6] | Aide officielle indexée ; OAuth et demande d'accès. |
| L1 | [LinkedIn — préférences du fil][L1] | Aide officielle indexée ; parcours des abonnements. |
| L2 | [LinkedIn — masquer le contenu du fil][L2] | Aide officielle indexée ; options différentes selon la publication. |
| L3 | [LinkedIn — bloquer/débloquer un membre][L3] | Aide officielle indexée récemment ; étapes et limites. |
| L4 | [LinkedIn/Microsoft Learn — accès aux API][L4] | Documentation officielle indexée ; permissions ouvertes et approbations. |
| A1 | [Meta — documentation Graph API][A1] | Tentative d'ouverture limitée par HTTP 429 ; contenu non qualifié. |
| A2 | [Meta — aperçu Instagram Platform][A2] | Tentative d'ouverture limitée par HTTP 429 ; contenu non qualifié. |
| A3 | [Meta — documentation Threads API][A3] | Tentative d'ouverture limitée par HTTP 429 ; contenu non qualifié. |

[X1]: https://help.x.com/en/using-x/x-mute
[X2]: https://help.x.com/en/using-x/blocking-and-unblocking-accounts
[X3]: https://help.x.com/en/using-x/advanced-x-mute-options
[X4]: https://help.x.com/en/using-x/x-timeline
[X5]: https://help.x.com/en/resources/recommender-systems/for-you-home-timeline-recommendations
[X6]: https://docs.x.com/x-api/users/mute-user
[X7]: https://docs.x.com/x-api/users/block-user
[X8]: https://help.x.com/en/rules-and-policies/recommendations
[F1]: https://about.fb.com/news/2018/06/keyword-snooze-a-new-way-to-help-control-your-news-feed/
[F2]: https://about.fb.com/news/2017/12/news-feed-fyi-snooze/
[F3]: https://about.fb.com/news/2022/10/new-ways-to-customize-your-facebook-feed/
[F4]: https://about.fb.com/news/2026/10/introducing-your-algorithm-facebook/
[I1]: https://about.fb.com/wp-content/uploads/2021/11/Time-Management-Tools-on-FB_IG-1.pdf
[I2]: https://about.fb.com/news/2023/01/instagram-quiet-mode-manage-your-time-and-focus/
[I3]: https://about.fb.com/news/2023/06/how-ai-ranks-content-on-facebook-and-instagram/
[I4]: https://about.fb.com/news/2024/11/introducing-recommendations-reset-instagram/
[H1]: https://about.fb.com/news/2023/07/introducing-threads-new-app-text-sharing/
[H2]: https://about.fb.com/news/2025/03/new-threads-features-more-personalized-experience-you-control/
[H3]: https://about.fb.com/news/2024/08/new-threads-features-for-creators-and-businesses/
[H4]: https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api
[H5]: https://about.fb.com/news/2026/02/threads-dear-algo/
[T1]: https://newsroom.tiktok.com/controlling-your-dms?lang=en
[T2]: https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content
[T3]: https://newsroom.tiktok.com/more-ways-to-discover-new-content-and-creators-you-love?lang=en
[T4]: https://newsroom.tiktok.com/tiktoks-new-features-to-help-you-control-your-scroll?lang=en-AU
[T5]: https://support.tiktok.com/en/account-and-privacy/account-privacy-settings/manage-topics
[T6]: https://developers.tiktok.com/docs/en/tiktok-api-scopes
[R1]: https://support.reddithelp.com/hc/en-us/articles/9810475384084-What-is-community-muting
[R2]: https://support.reddithelp.com/hc/en-us/articles/4402284777364-What-are-home-feed-recommendations
[R3]: https://support.reddithelp.com/hc/en-us/articles/214548323-How-do-I-block-someone
[R4]: https://support.reddithelp.com/hc/en-us/articles/4413520308372-How-does-blocking-work
[R5]: https://www.reddit.com/dev/api/
[R6]: https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki
[L1]: https://www.linkedin.com/help/linkedin/answer/a528074
[L2]: https://www.linkedin.com/help/linkedin/answer/a523209
[L3]: https://www.linkedin.com/help/linkedin/answer/a1338373/block-or-unblock-a-member?lang=en
[L4]: https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access
[A1]: https://developers.facebook.com/docs/graph-api/
[A2]: https://developers.facebook.com/docs/instagram-platform/overview/
[A3]: https://developers.facebook.com/docs/threads
