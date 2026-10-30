# FIL CLAIR · PWA V3 en recette

Application web progressive **distincte** de l'extension X historique. Carnet personnel de comptes/chaînes, médias/sources, sujets et recommandations, accompagné de guides officiels manuels. Fonctionne sans inscription, compte Google/Apple/social, Chrome, extension ou abonnement requis. Elle n’agit sur aucun compte externe. Les notes locales et déclarations sont séparées des confirmations API, dont cette version ne produit aucune. Les choix restent dans le navigateur ou, après consentement explicite, dans un espace mémoire temporaire. L’hébergement peut produire des traces techniques de visite. Lire la [notice](privacy.html), encore préparatoire avant publication.

## Démarrage local

Dans le dépôt (Node.js facultatif) :

```bash
python3 -m http.server 8080
```

Ouvrir http://localhost:8080/pwa/ (ne pas utiliser file://). Pour déployer sur Vercel, servir ce dossier comme racine statique (sans build) ; sur GitHub Pages, le chemin est `/monbloqueur-extreme-droite-rs-extend-app/pwa/` une fois Pages activé sur le dépôt.

## Parcours

1. Accueil → **Comptes / Sources / Sujets / Algorithmes** : carnet local directement accessible. **Choisir mes services** propose une sélection facultative, y compris aucun fournisseur ; Local / autres services toujours disponible.
2. Choisir les catégories puis enregistrer ses choix ; configuration modifiable sans suppression des fiches.
3. Mes flux → cible texte et contrôle : portée, mode, étapes et limites affichés. Lire l’aide officielle puis agir soi-même chez le fournisseur si souhaité.
4. Déclarer une manipulation seulement après l’avoir effectuée et confirmé sa portée. Retrait/remise à faire n’annulent aucune action distante.
5. Réglages → sauvegarde complète, restauration et effacement ; export en clair à protéger. Installation facultative et aide Safari/Android/desktop avec secours navigateur/favori.

Suivi avancé : échec déclaré, à vérifier, suivi annulé et retour de statut local ; 32 événements maximum par fiche sans copie de cible. Le registre public indique effets/sources/confiance/péremption et possibilités de retour fournisseur, séparés des déclarations. Le détail X fige le code par composant sans promettre une pénalité de compte. Aucun signalement proposé, aucun compteur d'étoiles.

[Guide débutant](../docs/USER_GUIDE.md) · [Architecture, modules et compatibilité](../docs/UNIVERSAL_FLOWS.md) · [Preuves V2](../docs/evidence/2026-10-28-universal-v2.md).

[Architecture V3](../docs/UNIVERSAL_CONTROL_V3.md) · [Matrice et registre générés](../docs/EFFECTS_REGISTER.md) · [Preuves V3](../docs/evidence/2026-10-29-universal-v3.md).

### Listes de profils existantes

1. Ouvrir « Mes listes » → saisir un @pseudo ou coller un lien (10 réseaux).
2. Ou charger volontairement les **162 comptes X du dépôt** (la sélection doit être vérifiée éditorialement).
3. Ouvrir le profil sur la plateforme officielle et y effectuer le contrôle documenté voulu ; ignorer dans FIL CLAIR reste local. Un blocage générique de vidéos YouTube n’est pas proposé.
4. Déclarer son action dans FIL CLAIR ; l'historique et les compteurs restent locaux, sans preuve fournisseur.
5. Changer de liste, renommer, retirer, importer/exporter les listes en JSON ; export complet et effacement local.

## Sécurité / limites

- Pas d'automatisation de blocages ni contournement de CAPTCHAs ou limitations.
- La PWA n'a aucun accès aux applications mobiles d'autres éditeurs ; elle ne peut pas contrôler leur état. **Le risque de suspension ne peut pas être garanti nul**, notamment si l'utilisateur emploie d'autres automations.
- `localStorage` n'est pas synchronisé et peut être effacé par le navigateur. Exportez régulièrement.
- L'import public, uniquement sur clic, télécharge depuis un commit GitHub figé sans identifiants. Les listes JSON sont plafonnées à 2 Mo et 5 000 comptes par liste. Révision et provenance restent des indications déclaratives, conservées lors des exports/restaurations.
- Sauvegarde complète : 10 Mo, 30 listes, 10 000 déclarations, 1 000 événements et 500 préférences de flux maximum (200 caractères par cible). Elle inclut Mes flux ; l’export de liste active l’exclut. Une donnée corrompue au démarrage suspend les modifications et reste exportable telle quelle dans Réglages. Restaurer une sauvegarde valide ou effacer explicitement permet la reprise. Faux statuts API et champs inconnus du carnet sont rejetés, sans écrasement.
- Les écritures utilisent Web Locks et vérifient que le stockage correspond à la version chargée. Si un autre onglet a modifié les données, la modification est refusée avec un message de conflit ; exportez votre vue si nécessaire, puis rechargez. Sans stockage ou Web Locks : lecture/export de ce qui est accessible, ou espace temporaire vide après avertissement/consentement. Ce dernier ne copie ni ne remplace le stockage et perd ses données au rechargement/à la fermeture ; exporter avant de partir. Après mise à jour, fermez/rechargez les anciens onglets avant de reprendre les modifications.
- Le champ `flows` optionnel conserve la lecture des anciens snapshots. V3 accepte les fiches V2 sans événements. V2 refuse les états/champs V3 : avant un downgrade, garder une sauvegarde V3 complète et la source brute ; ne jamais effacer pour forcer une ancienne version. Aucun aller-retour de downgrade n'est certifié.
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
node scripts/test-pwa-flows.mjs
node scripts/test-pwa-replacements.mjs
node scripts/test-pwa-v3.mjs
node scripts/update-effects-register.mjs --check
```

Les scripts navigateur utilisent Playwright et `PWA_BROWSER=chromium|firefox|webkit`. Les résultats automatisés, y compris les profils mobiles émulés, ne remplacent pas Android/iOS physiques, les lecteurs d'écran ni l'audit WCAG complet. Les icônes PNG 192/512 sont présentes. Tester l'installation en HTTPS avant publication. [Exploitation et portes de livraison](../docs/OPERATIONS.md).
