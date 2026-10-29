# Mission Work — FIL CLAIR · autonomie maximale

## Références immuables
- GitHub : https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app
- PR existante : https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/pull/1
- PWA isolée : https://fil-clair-pwa-preview.vercel.app/
- Airtable cockpit : https://airtable.com/appXkTDooEjMD9lCs
- Date de gouvernance : 2026-10-28

## Mission
Poursuivre en autonomie l'industrialisation FIL CLAIR en 8 lots : (1) sécurité/CI, (2) UX/PWA, (3) listes, (4) API officielles, (5) orchestration, (6) RGPD, (7) QA, (8) publication. Livraisons successives A SAFE, B CONNECT, C PUBLIC.

## Règles absolues
1. **Preuves avant statut** : ne jamais écrire PASS sans lien vers commit, sortie de test ou déploiement réellement vérifié. Tenir à jour le cockpit Airtable.
2. Intervenir sur branches de fonctionnalité + PR revues ; jamais pousser directement sur main, ni fusionner une PR dont CI ou QA est inconnue.
3. Ne pas provoquer de blocages réels sur des comptes sociaux, ni manipuler des comptes utilisateurs, ni utiliser TinyFish pour contourner l'interface ou les règles d'un réseau. Les futures API exigent OAuth officiel, consentement, comptes de test, conformité et possibilité de révoquer.
4. Status `déclaré` ≠ status `confirmé par fournisseur`. Aucun faux succès ni promesse d'absence de bannissement.
5. Aucun achat, publication grand public, envoi extérieur, exposition de clé/secrets ni modification irréversible d'une ressource existante sans autorisation spécifique.
6. Local-first et protection des opinions/identifiants, collecte minimale, export, effacement et contrôle RGPD ; évaluer AIPD.
7. Workstreams de sous-agents possibles : architecture/sécurité, API officielles, UI/accessibilité, qualité, RGPD. Ne pas masquer leurs limites de vérification.
8. Vérifier et journaliser les états réels avant chaque changement ; reprendre seulement les tâches restantes et **ne pas répéter les travaux déjà validés**.

## Critères de sortie obligatoires
- CI GitHub exécutée et verte ; absence de vulnérabilité critique/élevée non traitée.
- Tests unitaires + E2E + appareils physiques Android/iOS, WCAG 2.2 AA.
- Import/export/restore/effacement éprouvés, absence de perte silencieuse de données.
- Connecteurs officiels uniquement, états API vérifiables quand les plateformes le permettent.
- Journal d'exploitation, incidents, restauration, rollback et décision Go/No-Go documentés.

## Actions immédiates, sans sollicitation
1. Vérifier PR #1 et ses commits, workflows, status GitHub, paramètres Actions et protections (en lecture).
2. Corriger les défauts mesurables du socle PWA dans une branche dédiée avec tests.
3. Lancer/évaluer la CI, documenter sans inventer.
4. Vérifier le prototype sur navigateur, mobile et hors ligne autant que les outils le permettent.
5. Compléter Airtable avec statut, risques et liens preuves.
6. Préparer l'intégration Bluesky/Mastodon par revue des API et protocole de test, sans exécuter d'opération réelle.
7. Journaliser au format AAAA-MM-JJ : fait/ouvrir/vérification/périmé.

## Format du bilan
- Commit/PR et URL Vercel **réellement vérifiés**
- Tests avec résultats exacts, sans extrapoler
- Statuts huit lots + huit critères de recette
- Risques/réserves explicitement bloquants
- Décision sur la fusion et publication (par défaut non)

## Complément prioritaire V2 — universalité et contrôle des flux (28 octobre 2026)

Ce complément **s’ajoute** aux huit lots et aux livraisons A SAFE → B CONNECT → C PUBLIC ; aucune porte existante n’est supprimée ou présumée acquise.

FIL CLAIR vise un centre de contrôle personnel utilisable sur Android (Chrome, Samsung Internet, Firefox et navigateurs compatibles), iPhone/iPad (Safari et navigateurs compatibles), macOS (Safari, Chrome, Firefox), Windows (Chrome, Edge, Firefox) et Linux (navigateurs modernes). Safari est prioritaire. Une preuve de moteur Playwright ou de profil mobile émulé ne vaut pas une recette du navigateur commercial, de son OS ou d’un appareil physique.

Fonctions essentielles : carnet local sans inscription, compte Google/Apple/social, Chrome, extension ou abonnement requis. Installation PWA facultative lorsque proposée et réellement qualifiée ; repli navigateur/favori et, si stockage ou Web Locks manque, espace temporaire **consenti**, exportable et clairement sans persistance. Aucune détection intrusive de navigation privée ni promesse de récupération après effacement.

Quatre catégories : **comptes et chaînes**, **médias et sources**, **sujets et centres d’intérêt**, **préférences algorithmiques**. Distinguer blocage, sourdine, désabonnement, désintérêt, exclusion de recommandation, note locale, déclaration manuelle et preuve API. Supprimer une fiche ou réinitialiser une déclaration ne modifie aucun fournisseur.

Modules documentés : Google Discover et Recherche, YouTube, X, Facebook, Instagram, Threads, TikTok, Bluesky, Mastodon, Reddit, LinkedIn, Safari ; carnet générique toujours disponible. Discover reste entièrement facultatif. Safari ne doit pas être présenté comme un flux Discover ; Apple News et Siri sont des produits distincts. API officielle uniquement si accès/contrat/scopes et recette sont établis, sinon guide manuel à portée explicite. Aucune interface sociale automatisée clandestinement.

Onboarding modifiable : (1) services facultatifs avec noms, descriptions et cases, (2) catégories et intérêts, (3) actions, portée/mode et suivi des résultats. Aucun consentement indispensable n’est supprimé. Local-first ; aucune synchronisation activée. Préférences potentiellement sensibles, minimisation, export complet, suppression et future révocation OAuth explicite.

| Lot conservé | Critère V2 ajouté à sa recette |
| --- | --- |
| 01 Sécurité/CI | Modules sans secrets, trafic/cibles sensibles absents, sauvegardes falsifiées refusées, CI gratuite standard et main protégée. |
| 02 UX/PWA | Trois étapes simples, cinq vues, parité du carnet sans Google, Safari iPhone/iPad, clavier/tactile/zoom, installation et secours honnêtes. |
| 03 Listes/historique | Préférences des quatre catégories conservées avec listes, export/restauration/effacement communs, aucune perte à la désélection ou entre onglets. |
| 04 Connecteurs officiels | Catalogue modulaire à sources officielles, guide vs API non confondus, permissions/finalité/révocation à qualifier avant activation. |
| 05 Orchestration | À faire/déclaré/local distincts ; aucune progression ou restauration ne crée une confirmation fournisseur ; mémoire et persistance séparées. |
| 06 RGPD | Cartographie des sources/sujets sensibles, fichiers lisibles et liens externes ; synchronisation consentie seulement si développée ; bases légales/article 9/AIPD non éludés. |
| 07 QA | Trois moteurs, émulations Android/iPhone/iPad identifiées, sauvegarde/restauration/hors ligne/sécurité/portées, matrice physique par OS/navigateur, WCAG 2.2 AA. |
| 08 Publication/opérations | Guide utilisateur universel, supervision et récupération/rollback préservant les flux V2 ; aucune publication générale sans recette complète. |

### Budget et gouvernance reconduits
**Aucune dépense supplémentaire autorisée.** Le quota GitHub mensuel exact doit être identifié en lecture seule si les droits le permettent ; tant qu’inconnu, aucune ressource payante, crédit Copilot/premium/agent, recharge ou abonnement. Privilégier Work, spécialistes et tests locaux ; regrouper les commits et éviter les CI redondantes. Actions n’est autorisé qu’après preuve de gratuité du scénario exact. GitHub reste source de vérité. Aucun usage essentiel ne dépend de Copilot.

Références de réalisation : [conception](superpowers/specs/2026-10-28-universal-flows-design.md), [plan/ledger](superpowers/plans/2026-10-28-universal-flows.md), [contrat fonctionnel et technique](UNIVERSAL_FLOWS.md), [guide débutant](USER_GUIDE.md), [protocole de recette universelle/Safari](research/2026-10-28-universal-qa-protocol.md). Les statuts acquis et les limites figurent dans le journal de preuves V2 ; le présent document ne certifie aucune livraison.

## Mandat V3 — contrôle universel et effets vérifiés (29 octobre 2026)

L'ordre différé complète V2 et les huit lots. La clôture technique V2 est consignée dans PR#1 au SHA51abcd3 et Airtable (session recSl5qjw0wmOQvyg) : deux CI vertes et réserves précises. La V3 est donc engagée dans cette même session ; **aucune automatisation future n'est programmée**. Les travaux V2 validés ne sont pas reconstruits. Branche V3 et PR distinctes dépendantes de #1 ; aucune fusion/publication générale.

Accueil : **« Que souhaitez-vous maîtriser dans votre fil ? »**, quatre accès **Comptes — Sources — Sujets — Algorithmes**, catégories/services librement modifiables. Filtres thématiques facultatifs et réversibles selon les possibilités réelles ; le produit reste utilisable indépendamment des opinions. Modes local/guidé réellement livrés, connecteurs/extensions facultatifs uniquement après qualification.

Modèle commun : service, action exacte, portée, méthode, état, provenance de vérification, date et possibilité de retrait. Une déclaration n'est jamais une confirmation fournisseur ; aucun import/restauration/historique ne crée une telle preuve. Échecs déclarés, vérification, suivi annulé, historique borné et retour local sont distincts des actions inverses dans le compte distant.

Registre technique maintenable : contrôles documentés par plateforme, API/permissions autorisées ou non qualifiées, effets personnels documentés, hypothèses/limites algorithmiques, risques, sources officielles, dates/confiance et péremption. Sources X vérifiées au commit5ed796374ea48ee26058aab66ab10c266bea2bef : paramètres par composant et somme de prédictions, pas des points par action réelle ni une pénalité globale. Code publié ≠ configuration effective/déploiement/effet mesuré. Aucun outil de signalement massif, automatique ou coordonné ; signalement réservé à une possible infraction, transmission ≠ infraction/sanction.

Indicateurs : entrées gérées, préférences enregistrées, déclarations/confirmations séparées, actions restantes, échecs/reprises/annulations, intégrité sauvegardes, compatibilité, accessibilité et consentements. Aucun nombre de comptes prétendument pénalisés ni récompense aux blocages.

| Lot conservé | Critère V3 ajouté sans retirer les précédents |
| --- | --- |
| 01 Sécurité/CI | Historique importé strict, aucune fausse preuve/secrets, registre public sans cible, branche protégée et scénario CI gratuit vérifiés. |
| 02 UX/PWA | Quatre entrées simples et accessibles, services choisis principaux, détails avancés secondaires, parité sans Google/Safari, historique et retour local explicites. |
| 03 Listes/historique | Anciennes sauvegardes acceptées, nouveaux événements bornés/restaurables, désélection sans perte, absence de faux passé. |
| 04 API officielles | Matrice réelle/par opération, sources/scopes/permissions/révocation et niveaux de confiance, aucun contrôle fictif activé par documentation. |
| 05 Orchestration | États à faire/déclaré/échec/revue/annulé distincts, confirmation uniquement après preuve fournisseur qualifiée, aucune répétition massive. |
| 06 RGPD | Minimisation des historiques sensibles, sources documentaires séparées des données, synchronisation facultative/consentie ; portes juridiques maintenues. |
| 07 QA | Tests du modèle/registre/UX, non-régression trois moteurs, offline/backup/sécurité, émulation distincte du physique et WCAG complet toujours requis. |
| 08 Publication/opérations | Registre maintenable/date et guide V3, procédure de downgrade sans perte/source brute, supervision/rollback et Go public avec preuves. |

Budget : alerte officielle identifiée (3 000 minutes Actions incluses épuisées le16/10, remise à zéro annoncée01/11 ; compteur live non accessible). Gratuité des runners standards publics revérifiée ; zéro achat/dépense/Copilot/crédit supplémentaire. Voir [gouvernance](GITHUB_GOVERNANCE.md).

Références V3 : [architecture](UNIVERSAL_CONTROL_V3.md), [matrice/registre](EFFECTS_REGISTER.md), [recherche X](research/2026-10-29-x-algorithm.md), [conception](superpowers/specs/2026-10-29-universal-v3-design.md), [plan](superpowers/plans/2026-10-29-universal-v3.md), [journal](evidence/2026-10-29-universal-v3.md). Les résultats et blocages de livraison sont ceux des preuves, jamais présumés par ce mandat.
