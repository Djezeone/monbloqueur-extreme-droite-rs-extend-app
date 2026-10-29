# FIL CLAIR V3 — contrôle et effets documentés

## Mandat et transition
Le mandat V3 est exécuté après la clôture technique V2 du 29 octobre 2026. PR #1 reste draft au SHA `51abcd35adefb757cc4f8831d23131a465b9f52a`, avec deux CI vertes (40748501660, 40748501447). Huit lots : 01/06/08 bloqués, les cinq autres en revue ; une porte sur huit validée, uniquement parcours automatisés. A/B/C ne sont pas livrées. Le cockpit contient la session `recSl5qjw0wmOQvyg` et les réserves : administration GitHub absente/main non protégée, appareils physiques/WCAG, OAuth réel/coordination durable, droit/hébergement/support et déploiement gratuit non qualifiés.

Cette transition satisfait l'ordre de terminer **ou documenter précisément les blocages**, sans reconstruire V2. Aucun déclenchement futur autonome n'est programmé : l'enchaînement se fait dans cette session. Les autorisations d'autonomie et l'absence de questions supplémentaires sont explicites dans le mandat.

## Choix d'architecture
Choix de réalisation : conserver les modules JavaScript natifs, l'unique snapshot local et les guides déjà testés. Ajouter une projection commune des actions et un registre public versionné, séparés des données personnelles. Une réécriture/framework ajouterait une migration et des dépendances sans lever les blocages ; un tableau documentaire seul ne répondrait pas à la demande d'intégration produit. Les nouveaux contrôles réutilisent les écritures atomiques sous Web Locks et le secours mémoire consenti.

## Produit livré par cette tranche
- Accueil avec la question « Que souhaitez-vous maîtriser dans votre fil ? » et quatre accès Comptes, Sources, Sujets, Algorithmes. Les catégories choisies restent principales ; les autres restent modifiables dans les réglages du carnet. Un accès direct peut ouvrir le carnet local sans obliger à choisir un fournisseur.
- Les 14 modules et 43 contrôles V2 restent la base. Le registre décrit action, portée, méthode, effets personnels documentés, limites algorithmiques, API/permissions non activées, retour arrière, sources, date, confiance et échéance de revue. « Documenté » ne signifie ni testé sur un compte ni effet algorithmique garanti.
- Le modèle commun est une projection des fiches existantes et du catalogue : service, nature, portée structurée, méthode, état, provenance de vérification, date, révocation. Aucune duplication modifiable d'une portée documentaire dans les données personnelles.
- Suivi local : à faire, déclaré, en échec déclaré, à vérifier, suivi annulé, note locale. Aucune confirmation fournisseur n'est importable ou créée. Les confirmations futures appartiennent au connecteur qualifié avec relecture indépendante ; cette tranche ne les active pas.
- Historique borné à 32 changements par fiche, sans recopier la cible ; retour à l'état précédent **dans FIL CLAIR**, jamais annulation distante. Les anciennes fiches sans historique restent acceptées et ne reçoivent pas de faux passé.
- Indicateurs utiles : choix enregistrés, actions déclarées, restantes, échecs/à vérifier/annulations et zéro confirmation API. Retrait du compteur d'étoiles qui récompense les blocages.
- Sources X figées au commit vérifié par la recherche : valeurs publiques, formule de probabilités et limites de la configuration/exécution. Aucun mécanisme de signalement ; mention explicite qu'un signalement n'établit ni infraction ni sanction.

## Données et sécurité
Le snapshot `fil-clair-v1` et le carnet `flows.version:1` sont conservés. Un champ optionnel `events:[{status,at}]` contient au plus 32 états ; le dernier doit correspondre au statut/date de la fiche. Les anciens objets restent identiques à la lecture, sans migration destructive. Les statuts `confirmed`/jetons/champs inconnus sont toujours refusés, y compris dans l'historique. Les données/filtres/brouillons sont effacés après remplacement réussi, préservés si annulé/échoué ; sauvegarde complète et plafond 10 Mo maintenus. Les anciennes versions qui ignorent ce nouveau champ ne doivent pas servir de restauration V3 sans export préalable.

Registre servi comme actifs statiques même origine, sans requête de télémétrie ou de fournisseur. DOM via textContent, liens officiels fixes sans cible ni recherche personnelle ; aucune nouvelle origine CSP. SW versionné avec liste exacte d'actifs publics. Synchronisation/OAuth/extensions restent facultatifs et inactifs.

## Recette et limites
Node : registre exhaustif/immuable, sources/revues/retours, modèle et historique borné/strict/immuable, import V2/V3 et fausse preuve refusée. E2E : quatre entrées, catégories modifiables, actions guidées et suivi/retour, registre sans données privées, clavier/320px/zoom, sauvegarde/restore et mémoire/hors ligne. Rejouer les sept scripts existants sur les trois moteurs après modifications affectant le shell commun. Axe est une preuve automatique partielle ; profils mobiles émulés distincts des appareils réels. Une revue indépendante clôt la branche. Aucune fusion/publication générale.

## Gouvernance
Branche V3 distincte `feat/fil-clair-v3-effects-registry`, PR draft dépendante de #1, commits groupés et une seule mise à jour distante. Dépôt public/runners standards uniquement après relecture du scénario gratuit ; aucune dépense, Copilot, crédit premium, plan ou abonnement. Pas de déploiement Vercel tant que gratuité effective non vérifiée. Les huit lots, critères bloquants et réserves juridiques V2 restent obligatoires.
