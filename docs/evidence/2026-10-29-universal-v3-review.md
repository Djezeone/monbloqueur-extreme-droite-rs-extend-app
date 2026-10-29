# Revue indépendante V3 et dispositions

Revue en lecture seule par un contexte neuf, modèle GPT-6 Astra, sur `51abcd35..23f51af2` et la documentation en préparation. Aucun fichier/ref modifié par le relecteur, aucun sous-relecteur ni action externe. Cette revue de code ne constitue ni approbation GitHub humaine ni Go de livraison.

## Constats du relecteur
Points solides relevés : validation stricte/bornée des événements et dates ; anciens objets inchangés à la lecture ; désélection sans perte ; registre public immuable et liens fixes séparés des cibles/preuves ; réutilisation du stockage atomique/récupération. Le relecteur a exécuté les 10 tests modèle/registre initiaux et le contrôle du registre, tous verts, et comparé les 45 empreintes source et 24 logs au reçu pré-revue. Il n'a pas relancé la matrice navigateur complète.

**Aucun Critical trouvé.** Un Important et deux Minor identifiés :

| Réf. / sévérité initiale | Problème reproduit | Disposition et preuve |
| --- | --- | --- |
| I1 Important | DéclaréT2 → échecT3 → état précédentT4 faisait réapparaître une déclaration datéeT4 sans confirmation propre à cette nouvelle déclaration. Aucune preuve API n'était créée, mais la provenance temporelle était ambiguë. | Choix d'implémentation : **nouvelle déclaration explicite**, au lieu de prétendre restaurer une date historique. Le modèle refuse un retour à `declared` sans option `redeclare:true` ; l'interface demande une confirmation avec état, cible, contrôle, service, portée et date de nouvelle déclaration. Refus = snapshot intact. Tests Node (échec et annulation) et E2E (refus puis accord) RED→GREEN. |
| M1 Minor | Une décision importée sans liste/profil présent était comptée dans les actions déclarées courantes :0entrée/1action non inspectable. | Reclassé Important par l'exécuteur : les KPI doivent être vérifiables dans les fiches courantes. Compter via la même population de listes/comptes que les autres métriques ; conserver la décision importée dans le snapshot, sans purge silencieuse. E2E RED→GREEN, compteur0et source inchangée. |
| M2 Minor | Annulation/reprise/undo cherchaient toujours un bouton Déclarer absent et envoyaient le focus dans la recherche, notamment pour une note locale. | Reclassé Important par l'exécuteur : avec jusqu'à500fiches, perdre le contexte après une action clavier compromet le parcours accessible et le nombre minimal d'interactions. Choisir un bouton survivant de la même fiche ou son résumé avancé ; la recherche reste le repli si la fiche a été retirée. E2E RED→GREEN, annulation puis reprise au clavier, focus dans la fiche. |

Coût de ces deux reclassements si la priorité était trop forte : trois petits scénarios supplémentaires dans le script V3 et un passage de tests local, sans nouvelle CI GitHub avant la publication groupée. Aucun mécanisme API ou permission ajouté.

## Vérification de correction
Le commit local `12ab9be` contient le passage de correction. Les trois scénarios ont d'abord échoué ensemble dans [review-ui-red.log](v3/historical/review-ui-red.log), et le contrat de nouvelle déclaration dans [review-model-red.log](v3/historical/review-model-red.log). Après correction : suite Node **144/144**, script V3 Chromium **15/15**. Le passage complet final sur les trois moteurs est consigné dans les [logs finaux](v3/README.md) et le [reçu](v3/receipt.json), pas supposé par le présent texte.

Les preuves avant correction sont conservées sous `v3/historical/pre-review/`, dont le reçu et les 24 logs que le relecteur a contrôlés. Elles restent historiques et ne qualifient pas les corrections. Aucune seconde revue n'est revendiquée ; chaque correction est justifiée par un test reproduisant l'écart, puis les suites affectées.

## Points écartés par la revue et décisions de l'exécuteur

| Périmètre que le relecteur n'a pas jugé | Décision / conséquence si cette limite était ignorée |
| --- | --- |
| Comportement réel des fournisseurs, disponibilité par compte, effets algorithmiques et déploiement X | Rester documentaire, `providerTested:false`, aucune mesure de portée ni action de signalement. Risque sinon : promesse ou effet inventé. |
| Exactitude contemporaine de chaque source/scopes externes | Réutiliser les preuves datées et leur confiance ; lecture ciblée X nouvelle, pas d'audit Web exhaustif prétendu. Requalifier avant activation. Risque sinon : contrôle ou droit fournisseur périmé. |
| OAuth/révocation/identité et orchestration fournisseur durable | Inactifs et B CONNECT fermée jusqu'à qualification réelle. Risque sinon : action sous une mauvaise identité ou révocation faussement annoncée. |
| Appareils physiques, Safari commercial, lecteurs d'écran, WCAG complet | Émulation et axe restent partiels ; portes physiques/accessibilité ouvertes. Risque sinon : incompatibilité ou exclusion masquée. |
| Protections GitHub, quota/facturation, CI distante et déploiement/coût | Vérification séparée par l'exécuteur : mainprotected:false, alerte Actions identifiée sans compteur live, scénario public standard gratuit documenté, CIauhead à lire après push, Vercel sans coût gratuit établi. Risque sinon : faux PASS ou dépense non autorisée. |
| Droit, responsable/contact/support, contrats/rétention hébergeur et Go public | Réserves RGPD/opérations maintenues, publication No-Go. Risque sinon : responsabilité ou conservation non qualifiée. |
| Authenticité des dates d'une sauvegarde non signée | Validation structurelle seulement ; dates importées restent déclaratives et ne prouvent aucun fait fournisseur. Aucune signature ou preuve cryptographique inventée. Risque sinon : historique utilisateur pris à tort pour attestation indépendante. |

## Décision
Les trois écarts sont traités dans le passage de correction ; aucun Minor laissé silencieusement de côté. Code proposé en PR draft pour revue, sous réserve des contrôles au head final. **Fusion main et publication générale : No-Go**. Les réserves externes des huit lots restent inchangées et visibles dans le journal/cockpit.
