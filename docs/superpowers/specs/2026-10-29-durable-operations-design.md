# FIL CLAIR — journal durable B CONNECT

## Intention et périmètre
Poursuivre les lots04/05/07 sans reconstruire les fonctions V3.2 validées au839049a. Préparer un exécuteur durable **isolé et inactif**, qualifié avec transports simulés et IndexedDB réelle. Aucune session OAuth, requête sociale, synchronisation, publication ou dépense supplémentaire. Ce travail ne livre pas B CONNECT.

## Choix d'architecture de l'exécuteur
Décision prise par l'agent dans le mandat d'autonomie : conserver JavaScript et les adaptateurs officiels existants, ajouter un journal IndexedDB séparé et un nouvel orchestrateur. Un serveur/une base externe nécessiteraient un environnement et un coût non qualifiés. Un simple verrou mémoire/localStorage ne survit pas au rechargement ni ne fournit de CAS transactionnel. La PWA principale n'importe pas les nouveaux modules ; son stockage, sauvegarde et UX ne changent pas.

## Invariants
- Une voie par tuple fournisseur/compte/origine HTTPS autorisée, sérialisée par CAS IndexedDB ; une opération par voie, pas de traitement de masse.
- Journal borné à128voies, un seul checkpoint minimal par voie, sans token, mot de passe, cookie, en-tête, message fournisseur, corps de réponse ou ticket de consentement.
- Format checkpoint v1 : `revision` croissante, `operationId` UUID, cible normalisée et `targetKey`, action block/unblock, phase prepared/sending/closed/quarantined, compteur d'envois0..100, dates en millisecondes, `retryAt`, raison technique bornée, observation facultative `{blocked,observedAt}`. Le tuple est stocké avec l'entrée et comparé à sa clé. Validation stricte ; aucune fonction d'import/restauration/effacement/réinitialisation du journal.
- `createOperationJournal({indexedDB,timeoutMs})` retourne `read(lane)` et `compareAndSet(lane, expectedRevision, next)` ; la CAS attribue revision=précédente+1, retourne null en conflit. Résolution seulement après `transaction.complete`, abort/délai/capacité absente → refus. Demander durability strict ; sans prise en charge, refus pour cette brique facultative.
- `createDurableOrchestrator({connector,journal,now})` fournit grantConsent/execute/recover/getCheckpoint/cancel. Dépendances de stockage/transport de confiance ; aucun état fourni par un import n'est utilisé comme consentement/preuve.
- Un ticket explicite, éphémère, unique, borné au compte/cible/action expire en1..300000ms (60000par défaut). Le redémarrage ne le restaure jamais.
- Réserver prepared **avant toute lecture authentifiée**. Deux onglets/runners ne peuvent pas démarrer deux opérations de la même voie, même pour des cibles différentes.
- Les adaptateurs attendent `beforeWrite()`. Avant **chaque POST**, committer sending et son compteur, puis revérifier consentement/annulation. Une CAS refusée, un abort ou un délai du journal empêchent le POST. Aucun lease expirant ne libère une voie après sending.
- L'exécuteur mémoire existant reste l'outil interne pour identité, prélecture, mutation et lecture de contrôle ; son comportement public historique demeure. Un checkpoint fermé n'est pas une preuve fournisseur.
- Après réponse et lecture de contrôle terminées dans la même exécution, fermer le checkpoint avant de rendre une confirmation actuelle. Une clôture non confirmée du journal donne un résultat incertain et conserve le barrage durable.
- Après résultat incertain ou interruption possible après sending, toute action nouvelle, y compris inverse et sur une autre cible, est interdite dans la voie. `recover()` effectue uniquement une lecture ; même une observation conforme ne libère pas la quarantaine et ne confirme pas l'ancienne opération.
- Un prepared récupéré peut être fermé sans réseau : le checkpoint sending n'a jamais été committé, et son ancien exécuteur perd sa CAS. Un sending récupéré devient quarantined avant la lecture. Aucun rejeu automatique, aucun déblocage administratif improvisé.
- Une réponse429 déterministe sans changement peut fermer avec cooldown persistant ; nouvelle opération interdite avant retryAt. Toute écriture partielle/incertaine reste en quarantaine. Les refus d'identité/authentification arrêtent le runner courant.
- Les snapshots restaurés ne rendent jamais `confirmed:true` ni une preuve API. Une observation fraîche et l'historique d'un checkpoint sont distincts.

## Limites et confidentialité
IndexedDB reste du stockage sensible local, accessible au code de même origine. Ce journal n'est ni une signature, ni une sauvegarde, ni une protection contre un ancien écrivain qui l'ignore, une suppression/éviction de stockage, un navigateur compromis ou une panne matérielle non testée. La réservation avant envoi peut bloquer prudemment une opération jamais transmise. Les voies en quarantaine ne sont pas purgées automatiquement. Le produit principal ne crée aucune de ces données tant que les modules restent inactifs. Une future activation doit intégrer information, export/effacement, séparation des comptes et révocation avant toute recette réelle.

## Recette
Tests de modèle/validation stricts et scénarios d'intégration sur IndexedDB réelle sous trois moteurs : concurrence de deux pages, reload, ticket ancien, prepared repris, POST suspendu, observation conforme sans libération, refus de stockage avant POST, timeout/429/401, deux suppressions Bluesky avec arrêt au second checkpoint. Aucun accès réseau social. Régression Node complète et audits existants ; invariants d'inactivité et précache inchangé. Tests physiques/power loss, OAuth/transport réels, serveur et conformité restent ouverts.
