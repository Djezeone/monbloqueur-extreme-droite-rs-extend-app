# 2026-10-29 · FIL CLAIR · reprise des opérations durables

## Fait
- Mission et suite relues. PR1/2/3 ouvertes, draft, non fusionnées, heads51abcd3/b3b0660/839049a inchangés. V3.2 et ses preuves sont conservées.
- Nouvelle branche dépendante `feat/fil-clair-durable-operations` depuis839049a : journal IndexedDB borné, CAS et checkpoint committé avant chaque POST ; nouvel exécuteur isolé. Les adaptateurs attendent le point d'arrêt asynchrone, dont chaque suppression Bluesky avec CID.
- Concurrence/rechargement, consentement non restaurable, prepared repris, résultat incertain en quarantaine, arrêt d'authentification, cooldown persistant, reprise lecture seule sans autorisation d'inverse ni d'autre cible dans la voie.
- Revue indépendante et correction des deux constats Important ; diagnostic Minor reclassé Important et corrigé. Effets acceptés connus conservés même si la clôture du journal échoue ; aucune confirmation sans clôture.
- Modules absents des14dépendances du shell, aucun changement d'app.js/index/core/flow-core/persistence/SW ni des dépendances. Vercel Git automatique désactivé pour la nouvelle branche uniquement, en plus de l'exception V3.2 existante. Aucun achat, session sociale, écriture sur un compte réel, fusion ou publication générale.

## Ouvert
**A SAFE, B CONNECT et C PUBLIC non livrées.** Huit lots conservés, trois bloqués (01/06/08), cinq en revue (02/03/04/05/07). Le lot05 a désormais un socle durable implémenté/testé synthétiquement ; son activation reste interdite sans OAuth/serveur/transport/scopes qualifiés, comptes test autorisés, révocation et gestion des voies arrêtées.

Main reste protected:false au b7cd31b ; connecteur sans administration. Preview Vercel du nouveau contenu absente à ce stade ; référence READY au7348dbe0, version antérieure. Facturation relue au bon team :404 Plan not found, donc coût gratuit non établi, aucun déploiement engagé. Appareils physiques/Safari commercial/VoiceOver/TalkBack/WCAG complet, décisions RGPD/responsable/hébergement/support, supervision/rollback réels restent ouverts. URL officielle CONTRIB.OS inconnue, lien facultatif désactivé.

Le journal séparé n'est pas encore intégré à information/export/effacement/rétention ; ces fonctions bloquent une future activation. Aucun déverrouillage de quarantaine n'est improvisé. Une validation de schéma ne protège pas contre le code malveillant de même origine ; aucune garantie de panne matérielle, effacement/éviction ou ancien écrivain ignorant le journal.

## Vérifié comment
- `npm test` : **183/183**, dont151tests antérieurs,12journal et20durable. NodeRED initial15/15échecs, journalRED12/12échecs ; état intermédiaire12RED pendant développement conservé et non présenté comme final.
- `node scripts/audit-pwa.mjs` : **9/9SW**, audit statique et dépendances réelles du shellPASS ; connecteurs inaccessibles depuis le shell. SW/précache et format de sauvegarde existants inchangés.
- `test-operation-journal.mjs` : **10/10 par moteur** (30scénarios), IndexedDB réelle, CAS/concurrence/bornes/corruption/abort/durabilité stricte. Mutation de résolution sur put.success provoque le RED attendu ; première tentative navigateur bloquée par binaire absent conservée séparément.
- `test-durable-orchestration.mjs` : **14/14 par moteur** (42scénarios), transports simulés, aucune requête externe. RED de revue3/14 Chromium puis correction et trois moteursGREEN.
- `test-pwa.mjs` : trois moteursPASS avec origine HTTP arrêtée, service worker, ajout/suivi/historique/export/effacement/restauration et hors ligne. Les27anciennes suites complètes ne sont pas prétendues réexécutées localement dans ce cycle ; le workflow distant les conserve et ajoute les6nouvelles suites.
- Chromium156.0.8078.4,Firefox157.0,WebKit27.2 sousLinux ; aucun appareil physique. Archives officielles SHA/taille/CRC,22libs temporaires et index signés vérifiés ; aucun changement système/dépendance. Échec initial du parseur d'URL encodées du contrôle d'index conservé puis contrôle corrigéPASS.
- Registre14services/43contrôles synchronisé ; liste162valides ; `npm audit --audit-level=high` exit0,3lowdev héritées, aucune correction forcée.
- [Reçu](durable/receipt.json) : **71hashes source et34logs**. Ces empreintes qualifient le contenu au8b39a55 et identique dans le commit documentaire suivant. Résultats CI/PR/cockpit distants seront clôturés dans la nouvelle PR et la session Airtable après push, sans poussée documentaire redondante.
- Dépôt public relu (`private:false`) ; seuls les deux workflows PR existants ubuntu-latest, sans cache/artifact upload, peuvent être déclenchés. [Tarification officielle](https://docs.github.com/en/billing/concepts/product-billing/github-actions) et [runners publics standards](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job) revérifiés. Quota historique identifié :3000minutes Actions incluses épuisées le16/10, reset annoncé01/11 ; compteur live inconnu. Aucun crédit Copilot/premium/agent GitHub, achat ou recharge utilisé.

## Périmé
- « Journal fournisseur à construire » est remplacé par « socle durable isolé implémenté/testé, activation et exploitation encore ouvertes ». Le témoin SHA du carnet V3.2 n'est toujours pas ce journal.
- Les premières versions de cette branche ne respectaient pas le cooldown/arrêt dans recover et perdaient les effets acceptés en cas d'échec persistant : preuves RED conservées, correctifs vérifiés. Aucun ancien PASS n'est étendu à ces nouveaux cas avant correction.
- Les anciens déploiements et les CI de PR3 ne prouvent pas cette nouvelle branche. Aucune des huit portes n'est ajoutée comme validée par ce seul journal. Les déclarations locales restent distinctes des observations/confirmations fournisseur.

Références : [architecture](../DURABLE_OPERATIONS.md), [plan/ledger](../superpowers/plans/2026-10-29-durable-operations.md), [revue](2026-10-29-durable-review.md), [logs](durable/README.md), [cockpit](https://airtable.com/appXkTDooEjMD9lCs).
