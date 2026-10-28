# FIL CLAIR · Architecture et trajectoire produit · 2026-10-28

## Audit initial (preuves dans le dépôt main avant cette branche)

- Version extension 2.3.0 ; `extension/content.js` active des contrôles UI de blocage sur X.
- `extension/runner.js` exécute la file avec `NEXT_DELAY=250` millisecondes : ce n'est pas une mesure de conformité.
- Liste éditoriale `liste/accounts.json`, version 2026-10-27.5, 162 comptes. Plusieurs profils médiatiques/personnalités sont inclus ; aucune vérification indépendante des classifications.
- `extension/config.js` pointe vers **LaRosette/bloquer-extreme-droite-x**, un dépôt distinct, pas vers ce fork Djezeone. Attention à la gouvernance de cette source distante.
- Le README actuel confirme que X peut suspendre un compte pour l'automatisation de son interface.

## Principes non négociables

1. Toutes les listes sont éditables, facultatives et spécifiques à chaque utilisateur.
2. Aucune action sociale n'est déclenchée sans consentement ; la PWA actuelle n'en déclenche aucune.
3. Ne pas confondre « déclaré par l'utilisateur » et « confirmé par la plateforme ».
4. Aucune automatisation via scraping / scripts d'interface, sans contourner limitations, challenges ou CAPTCHAs.
5. Les personnes mentionnées dans des listes éditoriales ne sont pas par défaut qualifiées comme membres d'une idéologie particulière.
6. Pas de mot de passe de réseau social, jeton ni secret dans localStorage ou dépôt.
7. Export, effacement, transparence et tests d'accessibilité avant publication.

## Compatibilité

| Réseau | PWA : ouverture de profil et confirmation manuelle | API potentielle (phase future) |
| --- | --- | --- |
| X | Oui | Endpoint de blocage avec accès et conditions restreints ; automatisation d'interface exclue |
| Bluesky | Oui | AT Protocol : muteActor et enregistrement block (OAuth à intégrer) |
| Mastodon | Oui, instance renseignée | API accounts/:id/block et /mute avec scopes OAuth |
| Instagram, Threads, Facebook | Oui | Pas de blocage/mute générique confirmé par une API publique |
| TikTok, YouTube, Reddit, LinkedIn | Oui | Pas de connecteur universel de blocage validé |

**Sources** : https://help.x.com/en/rules-and-policies/x-automation ; https://bsky.network/docs/bluesky-api/following/ ; https://docs.joinmastodon.org/methods/accounts/ .

## Pourquoi ni TinyFish ni Metricool dans les actions de blocage

TinyFish contrôle des navigateurs et le clic automatisé sur X enfreindrait les règles explicites de X. Metricool est orienté publication/gestion/analytics et ne fournit pas ici de commande validée de blocage/mute de comptes tiers. Ces connecteurs pourront servir **en lecture seule** à des analyses d'intégration autorisées ou à la synchronisation de métadonnées utiles, sans piloter les blocages.

## Roadmap

- **P0 fait dans la branche** : PWA statique sans build, 10 réseaux, multi-listes, saisie par lien/pseudo, import de la liste historique X, recherche et filtres, suivi déclaratif, historique, étoiles, export et effacement, cache offline, tests unitaires.
- **P1** : tests end-to-end mobile + audits WCAG, onboarding simplifié avec tutoriel visuel, traductions.
- **P2** : OAuth officiel Bluesky / Mastodon, opérations unitaires explicites et contrôles de conformité + réconciliation réelle de l'état, avec option d'annuler.
- **P3** : comptes multi-appareils facultatifs, chiffrage par utilisateur, sync RGPD EU, journalisation et RGPD, gamification inclusive.
- **P4** : publication sous marque et conditions d'utilisation, politique de confidentialité, audits externes et tests avec utilisateurs peu technophiles.

Pas de déploiement production, aucune connexion aux comptes sociaux et aucun blocage effectif dans ce lot.
