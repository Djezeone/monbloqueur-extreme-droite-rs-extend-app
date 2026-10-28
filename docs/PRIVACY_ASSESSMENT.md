# FIL CLAIR — Évaluation confidentialité et dossier AIPD

Date de revue : **2026-10-28**. Périmètre : PWA dans `pwa/`, parcours manuel et préparation des connecteurs. Ce document décrit le code local examiné, pas la configuration effective d’un compte Vercel ni une validation juridique. L’extension historique requiert une analyse distincte avant toute nouvelle distribution.

**Décision actuelle : publication publique bloquée.** Le lot 6 est documenté mais reste ouvert. Le responsable, les bases légales, la qualification des données sensibles, les conditions d’hébergement et la décision AIPD ne sont pas validés. Les essais restent sur des données synthétiques ; aucun compte social réel n’a été utilisé pour cette revue.

## Responsabilités et informations indispensables

| Élément | État au 2026-10-28 | Condition de clôture |
|---|---|---|
| Responsable du traitement, qualité juridique, adresse | **Non renseignés — OUVERT** | Identifier la personne ou l’entité qui détermine chaque finalité et les moyens ; ne pas déduire ce rôle d’un nom de marque ou d’un compte GitHub |
| Contact droits / confidentialité / support | **Non renseigné — OUVERT** | Canal surveillé, destinataire nommé, procédure d’identité proportionnée et délais définis |
| DPO ou conseil protection des données | **Non qualifié — OUVERT** | Déterminer si une désignation est obligatoire et obtenir l’avis approprié |
| Bases légales par finalité, exception de l’article 9 si nécessaire | **Non arrêtées — OUVERT** | Décision motivée du responsable, incluant les personnes présentes dans les listes et pas seulement l’utilisateur |
| Hébergeur / contrats / accès / transferts | Vercel identifié par la mission ; réglages du projet non vérifiés ici | Examiner contrat applicable, sous-traitants, lieux, garanties de transfert, journaux, habilitations et durées |
| Publication de la notice | `pwa/privacy.html` préparé | Compléter les champs précédents et vérifier sa concordance avec la version réellement déployée |

Le RGPD demande notamment une information sur le responsable, les finalités, les bases légales, les destinataires, les durées et les droits ; l’information sur les personnes issues de sources tierces doit aussi être instruite (articles 13–14). Le texte de référence consulté est la reproduction officielle de la CNIL [R2]. Le caractère local du stockage ne dispense pas d’identifier les rôles. L’usage domestique éventuel d’une personne ne permet pas de déclarer toute l’activité de l’éditeur exemptée : le considérant 18 distingue les fournisseurs de moyens [R1].

## Cartographie du fonctionnement observé

Références de code : `pwa/app.js`, `pwa/core.js`, `pwa/sw.js`, `pwa/index.html`. Les identifiants, titres et contenus ci-dessous doivent être traités comme potentiellement personnels ; un pseudo public n’est pas une donnée anonyme.

| Données / traitement | Source et finalité | Emplacement / destinataire | Conservation et contrôle |
|---|---|---|---|
| Réseau, pseudo, instance Mastodon | Saisie, fichier JSON, sélection publique ; afficher les profils et construire leurs liens | État en mémoire puis clé `fil-clair-v1` de `localStorage` sur l’origine de la PWA | Pas d’expiration temporelle automatique ; retrait/effacement local ou éviction par le navigateur |
| Listes : identifiant, titre, comptes, liste active ; `revision` et `provenance` optionnelles (`label`, URL HTTPS sans paramètres, date `retrievedAt`) | Organiser les choix et garder la provenance déclarative d’un import, sans interrogation de la source | Même état local ; liste active dans l’interface | Maximum de 30 listes et 5 000 profils par liste ; bornes techniques, pas justification juridique de conservation |
| Décisions et historique daté | Déclarations `blocked`, `muted`, `skipped`, `review` ; remise à faire `todo` ; afficher progression et journal | Même état local ; clefs associant liste, réseau et pseudo | 10 000 décisions et 1 000 événements au maximum ; pas de purge par âge ; les statuts manuels ne sont pas des preuves fournisseur |
| JSON importé | Lecture d’un fichier choisi par l’utilisateur ; validation avant application | Mémoire du navigateur ; aucun upload de fichier prévu dans ce parcours | Le fichier d’origine demeure à l’emplacement choisi par l’utilisateur ; il n’est pas supprimé par l’import |
| Export de liste | Produire `fil-clair-liste.json`, sans historique complet | Fichier téléchargé via un `Blob`, sur l’appareil | JSON en clair ; pas d’effacement ni d’expiration à distance |
| Export de sauvegarde | Produire `fil-clair-sauvegarde.json` avec listes, décisions et historique | Fichier téléchargé ; peut ensuite être copié ou synchronisé par le système | JSON en clair ; contrôle de l’utilisateur sur fichiers, corbeilles, copies et sauvegardes système |
| Stockage illisible ou refusé | `loadState()` rend l’erreur et la valeur brute ; `app.js` conserve cette valeur et bloque les mutations ordinaires pendant la récupération | Valeur locale / mémoire ; export explicite `fil-clair-recuperation.json` depuis les réglages ou « Exporter mes données » | Texte brut non validé, pas une sauvegarde restaurable présumée ; seule une restauration validée ou un effacement explicite permet le remplacement. Ne jamais envoyer ce contenu au support public |
| Fichiers de l’application et service worker | Chargement du site et fonctionnement de certaines fonctions hors ligne | CacheStorage `fil-clair-shell-v3` et cache HTTP du navigateur | Shell explicite incluant la notice, sans ajout dynamique de réponse ; chemins OAuth/API et paramètres exclus. Effacer les données du site pour retirer aussi caches et enregistrement du service worker |
| Requêtes de visite / mise à jour | Acheminer HTML, JS, CSS et icônes | Vercel et infrastructure de distribution | IP, horodatage, URL et données de navigateur peuvent être traités côté hébergeur ; durées réelles du projet **non établies** ici [H1–H2] |
| Téléchargement de la sélection publique X | Clic explicite ; GET vers `raw.githubusercontent.com/.../b7cd31b036cca17b48dbf726c047847191c01a5b/liste/accounts.json`, révision Git figée | GitHub reçoit des métadonnées réseau, notamment l’IP ; fichier public importé dans l’état local avec source et date de récupération déclaratives | `credentials: "omit"`, `cache: "no-store"` et délai borné dans le code ; cela n’interdit pas les journaux du fournisseur |
| Ouverture d’un profil | Navigation demandée par l’utilisateur | Réseau social ou instance Mastodon ; son éventuelle session s’applique | Liens `noopener noreferrer` ; les règles, cookies et données du site visité s’appliquent séparément |

Le code examiné n’ajoute pas de synchronisation de listes, de mesure d’audience, de pixel publicitaire, de collecte des mots de passe ou de remontée automatique des exceptions. Cette observation applicative n’est pas une affirmation d’absence de données personnelles sur le réseau. Une protection Vercel peut également utiliser une session d’authentification : elle relève de l’accès au déploiement et doit être expliquée aux testeurs.

La documentation Vercel prévoit des informations de trafic d’utilisateurs finaux, dont l’IP, et un schéma de journaux pouvant couvrir les fichiers statiques [H1–H2]. **Aucun audit de contenu ou de rétention des journaux de ce projet n’a été effectué dans ce lot.** Ne pas transposer la rétention des seuls Runtime Logs à tous les journaux CDN, sécurité ou fournisseurs.

## Sensibilité, finalités et bases légales à qualifier

La finalité technique prévue est d’aider une personne à organiser son propre fil, examiner des profils et consigner des déclarations. Les statistiques de progression sont calculées localement ; les étoiles ne nécessitent pas un identifiant de suivi supplémentaire.

Le nom du dépôt, la sélection publique, un titre de liste ou l’association d’un pseudo à une sélection politique peuvent révéler ou suggérer des opinions politiques concernant l’utilisateur **et des tiers**. Une appartenance à une liste ne démontre pas une opinion réelle. Le risque porte aussi sur une attribution inexacte, une republication ou une corrélation avec d’autres sources. L’absence de champ intitulé « opinion politique » n’écarte pas cette question.

Les articles 5, 6 et 9 du RGPD encadrent les finalités, la minimisation, la durée, la licéité et les données révélant des opinions politiques [R3]. **Interprétation à faire valider :** une autorisation de l’utilisateur ne couvre pas automatiquement les données sensibles des profils tiers. Le fait qu’un pseudo soit public ou qu’un tiers l’ait placé dans une liste ne démontre pas que la personne a manifestement rendu publique l’opinion qui lui est attribuée. Aucune exception de l’article 9 n’est présumée acquise ici.

| Finalité | Décision attendue du responsable |
|---|---|
| Fourniture du parcours local | Délimiter les rôles et la base de l’article 6 ; apprécier l’article 9 selon les données réellement traitées |
| Constitution / distribution d’une liste publique | Documenter la source, la qualité éditoriale, les corrections, la nécessité, l’information des tiers et l’exception éventuelle de l’article 9 |
| Sécurité et disponibilité de l’hébergement | Documenter finalité, base, accès, rétention et contrat ; aucune option de surveillance supplémentaire activée par ce dossier |
| Support et incidents | Définir un canal et une conservation proportionnée ; privilégier des reproductions synthétiques sans listes ni identifiants |
| Futur OAuth / lecture / action fournisseur | Réviser la cartographie avant activation ; préciser permissions et conséquences de chaque action, les bases légales et le retrait / la révocation |

## Minimisation, durées et effacement

Mesures présentes, relues dans l’intégration `app.js` du 2026-10-28 : pseudo/réseau/instance normalisés, limites de taille et de quantité, rendu des contenus comme texte, import de fichier local, export contrôlé par l’utilisateur, refus des sauvegardes invalides, récupération brute sans réécriture ordinaire et séparation entre déclaration locale et preuve distante. `exportList()` conserve les métadonnées ; `removeAccount()` et `removeList()` sont appelés par l’interface. Les résultats navigateur de l’intégration sont consignés dans la [preuve QA datée](evidence/2026-10-28-pwa-qa.md) ; ils ne sont pas une validation d’un déploiement externe.

L’état local ne bénéficie pas d’un chiffrement applicatif. Une compromission de l’origine ou un script autorisé malveillant pourrait lire `localStorage` ; un accès au profil du navigateur ou à une sauvegarde pourrait aussi exposer les listes. Le verrouillage de l’appareil et un emplacement protégé pour les exports restent nécessaires. La PWA ne garantit pas la synchronisation, la sauvegarde, la disponibilité permanente ni l’effacement physique sécurisé du support.

| Action utilisateur / exploitant | Portée réelle | Limite / vérification |
|---|---|---|
| Retirer un compte ou une liste | L’interface appelle `removeAccount()` / `removeList()` pour purger les décisions correspondantes ; la dernière liste est remplacée par une liste personnelle vide | **L’historique conserve les références aux profils et listes retirés** ; le drill vérifie qu’une décision supprimée ne ressuscite pas lors du réajout |
| « Effacer toutes mes données » | Remise à zéro des listes, déclarations et historique si l’écriture réussit | Ne retire pas les téléchargements, les copies système, les logs, les blocs sociaux ni forcément les caches du navigateur |
| Effacer les données du site dans le navigateur | Stockage de cette origine, caches et service worker selon le navigateur | À essayer sur Android/iOS physiques ; la désinstallation seule ne prouve pas l’effacement |
| Supprimer les exports et copies | Fichiers, corbeilles et destinations de sauvegarde sous contrôle de l’utilisateur | Les supports et services de sauvegarde ont leurs propres délais ; aucune suppression distante prévue par la PWA |
| Restaurer une sauvegarde | Remplace l’état local après validation et confirmation | Peut réintroduire d’anciens profils ou choix ; l’utilisateur doit en être informé et revérifier leur utilité |
| Journaux d’exploitation | Pas de nouvelle collecte applicative prévue | Le responsable doit fixer les durées réelles avec l’hébergeur et les documenter avant public ; pas de promesse d’effacement instantané |

Le parseur accepte, pour compatibilité des anciennes sauvegardes, des décisions canoniques dont le profil ou la liste n’est plus présent. Elles peuvent donc rester dans l’état importé, même si l’interface ne les affiche plus. La suppression d’une liste existante purge ses décisions ; l’effacement global retire aussi ces références héritées et tout l’historique. Cette conservation héritée doit être revue avant une politique de purge plus fine.

**Politique cible à approuver, non implémentée :** revoir périodiquement les listes et copies conservées, éliminer les exports devenus inutiles et fixer une durée adaptée aux finalités. Aucune durée arbitraire de 30 ou 90 jours n’est présentée comme déjà appliquée. Les données de cas d’incident doivent être réduites à un identifiant d’incident, des dates, les versions et symptômes ; une conservation plus longue doit être motivée et restreinte.

Pour l’exercice des droits, les outils locaux facilitent accès, export, correction et effacement. Ils ne remplacent pas un canal pour les données éventuellement détenues par l’exploitant ou un traitement de liste éditoriale. La procédure doit distinguer utilisateur, profil tiers, source publique et traces d’hébergement, et prévoir l’information appropriée des personnes concernées [R2]. Ne pas exiger une copie d’identité ou une sauvegarde complète par défaut ; ne rien publier dans une issue pour prouver sa demande.

## Évaluation préalable de l’AIPD

La CNIL présente neuf critères et demande une AIPD notamment en présence d’au moins deux, ou d’un traitement présentant un risque élevé ; ses listes de cas requis / exemptés doivent aussi être examinées [A1]. L’EDPB rappelle que l’évaluation précède le traitement à risque élevé et que les risques résiduels élevés appellent une consultation de l’autorité [A2]. Le présent dossier ne constitue ni une AIPD finalisée ni une décision d’exemption.

| Critère CNIL / G29 | Observation sur le prototype | Évaluation préalable |
|---|---|---|
| Évaluation / scoring / profilage | Aucun score politique ni inférence automatique utilisateur observé ; une sélection éditoriale de profils peut toutefois constituer une évaluation de tiers | **À qualifier**, notamment pour la liste publique et ses critères de sélection |
| Décision automatisée à effet juridique ou similaire | Parcours manuel ; aucune action sociale de production qualifiée | Non établi dans A ; réévaluer pour toute automatisation et ses effets |
| Surveillance systématique | Aucune télémétrie de listes observée ; traces d’hébergement possibles | Non établi pour les choix locaux ; qualifier les journaux et toute nouvelle supervision |
| Données sensibles / hautement personnelles | Listes et choix susceptibles de révéler ou suggérer des opinions politiques | **Signal de risque retenu** dans cette évaluation technique ; qualification juridique ouverte |
| Grande échelle | Les plafonds locaux ne renseignent ni le nombre total d’utilisateurs ni la portée d’une liste distribuée | **Inconnu** ; mesurer la portée prévue avant public sans installer un suivi individuel |
| Croisement de données | Regroupement possible de réseaux dans une liste ; pas de résolution d’identité entre réseaux observée | À qualifier ; ne pas conclure à l’identité d’une personne sur la base de pseudos similaires |
| Personnes vulnérables | Aucun filtrage fiable des mineurs ou personnes vulnérables | **Inconnu** ; définir le public et les restrictions pertinentes |
| Usage innovant | Une PWA locale n’établit pas à elle seule ce critère | Non retenu par le seul choix technique ; réévaluer tout enrichissement / algorithme |
| Exclusion d’un droit / service / contrat | Aucune décision d’accès à un service prise par le prototype | Non établi dans A ; apprécier les effets d’une diffusion ou d’un usage organisationnel |

**Décision de travail : instruire une AIPD complète avant la livraison C PUBLIC ; garder B CONNECT fermé tant que sa cartographie, les bases et les risques OAuth ne sont pas qualifiés.** C’est une décision prudente de gouvernance du projet, pas une conclusion que la loi impose systématiquement une AIPD à chaque usage local. Il manque la portée, le public, les rôles et la qualification de la sélection éditoriale pour conclure juridiquement. Aucun cas d’exemption des listes CNIL n’a été démontré.

Le dossier à faire décider par le responsable comprend : traitements et finalités réels, nécessité de la sélection politique et des horodatages, solutions moins intrusives, information/correction des tiers, gravité et vraisemblance pour les personnes, mesures testées, risques résiduels, avis du DPO si applicable, décision motivée, version et date de réexamen. Le responsable doit traiter l’éventuelle consultation préalable avant l’activité concernée (articles 35–36 [R4]).

| Scénario de risque | Conséquence possible pour les personnes | Mesures et reste à faire |
|---|---|---|
| Export ou appareil consulté par un tiers | Révélation des choix, opinions supposées ou relations ; harcèlement ou stigmatisation | Données locales minimales, export explicite, pas de sauvegarde centralisée ; pas de chiffrement applicatif, risque résiduel à accepter |
| Liste publique inexacte ou réutilisée comme classification | Attribution politique erronée à des profils tiers | Provenance/révision, libellé éditorial, contrôle humain, correction et recours à organiser |
| Script ou déploiement compromis | Exfiltration du stockage local / fausse interface de connexion | CSP, dépendances réduites, revue, provenance du build, contrôle des accès ; pas d’assurance d’inviolabilité |
| Sauvegarde corrompue ou éviction du navigateur | Perte de choix, reprise incohérente | Import strict, export avant restauration, drill synthétique ; validation physique ouverte |
| Futur OAuth ou erreur de compte | Accès non souhaité, action sur mauvais compte, fuite de jeton | Permissions minimales, identité liée à l’origine, consentement à l’action, révocation, tests dédiés ; connecteurs non activés ici |

## Conditions supplémentaires avant OAuth

Les futures sessions peuvent ajouter identifiant du compte connecté, DID ou identifiant d’instance, scopes, jetons d’accès / renouvellement, clés de preuve, consentements et horodatages de relecture. Elles ne figurent pas comme une collecte actuelle qualifiée. Leur stockage, durée, chiffrement, rotation, effacement et contrat doivent être arrêtés avant activation ; aucun secret partagé ne doit être placé dans du JavaScript public.

Les codes/callbacks OAuth, tokens, clés, réponses authentifiées et opérations sociales doivent être exclus des exports ordinaires, journaux, captures et caches publics. Une déconnexion locale, une révocation demandée et une révocation fournisseur confirmée sont des états distincts. Une révocation ne défait pas un blocage existant. Ne pas considérer un statut importé comme une confirmation fournisseur fraîche. Les permissions, l’instance, l’identité et les éventuels effets publics doivent être affichés lors du consentement.

## État des preuves et gates

| Élément | Statut |
|---|---|
| Cartographie technique, brouillon de notice et procédure d’exploitation | **FAIT** dans ces fichiers ; concordance relue après intégration `app.js` ; toute nouvelle modification des flux appelle une révision |
| Drill de sauvegarde/restauration/effacement synthétique local | Voir [preuve datée](evidence/2026-10-28-operations.md) ; aucune restauration externe revendiquée |
| Vérification du déploiement, des journaux ou du contrat Vercel | **OUVERT** dans ce lot ; exiger les preuves fournisseur de la session globale |
| Responsable/contact/support, bases légales, article 9, décision AIPD | **OUVERT — bloquant PUBLIC** |
| Comptes OAuth officiels de test et recette consentement/révocation | **OUVERT — bloquant CONNECT** |
| Android/iOS physiques et audit WCAG 2.2 AA complet | **OUVERT** ; émulation et scans automatiques ne les remplacent pas |
| Autorisation de fusion / publication générale | **Non donnée par ce document** ; décision Go/No-Go séparée dans `OPERATIONS.md` |

## Sources primaires vérifiées le 2026-10-28

Les sources décrivent le droit ou les capacités fournisseur ; elles ne prouvent pas la configuration du projet. Pas de citation longue reproduite. Les pages EUR-Lex ont renvoyé une vérification JavaScript/robot lors de cette revue ; le texte des articles a été vérifié sur le site officiel CNIL.

- **[R1]** [CNIL — RGPD, texte et considérant 18](https://www.cnil.fr/fr/reglement-europeen-protection-donnees).
- **[R2]** [CNIL — RGPD, chapitre III, notamment articles 12–14 et 15–22](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3).
- **[R3]** [CNIL — RGPD, chapitre II, notamment articles 5–7 et 9](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2).
- **[R4]** [CNIL — RGPD, chapitre IV, notamment articles 25, 28 et 32–36](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).
- **[A1]** [CNIL — Ce qu’il faut savoir sur l’AIPD, critères, méthode et liens vers les listes](https://www.cnil.fr/fr/ce-quil-faut-savoir-sur-lanalyse-dimpact-relative-la-protection-des-donnees-aipd).
- **[A2]** [EDPB — Data protection impact assessment](https://www.edpb.europa.eu/topics/accountability-and-compliance-tools/data-protection-impact-assessment_en).
- **[A3]** [Commission européenne / G29 — index officiel des lignes directrices wp248rev.01](https://ec.europa.eu/newsroom/article29/items/611236). L’index a été ouvert ; le téléchargement du PDF a renvoyé un type de contenu non pris en charge. Les neuf critères ci-dessus ont été vérifiés via [A1], sans prétendre avoir relu ce PDF.
- **[H1]** [Vercel — Privacy Notice, informations de trafic d’utilisateurs finaux](https://vercel.com/legal/privacy-notice), version affichée du 1er juin 2026.
- **[H2]** [Vercel — Log Drains Reference, sources statiques et schéma de requête](https://vercel.com/docs/drains/reference/logs). La présence d’un drain sur le projet n’est pas présumée.
