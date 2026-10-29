# FIL CLAIR — suite d'exécution autorisée

État de travail du29octobre2026, Europe/Paris. Maintient les huit lots et A SAFE→B CONNECT→C PUBLIC. Le cockpit reste [Airtable](https://airtable.com/appXkTDooEjMD9lCs). Ce fichier est un ordre de dépendances, **pas une programmation d'exécution future**. La veille quotidienne existante est distincte ; aucune nouvelle automatisation de développement n'est créée ici.

| Priorité / lot | Prochain résultat concret | Dépendance réelle / intervention minimale |
|---|---|---|
|P0 ·01|Appliquer et relire le ruleset prêt `docs/main-ruleset.json`, puis exiger checks et revue|Session administrateur GitHub effective. Le connecteur actuel exclut administration ; aucun ruleset appliqué. Ne pas contourner les restrictions.|
|P0 ·02/03/07|Terminer les tests V3.2 et corrections, reçus/PR et qualification de cohérence|Développement/tests locaux autorisés ; appareils physiques et audit WCAG complet restent à fournir ensuite.|
|P0 ·08|Preview protégée au SHA testé, provenance/en-têtes/offline puis drill de retour|Plan, capacité réellement gratuite et accès Vercel non établis (facturation404, navigateur login). Aucun achat ou build présumé gratuit.|
|P1 ·04|OAuth officiel isolé, identité/scopes, transport borné et révocation|Mastodon requiert un client confidentiel selon docs officielles : serveur avec secrets isolés à qualifier. Bluesky SDK officiel à intégrer sans rejeu implicite d'écriture non consenti. Environnement et comptes de test autorisés manquants.|
|P1 ·05|Journal atomique durable des opérations fournisseur et reprise lecture seule|Stockage/session qualifiés, déduplication et quarantaine après résultat incertain. Aucun import ni reprise n'autorise une écriture sans nouveau consentement. Le témoin du carnet ne réalise pas ce journal.|
|P1 ·02/07|Recette Android/iPhone/iPad et desktop commercial, installation, lecteurs d'écran et WCAG2.2AA|Accès à de vrais appareils et évaluateurs ; réutiliser le protocole existant, ne pas compter l'émulation comme physique.|
|P1 ·06|Fiche responsable/contact, finalités/bases légales/article9, décision AIPD et hébergement|Décisions du responsable du traitement ; ne pas inventer de contact ni arrêter à sa place des éléments non connus.|
|P2 ·08|Supervision sans listes personnelles, support/incident, restauration et rollback exercés|Responsable exploitation/support et environnement de recette qualifiés ; aucun service payant.|
|P2 ·02/06/08|Activer l'unique lien Soutenir FIL CLAIR|URL officielle FIL CLAIR sur CONTRIB.OS, contenu opérationnel et preuve datée. Aucun domaine définitif ni moyen de paiement inventé.|

Conditions de sortie : CI réellement verte au head exact ; contrôles bloquants satisfaits ; recette physique/accessibilité et conformité ; décision de livraison traçable. Aucune fusion ni publication générale avant ces preuves. Les parties déjà validées à leur SHA ne sont pas reconstruites.
