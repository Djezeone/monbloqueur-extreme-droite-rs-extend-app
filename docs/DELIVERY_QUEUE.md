# FIL CLAIR — suite d'exécution autorisée

État de travail du30octobre2026, Europe/Paris. Maintient les huit lots et A SAFE→B CONNECT→C PUBLIC. Le cockpit reste [Airtable](https://airtable.com/appXkTDooEjMD9lCs). Ce fichier est un ordre de dépendances, **pas une programmation d'exécution future**. La veille quotidienne existante est distincte ; aucune nouvelle automatisation de développement n'est créée ici.

| Priorité / lot | Prochain résultat concret | Dépendance réelle / intervention minimale |
|---|---|---|
|P0 ·01|Appliquer et relire le ruleset prêt `docs/main-ruleset.json`, puis exiger checks et revue|Session administrateur GitHub effective. Le connecteur actuel exclut administration ; aucun ruleset appliqué. Ne pas contourner les restrictions.|
|P0 ·02/03/07|Conserver les preuves V3.2 et exercer les réserves physiques/accessibilité/versions mixtes|Qualification technique PR3 acquise à sonSHA ; appareils physiques et audit WCAG complet restent à fournir.|
|P0 ·08|Preview protégée au SHA testé, provenance/en-têtes/offline puis drill de retour|PlanPro identifié lors de la clôture PR5 ; capacité réellement gratuite et accès preview restent non établis (facturation404, navigateur login). Aucun achat ou build présumé gratuit.|
|P1 ·04|OAuth officiel isolé, identité/scopes, transport borné et révocation|Mastodon requiert un client confidentiel selon docs officielles : serveur avec secrets isolés à qualifier. Bluesky SDK officiel à intégrer sans rejeu implicite d'écriture non consenti. Environnement et comptes de test autorisés manquants.|
|P1 ·05|Qualifier l'activation du journal PR4 et son futur stockage serveur|Socle IndexedDB testé conservé ; session/stockage serveur, export/effacement et sortie de quarantaine restent ouverts. Aucun import ni reprise n'autorise une écriture sans nouveau consentement.|
|P1 ·02/07|Recette Android/iPhone/iPad et desktop commercial, installation, lecteurs d'écran et WCAG2.2AA|Accès à de vrais appareils et évaluateurs ; réutiliser le protocole existant, ne pas compter l'émulation comme physique.|
|P1 ·06|Fiche responsable/contact, finalités/bases légales/article9, décision AIPD et hébergement|Décisions du responsable du traitement ; ne pas inventer de contact ni arrêter à sa place des éléments non connus.|
|P2 ·08|Supervision sans listes personnelles, support/incident, restauration et rollback exercés|Responsable exploitation/support et environnement de recette qualifiés ; aucun service payant.|
|P2 ·02/06/08|Activer l'unique lien Soutenir FIL CLAIR|URL officielle FIL CLAIR sur CONTRIB.OS, contenu opérationnel et preuve datée. Aucun domaine définitif ni moyen de paiement inventé.|

Conditions de sortie : CI réellement verte au head exact ; contrôles bloquants satisfaits ; recette physique/accessibilité et conformité ; décision de livraison traçable. Aucune fusion ni publication générale avant ces preuves. Les parties déjà validées à leur SHA ne sont pas reconstruites.

## Reprise du29octobre — journal durable isolé
Le cycle V3.2 est clos techniquement dans PR#3 au839049a (deuxCI vertes), sans livraison A/B/C. Ses tâches validées ne sont pas reprises. Les P1lots04/05/07 avancent dans une branche dépendante distincte : [journal des opérations](DURABLE_OPERATIONS.md), CAS IndexedDB et récupération lecture seule sans rejouer une écriture incertaine. Ce socle reste inactif et ne remplace pas les réserves OAuth/serveur/révocation, ni les tests réels.

Ordre suivant : revue et qualification de ce socle → cycle de session et transport officiels sans rejeu → environnement/coût/comptes test autorisés → recette B. En parallèle, main/admin, preview/coût, physique/accessibilité et décisions RGPD restent ouverts. Le nouveau stockage devra avoir information/export/effacement et procédure de sortie de quarantaine avant activation. Aucune simple lecture conforme ne vaut autorisation de reprise.

## Reprise du30octobre — transport serveur
PR4 au42a70ca relue : deuxCI vertes, socle durable conservé. Nouvelle branche dépendante : [transport Mastodon serveur](SERVER_TRANSPORT.md), secret en fermeture Node, DNS/TLS et réponses bornés, un dispatch sans retry, TTL/déconnexion locale honnêtes. Pas de route, login OAuth, révocation fournisseur, déploiement ou appel réel.

Étape suivante après qualification de cette bibliothèque : client OAuth officiel serveur + stockage/session/journal durables et routes authentifiées/CSRF, puis environnement/coût et comptes de test autorisés. Le transport HTTPS local testé ne résout ni ces dépendances ni les réserves main/physique/RGPD/exploitation. Le frontend reste indépendant d'un serveur pour son socle local.

## Reprise du30octobre — priorité aux données du socle local
PR5 relue au0445454 : deuxCI vertes, aucune modification externe ultérieure constatée. Une revue bornée du socle A a trouvé trois défauts distincts des parcours déjà qualifiés : import en attente après remplacement, brouillon suivant vidé par une sauvegarde lente et déclaration orpheline réactivée à l'ajout. Correctifs et recette dédiée dans une branche dépendante ; [conception](superpowers/specs/2026-10-30-local-data-lifecycle-design.md), [plan/ledger](superpowers/plans/2026-10-30-local-data-lifecycle.md), [preuve datée](evidence/2026-10-30-local-data-lifecycle.md). Aucune migration ni activation sociale. La suite OAuth/serveur reste ouverte après ce correctif A prioritaire ; main/admin, preview/capacité gratuite, physique/WCAG et décisions RGPD ne sont pas présumés résolus.


## Clôture CI en cours —30octobre
Le correctif du serveur de test a permis une CI PWA complète verte au998e053. Reste à qualifier le correctif de synchronisation d'un test extension, sans nouvelle fonction ni modification de la PWA. Première CI annulée et échec extension sont conservés ; aucun rerun du même SHA. L'environnement local est indisponible, GitHub porte la suite du code et des preuves. Les portes physiques/admin/Vercel coût/RGPD/exploitation demeurent ; [journal](evidence/2026-10-30-extension-ci-sync.md).

## Reprise30octobre — agrégat et priorité Sécurité/CI
La qualification technique PR#6 est close au0af61de avec deux CI vertes ; l'ancienne « clôture CI en cours » est historique. Les six PR représentent40commits distincts, sans cherry-pick nécessaire. Branche agrégée integrate/fil-clair-v32-safe, PR vers main à qualifier au nouveau SHA ; originales conservées.

Candidat : tableau en --check, préparation manuelle sans publication/cache/artifact, actions figées/permissions lecture et verrou Vercel global. Prochaine porteP0 : administration GitHub effective/ruleset, CI exacte et revue ; aucune fusion par contournement. Preview si coût prouvé ; physique/WCAG, RGPD et exploitation ensuite selon critères propres A SAFE. B CONNECT reste inactif et nécessite encore OAuth, backend/session/journal/révocation durables. [Registre et décisions](evidence/2026-10-30-security-integration.md).

