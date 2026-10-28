# FIL CLAIR V2 — universalité et contrôle personnel des flux

## Demande et décision d’exécution

La mission V2 complète les huit lots et A SAFE → B CONNECT → C PUBLIC. Le propriétaire demande une exécution autonome, sans nouvelle validation de conception pour les actions autorisées et réversibles. Les décisions ci-dessous sont celles du développeur, dans cette délégation ; elles ne constituent pas une recette approuvée.

## Intention

Permettre à un débutant d’organiser ses comptes, sources, sujets et préférences de recommandation, sans compte FIL CLAIR, Google, Apple, extension ou abonnement. Safari est prioritaire au même titre que les moteurs Chromium et Firefox. Aucun module n’est requis pour utiliser le carnet local.

## Approches examinées

1. Conserver la PWA statique et ajouter un catalogue de contrôles officiels avec carnet local : réutilise les garanties de stockage/export, fonctionne sans inscription, mais ne modifie pas les recommandations des autres applications.
2. Applications natives et OAuth pour chaque fournisseur : meilleure intégration système possible mais comptes développeur, coûts, maintenance et consentements non qualifiés ; ne satisfait pas le budget et la livraison sûre immédiate.
Décision du développeur : approche 1, extensible vers les adaptateurs officiels déjà isolés. Ils restent inactifs. Aucun résultat d’API n’est inventé.

## Contrat fonctionnel

- Démarrage en trois étapes modifiables : services facultatifs, quatre catégories, puis actions et suivi. Un mode « Local / autres services » est toujours disponible, y compris avec zéro service sélectionné.
- Catalogue public embarqué : Discover, Recherche Google, YouTube, X, Facebook, Instagram, Threads, TikTok, Bluesky, Mastodon, Reddit, LinkedIn, Safari. Chaque contrôle décrit sa portée, son mode et une source officielle vérifiée. Safari est un ensemble de réglages de navigateur, pas un Discover Apple.
- Le carnet local exprime une intention sans filtrer d’autres applications. Un guide décrit une manipulation manuelle chez le fournisseur ; ouvrir l’aide n’exécute ni ne confirme rien. Une déclaration exige une confirmation explicite. « Confirmé par API » est impossible dans ce carnet et dans ses sauvegardes.
- Les états `planned`, `declared`, `local` sont séparés des adaptateurs. Bloquer, masquer, ne plus suivre, feedback de recommandation et retrait d’une exclusion ont des portées distinctes. Réinitialiser une déclaration ou retirer une fiche ne réautorise rien sur un réseau.
- La sélection de services/catégories ne supprime pas les fiches existantes. Une préférence peut être retirée ; ses données ne restent pas dans un journal parallèle.

## Données et sécurité

Extension optionnelle `flows` du snapshot existant `fil-clair-v1`, version interne 1 : `setupComplete`, `platforms`, `categories`, `items`. Une fiche contient uniquement identifiant, service, contrôle, cible texte, statut et dates. Maximum 500 fiches, cible 200 caractères, champs inconnus/secrets/confirmation fournisseur refusés. Sauvegardes historiques lisibles sans perte ; nouvelle sauvegarde complète nécessaire avant retour à une ancienne version d’application.

Un seul verrou/persist assure l’atomicité des anciennes listes et nouvelles préférences. Les exports incluent les deux ; effacement global les retire. Les cibles ne sont jamais placées dans les URL, requêtes, journaux distants ou Cache Storage. Catalogue et guides sont du code statique ; aucun HTML utilisateur, iframe, SDK distant, authentification ou synchronisation.

Si le stockage ou Web Locks manque, lecture/export restent possibles. Un bouton explicite peut démarrer un espace neuf **en mémoire**, après avertissement et consentement ; il ne remplace jamais les données persistantes. Une bannière permanente exige un export avant fermeture. Ce repli ne promet aucune persistance en navigation privée.

## Compatibilité et secours

Pas de détection du système servant de preuve. Aide installation par système, accès navigateur et favoris si installation absente, fichier de sauvegarde à transférer entre contextes. Le hors ligne exige un premier chargement complet du shell. Les liens externes exigent Internet et peuvent ouvrir une application selon le système. Pas de promesse d’installation/VoiceOver/appareil physique sans preuve correspondante.

## Livrables et portes ouvertes

Code et tests traçables sur PR #1, matrice officielle des capacités, guide débutant, protocole navigateurs/appareils, notice mise à jour, mission/recette/Airtable/journal. Tests Node, trois moteurs E2E, émulation iPhone/iPad/Android, accessibilité automatisée/reflow, hors ligne, récupération et absence de trafic social. Les appareils physiques, VoiceOver/TalkBack, WCAG complet, identité juridique, OAuth, protection main, nouveau déploiement gratuit et rollback fournisseur demeurent des portes distinctes.

Aucun merge main, publication générale, opération sociale réelle, dépense ou crédit GitHub. Grouper les commits avant une seule mise à jour de branche ; runners publics standards uniquement après vérification.
