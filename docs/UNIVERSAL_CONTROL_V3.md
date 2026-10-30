# FIL CLAIR V3 — architecture fonctionnelle et technique

## Résultat et dépendances
La V3 étend le carnet V2, sans l'authentifier à un fournisseur. Elle vise un contrôle personnel universel, librement choisi et réversible dans les limites documentées. Le mode local fonctionne sans compte Google, Apple, Microsoft ou réseau, abonnement, extension ou navigateur imposé. Les filtres et listes thématiques sont facultatifs ; l'import de la liste éditoriale historique ne prouve aucune opinion ni infraction d'un compte.

La branche V3 part de `51abcd35adefb757cc4f8831d23131a465b9f52a` (PR #1). La clôture technique V2 et ses blocages précèdent cette tranche ; A SAFE/B CONNECT/C PUBLIC restent non livrées. La nouvelle PR est un brouillon dépendant de #1, pas un remplacement ni une fusion implicite. Le [plan](superpowers/plans/2026-10-29-universal-v3.md) et le [journal](evidence/2026-10-29-universal-v3.md) distinguent développement, test, revue, CI et déploiement.

## Parcours UX intégré
L'accueil demande « Que souhaitez-vous maîtriser dans votre fil ? ». Quatre boutons ouvrent Comptes, Sources, Sujets et Algorithmes dans le carnet local, sans imposer d'onboarding fournisseur. **Choisir mes services** conserve le parcours modifiable en trois étapes de V2. Les catégories non choisies quittent l'accueil ; leurs fiches restent conservées, recherchables et modifiables dans Mes flux. Les autres fournisseurs sont secondaires dans les réglages et « Tous les modules · avancé » du registre.

Une fiche affiche cible, service, catégorie, nature, portée exacte et source du statut. Déclarer exige le consentement contextuel déjà en place ; l'aide n'exécute rien. Le suivi avancé propose échec déclaré, à vérifier, annulation du suivi et état précédent **dans FIL CLAIR**. Historique limité et possibilités de retour fournisseur sont explicitement distincts. Aucun signalement n'est proposé.

Les compteurs indiquent entrées enregistrées, déclarations rattachées aux profils/fiches courants et actions restantes. Les décisions importées orphelines restent dans le snapshot sans gonfler ces compteurs. Dans le carnet, les notes locales, échecs, reprises et suivis annulés sont séparés. Le compteur de confirmations API reste zéro. Une fiche et un profil de liste sont deux entrées distinctes ; aucune déduction de personnes uniques ou de pénalité globale, aucun compteur d'étoiles.

## Modules et séparation des responsabilités

| Module | Responsabilité / contrat |
| --- | --- |
| `platforms.js` | Les 14 services/43 contrôles documentés V2, identifiants stables et guides manuels. |
| `flow-core.js` | Snapshot personnel strict, transitions locales/événements bornés et retour de statut immuable. |
| `actions.js` | Projection commune `actionRecord(item)` et métriques, sans transport ni preuve fournisseur créée. |
| `effects.js` | Registre public immuable, effets/restrictions/permissions/révocation/sources/confiance, échéances ; code X au SHA figé. |
| `register-view.js` | Rendu documentaire accessible et indépendant des cibles, sources fixes, détails techniques secondaires. |
| `flows.js` | Onboarding/carnet/quatre entrées et suivi, toutes écritures via `app.persist`. |
| `app.js` / `core.js` | Stockage commun atomique, sauvegarde/récupération/effacement/listes, Web Locks et secours mémoire consenti. |
| `sw.js` | Cache v5 : 16 URL publiques exactes ; aucune réponse OAuth/API, query, identité ou donnée personnelle. |
| `pwa/connectors` | Socle fournisseur isolé/inactif ; aucun import réseau ni secret dans le chemin applicatif. Voir la qualification B CONNECT. |

La [matrice et le registre](EFFECTS_REGISTER.md) sont générés depuis les données exécutées. Modifier le registre impose `node scripts/update-effects-register.mjs`, puis `--check`. Les sources/date/confiance ne se rafraîchissent jamais au seul lancement ou build. Une échéance dépassée produit un avertissement documentaire ; une option absente chez le fournisseur ne devient pas disponible grâce au registre.

## Modèle d'action commun

`actionRecord(item)` projette une fiche validée, sans dupliquer le catalogue dans le snapshot :

| Champ | Signification |
| --- | --- |
| `service`, `nature`, `category` | Identifiants stables du fournisseur, contrôle exact et catégorie. |
| `scope.kind`, `scope.description` | Local, appareil ou compte et portée humaine détaillée, sans confondre permission API. |
| `method` | `local` ou `guided` réellement livré. Aucun mode API/extension actif. |
| `state` | `local`, `planned`, `declared`, `failed`, `review`, `cancelled`. |
| `verification` | Nature/source/date de la note ou déclaration ; `providerConfirmed:false`. |
| `documentation` | Source/date de la capacité documentée, distinctes de la preuve d'exécution. |
| `date`, `history` | Date du suivi courant et événements disponibles, pas date de réception ou sanction fournisseur. |
| `revocation` | Retrait local ou nécessité d'agir chez le fournisseur ; conditions particulières dans le registre. |

Les états « confirmé », « accepté » et les credentials sont refusés en import, même dans les événements. Les futurs connecteurs qualifiés devront intégrer identité, consentement, transport, permission minimale, mutation et relecture indépendante selon leur contrat ; la déclaration/restauration actuelle ne fabrique jamais leur preuve. Les statuts accepté/confirmé/indéterminé des tests de connecteurs existants ne sont pas des états fournisseur de production dans la PWA.

Le carnet conserve `flows.version:1`. Les anciennes fiches sans `events` restent valides et inchangées à la lecture. Une modification ajoute seulement le dernier état connu puis le nouveau ; chaque événement `{status,at}` ne recopie pas la cible. Maximum 32, dates entières ordonnées entre création et mise à jour, dernier événement égal à l'état courant ; champs inconnus et faux états rejetés. Retour arrière ajoute une transition et ne supprime pas la trace. Revenir à `declared` exige `undoFlowStatus(..., {redeclare:true})` via une confirmation explicite cible/contrôle/portée : c'est une nouvelle déclaration personnelle datée maintenant, pas une nouvelle action distante ni sa date. Un refus conserve le snapshot. Aucun faux passé n'est reconstitué.

## Sécurité, vie privée et compatibilité
Un snapshot, une écriture atomique sous verrou, comparaison de la source chargée. Échec/conflit : source et brouillons conservés. Remplacement réussi : données et brouillons précédents retirés de l'interface. Plafonds V2 inchangés (10 Mo, 500 fiches/200 caractères), historique borné. Sans stockage/verrou, lecture/export ou espace mémoire vide avec consentement et avertissement de perte.

DOM textContent, liens officiels fixes sans cible/paramètre personnel, aucun transport dans les modules de flux, aucune nouvelle origine CSP, aucun OAuth/mot de passe/secret. Synchronisation et extensions restent facultatives et inactives. Les [réserves RGPD](PRIVACY_ASSESSMENT.md) et le [runbook](OPERATIONS.md) restent bloquants pour C PUBLIC.

La [matrice OS/navigateurs V2](UNIVERSAL_FLOWS.md) reste applicable, sans promotion des tests de moteur en preuve physique. Safari est prioritaire ; iPhone/iPad/Mac, installabilité/stockage/VoiceOver réels restent à qualifier. Le nouveau registre fait partie du shell hors ligne après première mise en cache complète ; les aides externes nécessitent Internet. Un downgrade V2 refuse les événements/états nouveaux : conserver un export V3 complet et la source brute, ne pas effacer pour forcer une ancienne version.

## Risques et frontières de livraison
Les guides peuvent devenir périmés ou varier selon compte/pays/version. Les sources officielles partielles/annonces ne valent pas disponibilité testée. Le code public X ne prouve ni configuration effective ni déploiement ; les paramètres diffèrent selon composant. Aucun poids n'est utilisé pour estimer l'efficacité d'un blocage ou d'un signalement. Le [dossier X](research/2026-10-29-x-algorithm.md) détaille les limites.

Les tests physiques, la recette WCAG complète, la protection main, le cadre juridique, le déploiement et les opérations fournisseur restent ouverts. Aucun connecteur essentiel ne dépend d'un abonnement Copilot. Budget : alerte Actions identifiée, gratuité du scénario public standard revérifiée dans [gouvernance](GITHUB_GOVERNANCE.md), aucune dépense autorisée.
