# 2026-10-30 · FIL CLAIR · frontière serveur sans rejeu

## Fait
- Mission et queue relues, PR1/2/3/4 et CI PR4 vérifiées : draft/non fusionnées, heads inchangés ;42a70ca conserve deux CI vertes. Baseline183/183Node.
- Branche dépendante `feat/fil-clair-server-transport` : bibliothèque Node24 Mastodon, jeton synthétique en fermeture mémoire, origine/compte/scopes liés, TTL/déconnexion locale, DNS public A/AAAA validé puis épinglé/TLS, quatre routes et réponses projetées/bornées. Un ClientRequest/end par appel, aucun retry/refresh/redirect/fallback.
- Tests HTTPS loopback avec CA/clé éphémères, aucun fournisseur réel. Assemblage adaptateur/exécuteur avec journal mémoire de test : confirmation par lecture de relation et quarantaine après effet appliqué puis coupure. Ne qualifie pas un journal serveur durable.
- Revue indépendante puis correction du délai tardif ; preuve de construction tardive synthétique seulement. Deux RED puis GREEN, suite finale226/226. Aucun Minor différé, aucune seconde revue revendiquée.
- PWA/app/SW/carnet/dépendances inchangés ;14modules du shell sans connecteur. Aucun point d'entrée HTTP/serveur déployé, login, révocation fournisseur, clé réelle, compte social, achat, fusion ou publication générale. Git auto désactivé pour cette seule nouvelle branche en plus des exceptions existantes.

## Ouvert
**A SAFE/B CONNECT/C PUBLIC non livrées**,8lots maintenus :01/06/08bloqués,02/03/04/05/07en revue. Le transport serveur est du code qualifié localement, pas une connexion OAuth réelle.

Client OAuth officiel, stockage/session/journal serveur durables, routes auth/CSRF, version Mastodon4.3+/permissions réelles, révocation, information/export/effacement/rétention et sortie de quarantaine, comptes/cibles test autorisés et recette B restent requis. Bluesky reste derrière SDK/DPoP/PAR et une frontière sans retry à qualifier. Scopes/type déclarés ne prouvent pas émission OAuth.

Main relue protected:false au b7cd31b, administration indisponible. Référence Vercel READY au vieux7348dbe0 ; lecture facturation au bon team retourne404 Plan not found, donc coût/capacité gratuite non établis. Aucun nouveau déploiement engagé. Physique/Safari commercial/VoiceOver/TalkBack/WCAG complet, responsable/RGPD/hébergement, exploitation/support/supervision/rollback ouverts. URL CONTRIB.OS inconnue, lien facultatif désactivé.

## Vérifié comment
- `npm test` : **226/226**, dont183antérieurs,17groupes politique et26groupes transport/session. Première implémentation18RED→18GREEN, six couvertures supplémentaires passaient déjà ; revue2RED/26→26GREEN. État intermédiaire224/224 conservé, sans confusion avec résultat final.
- Politique : IPv4/IPv6spéciaux, réponses DNS mixtes/altérées/bornées, variantes URL/query/body/options non qualifiées refusées avant socket. Aucun appel réseau dans ce module.
- Transport : vrai serveur TLS loopback, secret non sérialisé, Host/Bearer/ID liés, certificats de nom erroné refusés ;421/302/503un seul POST ; effet appliqué puis coupure reste inconnu ; arrêt401/403 dès headers même corps inachevé ; annulation/TTL/délai DNS sans dispatch ; réponses UTF8/JSON/gzip/tronquées/oversized et mauvaisID refusées. Délai monotone vérifié avant dispatch et acceptation même timers retardés.
- Le driver de test réoriente vers loopback après vérification des paramètres DNS/TLS ; CA éphémère, aucun bypass production. IPv6paramètres testés, fil fixtureIPv4 ; aucune connectivité IPv6 externe/instance réelle/appareil certifié. Pas de nouvelle suite navigateur locale : frontend inchangé, régression33scripts conservée dans workflow distant.
- `node scripts/audit-pwa.mjs` :9/9SW et audit ; registre14/43 synchronisé, liste162valide ; audit seuilhighPASS avec3lowdev héritées. Aucun lockfile/dépendance changé.
- Inspection Node24.22.1/Undici7.30.1 : branche421 avec relance interne dans fetch constatée, SHA du source embarqué conservé ; choix HTTPS natif motivé sans garantie exactement-une-fois à distance.
- [Reçu](server-transport/receipt.json) :76empreintes source et15logs, source au68251f6, identique dans commit documentaire suivant. Les conclusions CI/PR/cockpit distantes seront ajoutées à la PR et Airtable après lecture, sans push documentaire redondant.
- Dépôt public relu, deux workflows PR existants ubuntu-latest sans cache/upload, [scénario gratuit officiel](https://docs.github.com/en/billing/concepts/product-billing/github-actions) revérifié. Aucun Copilot/premium/agentGitHub/abonnement/recharge/service payant utilisé. Quota historique :3000minutes Actions incluses épuisées16/10, reset annoncé01/11 ; compteur live inconnu, pas de reset anticipé inventé.

## Périmé
- « Transport serveur à construire » devient bibliothèque Mastodon inactive implémentée et testée en TLS local ; login/serveur déployé/stockage durable serveur ne sont toujours pas réalisés. Journal PR4 et ses preuves conservés.
- Hypothèse d'un fetch générique sans relance implicite invalidée par inspection de sa branche421. HTTPS natif choisi, pas de promesse d'application exactement une fois chez le fournisseur.
- Avant correctif, le timer seul permettait une construction/acceptation hors délai ; deux RED conservés, gardes explicites vérifiées. Rien ne démontre un POST tardif réel sur un compte social.
- Anciennes previews/CI PR4 ne prouvent pas cette branche. Aucune porte réelle ni livraison A/B/C ajoutée. Déconnexion/TTL locaux restent distincts de révocation fournisseur.

Liens : [architecture](../SERVER_TRANSPORT.md), [sources](../research/2026-10-30-server-transport.md), [revue](2026-10-30-server-review.md), [queue](../DELIVERY_QUEUE.md), [cockpit](https://airtable.com/appXkTDooEjMD9lCs).
