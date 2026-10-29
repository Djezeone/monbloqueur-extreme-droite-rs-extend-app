# FIL CLAIR V3.2 — parcours guidé et aide locale

Mandat explicite du propriétaire du 29 octobre 2026, Europe/Paris. Il autorise architecture, code réversible, tests, branches/PR et cockpit sans validation intermédiaire. Base : V3 b3b0660 / PR #2 ; aucune fusion, dépense, activation sociale ou collecte financière.

## Transition et choix
La passe précédente était une vérification, sans opération de code ou mutation externe en cours. Elle est close : baseline144/144 ; PR#2 inchangée/draft ; main protected:false/rulesets=[] ; trois anciens déploiements Vercel, facturation404 Plan not found et navigateur redirigé vers login. Aucun accès administratif ou solde gratuit n'est obtenu. Les recherches révèlent deux risques à traiter avant B : client Mastodon confidentiel (pas de secret frontend) et refresh/rejeu POST implicite possible dans le SDK Bluesky ; journal d'incertitude durable absent. Aucun de ces travaux n'est déclaré implémenté ou qualifié.

Approches examinées : remplacer le carnet (risque de régression), ajouter un assistant IA (coût/flux sensibles), réutiliser le catalogue et le snapshot pour un parcours visuel supplémentaire. Choix de l'exécuteur : troisième approche, demandée par le mandat ; le formulaire avancé et les quatre accès restent disponibles.

## Comportement
- Bouton « Gérer une source » à l'accueil, parcours facultatif de quatre étapes : nom/catégorie ; services ; contrôles documentés ; récapitulatif puis enregistrement atomique des intentions locales. Retour conserve le brouillon, annuler n'écrit rien. CNEWS est un exemple de nom choisi, sans identités associées ni qualification politique.
- Chaque contrôle garde sa portée/mode/limites et ses liens fixes ; aucun nom personnel dans les URLs. Aucun contrôle absent n'est inventé. « Non disponible » décrit l'absence de contrôle documenté dans la catégorie choisie. Aucune preuve API ni blocage n'est produit.
- Réutiliser flows.version1 et les helpers validés : ajouter un lot est tout ou rien, maximum500, doublons explicités et conservés avec leur statut/historique. Choix existants et historiques préservés.
- FAQ locale par boutons/QCM/recherche facultative, aide iOS/Android/desktop, glossaire et dépannage. Aucun fournisseur IA, voix imposée, réseau, stockage parallèle ou donnée privée injectée dans les liens. Fermeture rend le focus au déclencheur ; remplacement d'espace efface les brouillons.
- Une seule entrée « Soutenir FIL CLAIR », secondaire dans À propos. Configuration publique revue : URL HTTPS canonique sans credentials/query/fragment/port/IP et date de validation. Sans URL officielle validée : bouton désactivé, aucun href/appel. Aucune destination inventée, aucune vérification réseau automatique. Une panne externe ne bloque pas le carnet ; possibilité de fermer l'onglet externe et continuer, pas de promesse de détection distante.
- Environnements et sessions CONTRIB.OS séparés ; aucune finance, paiement, transaction, clé, pixel ou SDK associé dans FIL CLAIR.

## Recette et limites
Unitaires sur lot/validation/doublons/limites/configuration/FAQ ; E2E trois moteurs sur navigation, aide, stockage, refus, absence de fuite, offline, soutien inactif et destination synthétique de test. Suite existante de non-régression au code final si environnement disponible. Ne pas requalifier l'émulation comme appareils physiques, Safari commercial ou WCAG complet.

Le mandat V3.2 ne lève aucun gate A/B/C. Main/admin, OAuth/compte test/journal durable, juridique, physique/accessibilité et coût/déploiement restent ouverts. Le chantier CONTRIB.OS lui-même est exclu.
