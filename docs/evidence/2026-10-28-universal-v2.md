# Session 28 octobre 2026 — FIL CLAIR V2, universalité et contrôle des flux

## Fait

- Reprise de la mission intégrale, PR #1 et HEAD 98550a8, deux CI antérieures vertes et huit lots/cockpit lus. Aucun travail ancien déclaré validé n’a été refait sans modification concernée : core, persistance, interface et shell V2 justifient la matrice de régression.
- Carnet sans inscription, trois étapes modifiables, quatre catégories. Quatorze modules (dont Local / autres services), 43 contrôles : 5 notes locales et 38 guides manuels. Aucune connexion, synchronisation ou action sociale activée ; adaptateurs API antérieurs toujours isolés et inactifs.
- Portée/mode/étapes/limites et source officielle explicites. Cibles jamais dans les URL ; aide uniquement sur geste utilisateur. Notes locales, à faire et déclarations séparées ; compteur API zéro. Aucun import ne crée une confirmation fournisseur.
- Sauvegardes complètes avec préférences et listes, validation stricte (500 fiches, 200 caractères), refus atomique des faux statuts/secrets/champs inconnus, conservation à la désélection. Repli mémoire neuf et consenti sans écriture persistante, source brute conservée séparément. Documentation fonctionnelle, technique, utilisateur, Safari, confidentialité et rollback mise à jour.
- Trois spécialistes ont recherché les sources officielles/limites et restauré l’environnement de test ; le volet confidentialité a relu ses trois documents. Revue indépendante du code effectuée : deux Important corrigés par régressions RED→GREEN, sans seconde revue ; voir le rapport dédié.

## Vérifié comment — résultats locaux

| Contrôle | Chromium156.0.8078.4 | Firefox157.0 | WebKit27.2 |
| --- | --- | --- | --- |
| E2E profils + shell/offline | PASS | PASS | PASS |
| Stockage refusé/quota | PASS | PASS | PASS |
| Corruption/récupération/sauvegarde près de 10 Mo | PASS | PASS | PASS |
| Concurrence des anciennes listes | 4/4 | 4/4 | 4/4 |
| Qualité, cinq vues, clavier/reflow/axe | 30/30 | 29/29 | 30/30 |
| Parcours V2, consentement, données et isolation | 17/17 | 16/16 | 18/18 |
| Remplacement d’espace, brouillons, consentement complet | 11/11 | 11/11 | 11/11 |

- Node : **133/133**, dont huit nouveaux tests de modèle/catalogue. Service worker : **8/8**, invariants sécurité PASS. `npm audit --audit-level=high` : 0 critique / 0 élevée / 0 modérée, 3 faibles héritées des dépendances dev, lockfile inchangé.
- Export/restauration : **9 769 347 octets UTF-8**, listes et **500 préférences multioctets** conservées ; pas d’export indenté dépassant la limite. Sauvegarde falsifiée refusée sans remplacement.
- V2 : zéro fournisseur obligatoire, préservation des listes préexistantes, confirmation de déclaration acceptée/refusée, retour à faire sans faux déblocage, cible affichée comme texte, sélection modifiable sans perte, source valide/corrompue intacte en espace mémoire, zéro setItem/removeItem/clear dans ce secours, export temporaire puis rechargement. Course préférence/profil : un seul gagnant, perdant refusé et brouillon conservé, oracle dans un troisième onglet frais.
- Hors ligne : SW actif/contrôlant et cache exact des 13 ressources publiques ; origine HTTP **arrêtée** plus `navigator.onLine=false`, rechargement, écriture locale et notice statique ; reprise de l’origine ensuite. Aucun fournisseur ni réponse privée ajouté au cache.
- axe ne relève aucune violation sur les états exécutés (57 scans, incomplets de contraste conservés). Les résultats `incomplete`, notamment contraste sur les dégradés, demeurent des contrôles humains ouverts : **aucune conformité WCAG complète n’est proclamée**.
- Pixel7, iPhone13 et iPadPro11 : **émulation seulement**, pas appareils physiques. Captures [desktop](v2/desktop-carnet.jpg) et [accueil iPhone émulé](v2/iphone-onboarding-emulated.jpg), réalisées avec Chromium ; ce ne sont pas des captures Safari physique. Versions/bibliothèques et contournements limités au conteneur dans le [protocole QA](../research/2026-10-28-universal-qa-protocol.md).

### Régressions observées et traitées

1. Huit tests de modèle échouent avant création du catalogue/fonctions puis suite 133/133 verte.
2. Premier E2E échoue sur l’absence du nouveau démarrage ; parcours ensuite réalisés sur trois moteurs.
3. Texte 200 % à 320 px : largeur 378 px ; titre/bouton et grille corrigés. Navigation « Historique » coupée sur deux lignes : navigation flexible et assertion permanente corrigées.
4. Après restauration, un ancien brouillon d’onboarding cachait le carnet restauré. Reproduction RED, remise à zéro explicite du brouillon lors des remplacements, assertion de visibilité GREEN.
5. Firefox : une revalidation `sw.js` était reçue malgré l’émulation hors ligne. Un garde de connectivité ne suffisait pas ; l’oracle est renforcé par arrêt réel de l’origine, sans exclure une URL de la comparaison. Les trois parcours finaux passent.
6. Oracles corrigés : enfants directs des fiches (les étapes sont aussi des `li`), fixture X conforme à 15 caractères et seed validée, attente de l’effacement asynchrone, agrandissement par CSSOM sans affaiblir la CSP.

7. Revue indépendante : six échecs sur 11 reproduisent brouillons/filtres sensibles conservés et confirmation de restauration incomplète ; après correction, 11/11 sur chaque moteur. Les annulations et refus de stockage restent non destructifs. [Rapport et limites](2026-10-28-universal-v2-review.md).

## GitHub, coûts et déploiements

- PR #1 reste brouillon, ouverte, non fusionnée ; `main` inchangée à b7cd31b et `protected:false`. Ruleset préparé antérieurement, non appliqué : connecteur sans administration ; navigateur cloud non connecté, page de réglages 404 avec lien Sign in. Aucune nouvelle demande de credentials après l’interruption précédente.
- Dépôt public et seuls runners standards `ubuntu-latest` pour ces validations ; gratuité vérifiée dans les [règles officielles GitHub](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job). Ni cache ni upload d’artefacts de validation. La nouvelle suite est ajoutée au job requis existant, sans troisième workflow. Une seule mise à jour de branche prévue après consolidation des commits.
- Aucun Copilot, agent GitHub, Codespace, requête premium, achat, recharge, changement de plan ou dépassement autorisé/invoqué. **Quota mensuel exact non identifié** : facturation non accessible par les accès disponibles. Aucune dépense supplémentaire GitHub engagée par ces opérations.
- L’[URL de référence](https://fil-clair-pwa-preview.vercel.app/) répond **HTTP200** via Vercel autorisé ; résolution vers `dpl_CzH7vb6CMiYPggYBPiv6FyGKKcj7`, SHA **7348dbe**, antérieur àV2. Le dernier déploiement de branche reste `dpl_DqF5XjNYpfneaiiHaaJPsdnXSyVW`, READY au SHA **ee515c17**. Aucun nouveau déploiement V2 n’est attesté. Aucun jeton/lien temporaire d’accès publié. Capacité gratuite Vercel non établie, donc aucun nouveau déploiement manuel demandé.
- Cet instantané est préparé avant la mise à jour distante groupée. Les résultats CI du head final et les SHA distants sont ensuite consignés dans le [bilan de PR #1](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/pull/1) et la session Airtable, après lecture effective des runs. Cela évite un second push purement documentaire et ses CI redondantes. Les CI vertes 98550a8 restent des preuves de la version précédente, jamais celles du nouveau head.

## Ouvert — huit lots conservés

| Lot | Statut exact | Réserve de sortie |
| --- | --- | --- |
| 01 Sécurité/CI | Bloqué pour sortie | main non protégée ; CI du head final consultable en PR, facturation/quota exact inconnus. |
| 02 UX/PWA | En revue | Carnet/onboarding éprouvés en automatisation ; OS/navigateurs commerciaux, installation, téléphones/tablettes et lecteurs d’écran physiques ouverts. |
| 03 Listes/historique | En revue | Préférences et données préservées dans les tests ; recette A globale ouverte. |
| 04 Connecteurs officiels | En revue du catalogue et socle inactif | Guides documentaires ; OAuth/transport/scopes/permissions/révocation/résultats fournisseur réels non qualifiés. |
| 05 Orchestration | En revue | États locaux/déclarés séparés ; coordination durable des opérations API toujours à construire avant activation. |
| 06 RGPD | Bloqué | Responsable/contact, bases légales/article9, décision AIPD et contrats/rétention/transferts hébergeur ouverts. |
| 07 QA | En revue | Matrice locale réussie ; appareils physiques, WCAG complet et qualification externe manquent. |
| 08 Publication/opérations | Bloqué / No-Go | Nouveau déploiement et rollback fournisseur non qualifiés, support/astreinte et Go public absents ; downgrade pouvant perdre les flux non certifié. |

**A SAFE, B CONNECT et C PUBLIC : non déclarées livrées. Aucune fusion ni publication générale.** La porte Parcours critiques porte sur l’automatisation ; sa vérification V2 et son lien de CI au head final sont consignés en PR et dans le cockpit après exécution. Les sept autres portes restent ouvertes. Une validation automatisée ne clôt pas la recette physique ; aucune neuvième porte ne remplace les huit existantes.

## Périmé

Les anciens bilans125 tests, cinq scripts/trois moteurs, qualité25/24/25 et premier parcours V2 14/13/15 restent historiques ; ils ne décrivent pas cette V2. Les premiers échecs environnementaux/fixtures/oracles ne sont pas comptés comme succès. Les propositions supplémentaires des recherches (fonctions en déploiement, API non qualifiées, Apple News/Siri) ne sont pas des fonctions activées. L’URL Vercel existante n’est pas une preview de ces changements.

## Pièces

[21 logs locaux et empreintes](v2/README.md) · [Revue indépendante et corrections](2026-10-28-universal-v2-review.md).


[Mission et recette V2](../WORK_MISSION_FIL_CLAIR.md) · [plan/ledger](../superpowers/plans/2026-10-28-universal-flows.md) · [contrat des modules](../UNIVERSAL_FLOWS.md) · [guide utilisateur](../USER_GUIDE.md) · [confidentialité](../PRIVACY_ASSESSMENT.md) · [exploitation](../OPERATIONS.md) · [cockpit](https://airtable.com/appXkTDooEjMD9lCs).
