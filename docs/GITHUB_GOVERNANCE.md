# GitHub — budget et protection de main

État vérifié le 28 octobre 2026 : dépôt **public**, PR #1 **brouillon**, tête initiale `ee515c17a736ceb865c605eacc9aee37a9776c7a`, `main` à `b7cd31b036cca17b48dbf726c047847191c01a5b`.

## Budget : 0 € supplémentaire

Le quota épuisé signalé par le propriétaire n'est pas identifié. Le connecteur GitHub ne fournit pas la facturation/Copilot ; le navigateur cloud n'est pas connecté. La recherche ciblée d'une notification de quota dans Gmail a renvoyé «requires reauthentication» et n'a fourni aucun contenu. Aucune dépense ni modification de budget n'a été demandée. Aucun agent GitHub/Copilot, Codespace, recharge ou abonnement n'est utilisé par FIL CLAIR.

Les sources GitHub officielles vérifiées indiquent que les runners **standards** des dépôts **publics** sont gratuits et illimités. Les runners de plus grande taille sont payants ; le stockage d'artefacts/caches a ses propres règles. Nous retenons uniquement `ubuntu-latest`, sans téléversement d'artefact ni cache Actions dans les deux workflows de validation. La visibilité publique et l'absence d'autre service facturable sont à relire avant chaque nouvelle campagne CI. Si le dépôt devient privé, ne plus lancer ces campagnes avant une nouvelle vérification du budget.

- [Choix du runner](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job)
- [Facturation GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Actions immuables](https://docs.github.com/en/actions/reference/security/secure-use)

Les workflows de validation passent par `pull_request` et `push` **uniquement sur main**, supprimant la double exécution push+PR des branches de fonctionnalité. Une seule mise à jour distante est prévue après les commits cohérents locaux. Les workflows historiques `release.yml` et `tableau.yml` ne sont pas déclenchés par cette mise à jour de branche ; aucun tag, dispatch de release ni publication n'est autorisé. Ils restent distincts de la livraison PWA.

## Protection de main : configuration prête, application non prouvée

Lecture API : `GET /repos/Djezeone/monbloqueur-extreme-droite-rs-extend-app/rulesets` retourne `[]`. La lecture détaillée de `branches/main/protection` retourne **403 Resource not accessible by integration**. Une lecture complémentaire autorisée de `branches/main` confirme **`protected:false`**, `protection.enabled:false`, aucun check exigé : main n'est pas protégée au moment du contrôle. Le propriétaire a le rôle admin, mais l'installation du connecteur n'expose pas les opérations d'administration. Le navigateur cloud retourne une page non connectée sur Settings. La configuration prête ci-dessous reste donc une action à effectuer avec une session administrateur, pas une protection active.

Le fichier [main-ruleset.json](main-ruleset.json) prépare : PR obligatoire, une approbation indépendante et de la dernière poussée, discussions résolues, checks `pwa-quality-gate` et `verifier` attribués à l'app GitHub Actions, branche à jour, historique linéaire, blocage suppression/force-push, aucune exception de contournement. Les noms des checks sont conservés dans les workflows.

Ce JSON ne configure pas à lui seul la recette sur appareils physiques ni la revue juridique. Ces portes restent humaines et obligatoires avant Go. L'approbation par un sous-agent Work n'est pas une approbation GitHub indépendante.

Après ouverture d'une session admin autorisée, lire d'abord les règles existantes et leur source pour éviter un doublon. Si elles restent absentes, appliquer la configuration via l'interface GitHub ou, depuis une CLI GitHub déjà authentifiée et disposant des droits admin :

```bash
gh api repos/Djezeone/monbloqueur-extreme-droite-rs-extend-app/rulesets
gh api --method POST repos/Djezeone/monbloqueur-extreme-droite-rs-extend-app/rulesets --input docs/main-ruleset.json
```

Puis relire le ruleset par l'ID retourné et `branches/main/rules`, vérifier `enforcement=active`, la cible et les checks. Conserver l'URL et la réponse sans secret. Aucun PASS ne peut être attribué à cette étape avant cette relecture. Ne pas assouplir les permissions du connecteur ni créer un jeton pour contourner ce blocage.

## Preuves initiales conservées

- [CI PWA verte au SHA initial](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/actions/runs/40624001194)
- [CI extension verte au SHA initial](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/actions/runs/40624001120)

Ces deux preuves ne valent pas pour un nouveau SHA. Ne pas les recycler comme validation des modifications de cette session.

## En-têtes du futur déploiement PWA

`pwa/vercel.json` prépare uniquement des en-têtes statiques : CSP avec `frame-ancestors 'none'`, refus d'iframe, `nosniff`, referrer absent et permissions caméra/micro/localisation désactivées. Le style embarqué de la notice est autorisé par son empreinte SHA256 ; toute modification de ce style exige de recalculer l'empreinte. Le service worker doit être revalidé par HTTP (`max-age=0`). Aucun middleware, fonction serveur, analytics ou service facturable n'est ajouté.

Ces paramètres ne sont pas réputés actifs sur la preview existante : vérifier le contenu et les en-têtes du nouveau déploiement avant sa recette. La CSP reste limitée à l'origine et au téléchargement public GitHub ; les adaptateurs API inactifs ne disposent pas d'une permission réseau supplémentaire.
