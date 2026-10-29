# Preuves locales FIL CLAIR V3

Ces fichiers contiennent uniquement des sorties techniques et fixtures synthétiques. Ils ne qualifient aucun appareil physique, compte fournisseur, installation OS ou déploiement Vercel. Le [journal de session](../2026-10-29-universal-v3.md) décrit les limites et les étapes distantes encore à vérifier. Le [reçu](receipt.json) contient le commit local du code testé, 45 empreintes source et les empreintes des logs ; la PR porte la correspondance avec les commits distants et les CI au head final.

## Contrôles communs

- [Node : 144/144](node-unit.log)
- [Sécurité et service worker : 8/8](security-sw.log)
- [Validation de liste historique](list-validation.log)
- [Registre documentaire synchronisé](register-sync.log)
- [Audit npm brut](npm-audit.json) : 0 critical/high/moderate, 3 low hérités de développement ; le code retour du `npm audit` sans seuil est 1 à cause de ces low.

## Huit scripts sur trois moteurs

| Scénario | Chromium 156.0.8078.4 | Firefox 157.0 | WebKit 27.2 |
| --- | --- | --- | --- |
| E2E profils, sauvegarde, hors ligne | [PASS](chromium-test-pwa.log) | [PASS](firefox-test-pwa.log) | [PASS](webkit-test-pwa.log) |
| Stockage refusé/quota | [PASS](chromium-test-pwa-storage.log) | [PASS](firefox-test-pwa-storage.log) | [PASS](webkit-test-pwa-storage.log) |
| Récupération et proche 10 Mo | [PASS](chromium-test-pwa-recovery.log) | [PASS](firefox-test-pwa-recovery.log) | [PASS](webkit-test-pwa-recovery.log) |
| Concurrence | [4/4](chromium-test-pwa-concurrency.log) | [4/4](firefox-test-pwa-concurrency.log) | [4/4](webkit-test-pwa-concurrency.log) |
| Qualité | [30/30](chromium-test-pwa-quality.log) | [29/29](firefox-test-pwa-quality.log) | [30/30](webkit-test-pwa-quality.log) |
| Flux universels V2 | [17/17](chromium-test-pwa-flows.log) | [16/16](firefox-test-pwa-flows.log) | [18/18](webkit-test-pwa-flows.log) |
| Remplacement d'espace | [11/11](chromium-test-pwa-replacements.log) | [11/11](firefox-test-pwa-replacements.log) | [11/11](webkit-test-pwa-replacements.log) |
| Nouveau parcours V3 | [15/15](chromium-test-pwa-v3.log) | [15/15](firefox-test-pwa-v3.log) | [15/15](webkit-test-pwa-v3.log) |

24 codes de sortie 0. Les nombres de contrôles varient par moteur car les profils et fonctions d'installation émulés diffèrent ; aucun résultat n'est déduit pour Samsung Internet, Edge, Safari ou leurs OS physiques. 66 scans axe, zéro violation détectée et 63 scans avec contrôles indéterminés, principalement le contraste sur dégradés. Ce n'est pas une conformité WCAG 2.2 AA complète.

Reproduction : [environnement récupéré](../../research/2026-10-29-browser-environment.md), commandes CI dans `.github/workflows/fil-clair-pwa.yml`. Firefox utilise un opt-in propre au conteneur ; WebKit ses bibliothèques extraites et un wrapper temporaire. Les tests hors ligne arrêtent réellement le serveur d'origine.

## Captures de revue

- [Accueil desktop](desktop-home.jpg) : Chromium, viewport 1440 × 1000, espace synthétique vide.
- [Accueil 390 px](home-390-final.jpg) : Chromium, viewport 390 × 844, capture native, sans appareil physique ni Safari commercial.

L'inspection de la première vue a conduit à placer les quatre catégories avant la configuration ; le test V3 vérifie les quatre boutons dans une vue 320 × 850. La capture intermédiaire avant correction est historique, pas une preuve du rendu final.

## Historique RED et diagnostics

- [Modèle d'action absent](historical/action-model-red.log)
- [Registre absent](historical/effects-red.log)
- [Permissions non distinguées](historical/effects-permissions-red.log)
- [Accueil V3 absent](historical/home-v3-red.log)
- [Quatre accès trop bas](historical/home-first-viewport-red.log) et [capture avant correction](historical/home-390-before.jpg)
- [Ancien sélecteur E2E](historical/chromium-old-heading-e2e.log) et [ancien sélecteur stockage](historical/chromium-old-heading-storage.log)

Les [trois régressions de revue](historical/review-ui-red.log) et le [contrat de nouvelle déclaration](historical/review-model-red.log) ont été éprouvés RED→GREEN. Le reçu et les 24 logs avant cette correction sont conservés sous `historical/pre-review/`.

Ces échecs ont été observés avant correction ; ils sont exclus des 24 exécutions finales et du compteur axe. Les diagnostics d'environnement ne remplacent pas les scénarios produit.
