# Preuves locales — socle durable,29octobre2026

Les fichiers sont des sorties réellement conservées, avec leurs hashes dans `receipt.json`. Fournisseurs et identités synthétiques seulement ; IndexedDB et moteurs de navigateur réels sousLinux. Ces preuves ne certifient ni OAuth, ni API réelle, ni appareil physique, ni déploiement.

| Fichiers | Portée |
|---|---|
|node-final.log|183/183Node,0échec.|
|security-final.log|9/9SW et audit ;14modules du shell sans connecteur.|
|journal-green-{chromium,firefox,webkit}.log|10/10scénarios par moteur.|
|durable-final-{chromium,firefox,webkit}.log|14/14scénarios par moteur, requêtes externes0.|
|pwa-{chromium,firefox,webkit}.log|Non-régression existante E2E et vrai arrêt de l'origine HTTP pour offline.|
|runner-red.log,journal-red-node.log|Tests avant implémentation, échecs attendus.|
|node-after-runner.log|État intermédiaire avec journal encore RED ; aucun succès final déduit.|
|journal-red-browser.log|Environnement absent à la première tentative, aucun RED fonctionnel prétendu.|
|journal-red-browser-early-resolution.log|Mutation isolée : put.success avant complete laisse échapper l'abort ; vrai RED.|
|review-red-node.log,review-red-browser.log|Constats reproduits avant correction,5échecs Node/3navigateur.|
|review-green-node.log|20/20tests durable après une passe de correction.|
|runtime-*.log|Archives officielles et22libs épinglées, signatures/index/CRC/SHA, versions/commandes de lancement ; fichiers temporaires seulement.|
|runtime-signed-index-initial-encoded-filename.log|Premier parseur incomplet d'URL encodées ; corrigé dans le contrôle final, erreur conservée.|
|dependencies.log,register.log,list.log|Audit seuilhigh exit0 (3lowdev), registre14/43 et liste162valides.|

Le reçu inclut71sources et34logs, pas de token/session/listes privées. Les conclusions distantes après push sont dans la PR et Airtable pour ne pas déclencher de CI documentaire supplémentaire. Les limites et décisions sont dans le journal de session et la revue.
