# FIL CLAIR · PWA 0.1 (prototype utilisable)

Application web progressive **distincte** de l'extension X historique. Aucun compte externe n'est modifié par l'application : l'utilisateur ouvre la page officielle et fait lui-même l'action avant de la déclarer. Les états sont *déclarés, non vérifiés*. Aucun bot, mot de passe, cookie ou jeton privé. Pas de serveur.

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
- L'import public, uniquement sur clic, télécharge depuis GitHub sans identifiants. Les fichiers JSON sont plafonnés à 2 Mo et 5 000 comptes.
- La liste source n'est pas une preuve d'affiliation politique. Chaque utilisateur reste libre de supprimer n'importe quel compte.
- Les fonctions automatiques Bluesky/Mastodon nécessiteraient OAuth et traitement des secrets sécurisé côté serveur (non développé). TinyFish et Metricool ne sont pas utilisés pour contrôler les comptes.

## Vérification

```bash
node --test tests/pwa-core.test.js
```

Vérifier manuellement sur Chrome Android et Safari iOS après déploiement HTTPS. Les icônes PNG 192/512 sont présentes. Tester les parcours d’installation Android et iOS sur HTTPS avant publication.
