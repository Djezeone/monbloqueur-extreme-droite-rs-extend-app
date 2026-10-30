# Reprise de la CI — serveur local de test

30octobre2026, Europe/Paris. Complément de PR6 au premier head canonique036e66bf6f5f0061eb27591128ef3acd75a08e00. **Journal pré-push du correctif de fixture ; aucune nouvelle CI verte présumée.**

## Fait

Le [run PWA40983277220](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/actions/runs/40983277220), tentative1, est `cancelled` après environ20minutes (timeout configuré20, aucune annulation demandée par cette session). Le [run extension40983277066](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/actions/runs/40983277066), tentative1, est `success`, zéro artefact après fin. Ses journaux63958caractères montrent230Node, builddev, lintFirefox0errors/0warnings, tests navigateur et18contrôles Firefox159Linux. Le log PWA194216caractères est conservé dans [les sorties](local-data-ci-recovery/README.md).

La PWA avait passé230Node,9SW/audit, la suite de données24/24Chromium, V3 15/15 et les dix premiers scénarios V3.2. Dernière ligne applicative01:03:31Z : reflow ; annulation01:21:22Z. La matrice36n'a donc pas été acquise. Aucune relance du SHA inchangé ; la porte globale du candidat a été décochée dans Airtable,0/8, en conservant les preuves historiques PR5.

## Vérifié comment

Un probe TCP réel du serveur de test a montré que `server.pause()` reste en attente avec une connexion ouverte sans requête ; détruire le client libère immédiatement l'arrêt. Deux régressions bornées à1500ms, préconnexion vide et en-têtes inachevés, échouent sur le helper ancien (même blob0503db5 au0445454 et036e66b), puis passent avec arrêt explicite des connexions du seul serveur possédé par la fixture.

Correction de `scripts/pwa-test-utils.mjs` : appeler `closeAllConnections()` **après** `server.close()`, selon [la documentation Node24](https://nodejs.org/download/release/latest-v24.x/docs/api/http.html#servercloseallconnections). Cela force la coupure réseau de l'environnement synthétique ; aucune connexion fournisseur, serveur applicatif, préférence ou fichier PWA n'est modifié. L'absence de cache ou une erreur de hors-ligne peut toujours faire échouer les assertions.

Le premier test GREEN a exposé un `ECONNRESET` attendu côté client aux en-têtes partiels. Son oracle a été corrigé pour collecter les erreurs de ce seul socket, attendre sa fermeture et accepter uniquement ce code de coupure ; toute autre erreur reste refusée. Le premier échec est conservé. Le driver final a été réexécuté sur l'ancien helper pour confirmer2RED, puis2GREEN. **232/232Node et9/9SW/audit** passent après ce correctif.

La suite V3.2 a ensuite terminé14/14 sur chacun des trois moteurs Linux (Chromium156,Firefox157,WebKit27.2), y compris le hors ligne et la sauvegarde lente. Les traces START/par étapes offline ont été ajoutées après ces passes, sans modifier les assertions, pour localiser un éventuel nouvel arrêt CI. Les trois scripts locaux initialement interrompus avaient aussi été repris : remplacement Chromium11/11,fluxFirefox16/16,fluxWebKit18/18. Ils ne prouvent pas une matrice entière au même instant ; leurs sorties et empreintes sont conservées.

**Limite de causalité :** le journal CI s'arrête avant le bloc offline, mais n'instrumente pas les sockets distantes ni la ligne précise attendue. Le mécanisme TCP est reproduit localement et cohérent avec cet arrêt ; il n'est pas annoncé comme preuve de l'unique cause distante. Le nouveau head doit repasser la CI entière. Le timeout et les deux workflows/runners restent inchangés, aucune dépense supplémentaire.

## Ouvert

Nouvelle CI au head contenant le correctif, lecture du log complet et des artefacts après fin, readback du cockpit. Protections main/admin, VercelPro capacité incluse inaccessible (browser revient àLogin), preview actuelle, physiques/WCAG complet, juridique/RGPD, OAuth/serveur durable et exploitation restent ouverts. A/B/C non livrées. Aucun merge, déploiement ou appel social réel.

## Périmé

Les mentions « CI PR6 en cours » au036e66b sont remplacées par une annulation, jamais par un succès. Les anciennes sorties locales incomplètes ont désormais des reprises distinctes, sans être réétiquetées PASS. Le helper antérieur pouvait bloquer une coupure de réseau synthétique ; le correctif appartient aux tests, pas à la PWA. Les86empreintes initiales s'appliquent au036e66b ; la nouvelle [attestation de source](local-data-ci-recovery/receipt.json) décrit le helper corrigé et vérifie que tous les fichiers PWA sont identiques.
