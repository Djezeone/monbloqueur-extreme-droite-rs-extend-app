# GitHub — budget et protection de main

État relu le 29 octobre 2026 : dépôt **public**, PR #1 **brouillon** au SHA V2 `51abcd35adefb757cc4f8831d23131a465b9f52a`, `main` à `b7cd31b036cca17b48dbf726c047847191c01a5b` et `protected:false`. La branche V3 est distincte et dépend de #1 ; ses références finales et contrôles distants figurent dans sa PR et le journal de session. Le SHA initial `ee515c17` reste une preuve historique seulement.

## Budget : 0 € supplémentaire

**Actualisation du 29 octobre 2026 : quota identifié par notification officielle privée.** Le message GitHub du 16 octobre 2026 intitulé « You have used 100% of the Actions minutes included for the Djezeone account » indique **3 000 minutes Actions utilisées sur 3 000 incluses**, et une remise à zéro annoncée au **1er novembre 2026**. Le corps MIME a été lu via le connecteur de messagerie ; les en-têtes de réception indiquent DKIM/SPF/DMARC pass pour github.com. Le contenu brut, l'adresse de réception et les identifiants de messagerie ne sont pas publiés dans ce dépôt public. Ce constat identifie l'alerte Actions ; il ne fournit pas le compteur de facturation en temps réel ni l'état d'autres quotas.

Le constat antérieur « quota inconnu / requires reauthentication » reste historique et est désormais **périmé** : la lecture de la notification a réussi dans cette session. Le connecteur GitHub ne fournit toujours pas la facturation/Copilot ; le navigateur cloud n'est pas connecté. Aucun budget n'a été modifié, aucune dépense demandée. Aucun agent GitHub/Copilot, Codespace, recharge ou abonnement n'est utilisé par FIL CLAIR. Les ressources payantes restent indisponibles.

Les sources GitHub officielles vérifiées indiquent que les runners **standards** des dépôts **publics** sont gratuits et illimités. Les runners de plus grande taille sont payants ; le stockage d'artefacts/caches a ses propres règles. Nous retenons uniquement `ubuntu-latest`, sans téléversement d'artefact ni cache Actions dans les deux workflows de validation. La visibilité publique et l'absence d'autre service facturable sont à relire avant chaque nouvelle campagne CI. Si le dépôt devient privé, ne plus lancer ces campagnes avant une nouvelle vérification du budget.

Ces règles officielles ont été revérifiées le 29 octobre pour la tranche V3. Le quota de minutes incluses épuisé ne justifie aucun recours à des minutes privées supplémentaires : seules les exécutions gratuites du dépôt public sont retenues, après contrôle du scénario exact. Les tests de développement restent locaux ; la nouvelle suite V3 est incluse dans le job existant, sans troisième workflow.

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

## Actualisation30octobre — intégration et chemins historiques
Les deux CI finales PR#6 sont vertes au0af61dee2141ac15a64f1ab3ca0a169f43b4c0ce. Les six PR sont ouvertes, linéaires et déjà agrégées dans ce tip ; aucune fusion réalisée. Le nouvel ordre autorise les fusions admissibles, pas une dérogation aux contrôles.

L'alerte Actions3000/3000 du16/10 et reset annoncé01/11 ont été relus. Compteur live et budgets restent inconnus. Main protected:false/rulesets=[] relus ; protection détaillée403, session navigateur non connectée, gh absente. La présence du JSON reste distincte de son application.

Le candidat retire les chemins historiques risqués : tableau vérifié par --check sans push, release limitée à préparation manuelle sans publication/tag/cache/artifact, actions restantes figées et tokens contents:read avec credentials non persistants. Aucun dispatch de ces workflows n'est lancé. **Main conserve son code historique tant que la PR n'est pas fusionnée** ; aucun Go de publication implicite.

Vercel : déploiement Git désactivé globalement dans les deux racines du candidat, y compris main et nouveaux noms de branches ; une preview manuelle exige encore preuve de coût et recette. Voir [audit/risques/preuves](evidence/2026-10-30-security-integration.md).

