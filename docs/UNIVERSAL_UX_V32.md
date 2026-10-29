# FIL CLAIR V3.2 — UX universelle et CONTRIB.OS

Mandat du 29 octobre 2026, Europe/Paris, ajouté aux huit lots. Branche distincte depuis V3/PR#2. Le carnet, les quatre catégories, les imports, les déclarations et le registre ne sont pas reconstruits.

## Parcours principal
Accueil → **Gérer une source** → catégorie et nom (libre ou exemple CNEWS) → services facultatifs → actions documentées à cocher → récapitulatif → **Enregistrer et passer aux actions**. Chaque étape offre Retour, une fermeture sans écriture et une aide. L'enregistrement prépare des intentions dans Mes flux ; les aides officielles et déclarations ciblées existantes permettent ensuite d'agir une fiche après l'autre.

Le nom n'est pas une identité fournisseur vérifiée. Il ne regroupe aucun profil ni tiers associé automatiquement. Le catalogue ne prétend pas identifier toutes les présences de CNEWS ou d'une autre source. Avant une manipulation manuelle, la personne vérifie l'identité dans le service. Toute future table d'identités devra avoir des sources distinctes, dates et une vérification par plateforme avant proposition.

Pas de chatbot ni de connexion imposés. Les quatre accès historiques, le formulaire avancé et les choix de services/catégories restent disponibles. Le choix Local fonctionne seul. Les noms restent limités à200caractères sur une ligne,500fiches maximum. Un lot est construit/validé intégralement puis enregistré par l'unique verrou du snapshot. En cas d'erreur, aucune insertion partielle. Un doublon conserve exactement son état, ses dates et son historique.

## Portée et résultats
| Libellé | Ce qu'il prouve |
|---|---|
| À faire | Intention locale ; pas d'action fournisseur |
| Déclaré effectué | Attestation personnelle après confirmation ciblée |
| Confirmé par le fournisseur | Non produit par cette version ; future preuve API indépendante requise |
| À vérifier | Incertitude déclarée, à contrôler dans le service |
| Échec | Difficulté déclarée, pas une conclusion API |
| Non disponible | Aucun contrôle documenté pour la catégorie et le service sélectionnés ; aucune option fictive ajoutée |
| Note locale | Préférence dans le carnet, aucun filtrage d'application tierce |

Les contrôles gardent leurs portées différentes. Retirer/annuler une fiche ou revenir à son état précédent n'annule rien chez le fournisseur. Les confirmations/re-déclarations et l'historique32états restent ceux de V3. Aucun mécanisme de signalement n'est ajouté.

## Aide gratuite sur l'appareil
**Besoin d'aide ?** ouvre13questions locales choisies par boutons/accordéons, un choix d'appareil et une recherche facultative. Les questions couvrent blocage/sourdine, manipulation manuelle, états, retour, iPhone/iPad, Android, ordinateur, stockage, hors ligne, gestion d'une source et soutien externe. Le parcours possède des détails Portée et mode d'emploi par contrôle et une aide Comprendre les résultats. La fermeture rend le focus au bouton déclencheur et conserve le parcours. L'effacement/remplacement réussi d'espace supprime aussi les recherches et brouillons ; refus/annulation ne les remplacent pas.

Les liens d'aide sont les URLs fixes du catalogue existant. Ils mènent à la documentation/aux contrôles officiels selon ce que le fournisseur documente, pas à un paramètre inventé. Aucun nom, liste, historique ou recherche d'aide n'est inséré dans un lien. Aucun fournisseur IA, API IA, voix, analytics ou conversation externe n'est activé. L'étude d'une IA gratuite reste secondaire : sa gratuité/quotas/confidentialité devraient être qualifiés avant un nouveau mandat ; le module local suffit au socle.

## Une seule entrée CONTRIB.OS
Dans **À propos**, le seul bouton **Soutenir FIL CLAIR** est désactivé tant que la configuration publique revue `pwa/support-config.js` ne contient pas une URL officielle et sa date de validation. La destination reste actuellement `null` ; aucun domaine définitif n'est inventé. Aucun domaine `.example` des tests ne constitue une destination réelle.

Activation future par revue Git uniquement : vérifier page officielle FIL CLAIR, HTTPS canonique, domaine/chemin, accès public approprié et contenu réellement opérationnel ; définir l'unique URL sans identifiants, query, fragment, port non standard, IP ou hôte local. La date est documentaire, elle ne vérifie pas automatiquement le site. Aucune saisie d'URL de collecte dans les préférences utilisateur, clé financière, paiement, don, crypto, portefeuille, transaction ou tableau financier n'existe dans FIL CLAIR.

Quand elle sera validée, la destination s'ouvrira dans un onglet distinct avec `noopener noreferrer` et `referrerPolicy=no-referrer`. Aucun ping, préchargement, partage de session, cookie FIL CLAIR, message inter-applications, sauvegarde ni cible personnelle ne sera envoyé par l'application. Le navigateur/contact externe peut traiter ses propres métadonnées et cookies ; l'absence de collecte dans FIL CLAIR n'est pas une promesse de zéro traitement chez CONTRIB.OS. L'indisponibilité distante n'est pas sondée automatiquement : le texte propose de fermer l'onglet et continuer. Le carnet fonctionne sans CONTRIB.OS, y compris hors ligne.

## Compatibilité et sécurité
Modules natifs sans nouvelle dépendance ; même snapshot version1 et mêmes limites, aucun transport ni copie parallèle des données personnelles. Un témoin transactionnel contenant une seule empreinte complète Web Locks contre les lectures périmées ; son indisponibilité refuse les écritures et conserve lecture/export et espace temporaire consenti. Voir [protocole et limites](LOCAL_PERSISTENCE.md). Shell publicv7,22URLs exactes. Les styles et icônes natifs peuvent lire le précache public malgré leurs credentials include ; requêtes explicites authentifiées, callbacks, query, API et origines tierces restent exclues, aucune réponse réseau privée n'est mise en cache.

Les tests reproduisent un quota de stockage et la panne d'une destination de soutien **synthétique interceptée localement**. Ils ne manipulent ni véritable CONTRIB.OS ni comptes sociaux. Une recette physique iPhone/iPad/Safari/Android et desktop commercial, installation, VoiceOver/TalkBack, stockage privé/éviction réel et WCAG complet reste requise. Reflow320px et texte agrandi/espacé sont des preuves de scénarios précis, pas une certification universelle.

## Huit lots et suite
- 01 : sécurité sans nouveaux secrets/transport, main protégée et budget vérifié restent gates.
- 02 : nouveau parcours visuel, détails/aide et indépendance du financement ; physique/WCAG ouverts.
- 03 : lot atomique et conservation des doublons, sauvegarde commune et effacement des brouillons.
- 04–05 : API/orchestration restent inactives. Le serveur confidentiel Mastodon, la frontière sans rejeu implicite du SDK Bluesky et un journal atomique durable restent à construire/qualifier avant activation. Aucun travail documentaire ne les clôture.
- 06 : séparation CONTRIB.OS et minimisation ; responsable/contact, décision article9/AIPD et hébergement effectif toujours ouverts.
- 07 : unitaires/E2E/non-régression, panne, offline réel, accessibilité automatique et traces datées.
- 08 : unique configuration de soutien désactivée, Vercel/coût/rollback/support et décision de publication toujours ouverts.

Les livraisons **A SAFE → B CONNECT → C PUBLIC** ne sont pas prononcées par cette évolution. Voir le journal de preuves V3.2 et le cockpit pour les résultats effectifs.
