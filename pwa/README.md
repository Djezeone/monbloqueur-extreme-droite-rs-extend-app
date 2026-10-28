# FIL CLAIR · PWA 0.1 (prototype utilisable)

Application web progressive **distincte** de l'extension X historique. L'interface ouvre les profils officiels et enregistre les déclarations de l'utilisateur ; elle n'agit sur aucun compte externe. Les états sont *déclarés, non vérifiés*. Le contenu des listes reste dans le navigateur ; l'hébergement peut produire des traces techniques de visite. Lire la [notice](privacy.html), encore en brouillon avant publication.

## Démarrage local

Dans le dépôt (Node.js facultatif) :

```bash
python3 -m http.server 8080
```

Ouvrir http://localhost:8080/pwa/ (ne pas utiliser file://). Pour déployer sur Vercel, servir ce dossier comme racine statique (sans build) ; sur GitHub Pages, le chemin est `/monbloqueur-extreme-droite-rs-extend-app/pwa/` une fois Pages activé sur le dépôt.

## Parcours

1. Ouvrir « Mes listes » → saisir un @pseudo ou coller un lien (10 réseaux).
2. Ou charger volontairement les **162 comptes X du dépôt** (la sélection doit être vérifiée éditorialement).
3. Ouvrir le profil sur la plateforme officielle et y bloquer, masquer ou ignorer manuellement.
4. Confirmer son action dans FIL CLAIR ; l'historique et les étoiles sont calculés localement.
5. Changer de liste, renommer, retirer, importer/exporter les listes en JSON ; export complet et effacement local.

## Sécurité / limites

- Pas d'automatisation de blocages ni contournement de CAPTCHAs ou limitations.
- La PWA n'a aucun accès aux applications mobiles d'autres éditeurs ; elle ne peut pas contrôler leur état. **Le risque de suspension ne peut pas être garanti nul**, notamment si l'utilisateur emploie d'autres automations.
- `localStorage` n'est pas synchronisé et peut être effacé par le navigateur. Exportez régulièrement.
- L'import public, uniquement sur clic, télécharge depuis un commit GitHub figé sans identifiants. Les listes JSON sont plafonnées à 2 Mo et 5 000 comptes par liste. Révision et provenance restent des indications déclaratives, conservées lors des exports/restaurations.
- Sauvegarde complète : 10 Mo, 30 listes, 10 000 déclarations et 1 000 événements maximum. Une donnée corrompue au démarrage suspend les modifications et reste exportable telle quelle dans Réglages. Restaurer une sauvegarde valide ou effacer explicitement permet la reprise.
- Les écritures utilisent Web Locks et vérifient que le stockage correspond à la version chargée. Si un autre onglet a modifié les données, la modification est refusée avec un message de conflit ; exportez votre vue si nécessaire, puis rechargez. Un navigateur sans Web Locks ou dont le stockage initial est inaccessible reste utilisable en lecture/export, sans écrasement depuis un état vide supposé. Après mise à jour, fermez/rechargez les anciens onglets avant de reprendre les modifications.
- Retirer un profil ou une liste purge les déclarations concernées, mais conserve l'historique. L'effacement global retire listes, déclarations et historique ; il n'efface pas les JSON déjà téléchargés ni les actions effectuées sur les réseaux.
- La liste source n'est pas une preuve d'affiliation politique. Chaque utilisateur reste libre de supprimer n'importe quel compte.
- Les adaptateurs Bluesky/Mastodon sont isolés et inactifs : [qualification et limites](../docs/OFFICIAL_CONNECTORS.md). OAuth, consentement et comptes de test fournisseur restent à qualifier avant B CONNECT. Bluesky propose un SDK navigateur officiel ; Mastodon demande un choix d'architecture protégeant les identifiants du client. Aucun secret OAuth n'est livré avec la PWA. TinyFish et Metricool ne contrôlent aucun compte.

## Vérification

```bash
node --test tests/pwa-core.test.js
node scripts/audit-pwa.mjs
node scripts/test-pwa.mjs
node scripts/test-pwa-storage.mjs
node scripts/test-pwa-recovery.mjs
node scripts/test-pwa-concurrency.mjs
node scripts/test-pwa-quality.mjs
```

Les scripts navigateur utilisent Playwright et `PWA_BROWSER=chromium|firefox|webkit`. Les résultats automatisés, y compris les profils mobiles émulés, ne remplacent pas Android/iOS physiques, les lecteurs d'écran ni l'audit WCAG complet. Les icônes PNG 192/512 sont présentes. Tester l'installation en HTTPS avant publication. [Exploitation et portes de livraison](../docs/OPERATIONS.md).
