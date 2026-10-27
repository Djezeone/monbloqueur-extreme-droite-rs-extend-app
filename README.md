# Bloquer l’extrême-droite

Une petite extension Chrome pour bloquer les comptes d’une liste sur X. On ouvre l’extension, on clique sur **Bloquer l’Extrême-droite**, et elle s’occupe du reste avec la session X déjà connectée.

Un seul onglet de travail est ouvert dans la fenêtre courante, sans changer l’onglet actif. Il sert à toute la liste, reste disponible si le traitement s’arrête et se ferme à la fin. Pas de clé API à renseigner.

## L’installer

Pour le moment, l’extension se charge en mode développeur :

1. Décompresser le ZIP de l’extension.
2. Aller sur `chrome://extensions` et activer **Mode développeur**.
3. Choisir **Charger l’extension non empaquetée**, puis le dossier contenant `manifest.json`.

Elle n’est pas encore publiée sur le Chrome Web Store. Pour mettre à jour une installation locale, remplacer les fichiers du même dossier et cliquer sur le bouton de rechargement de sa fiche dans `chrome://extensions`.

## La liste

Les comptes sont dans [`liste/accounts.json`](liste/accounts.json). Le fichier est récupéré au lancement : les modifications de la liste ne demandent pas de réinstaller l’extension. Un traitement déjà lancé garde sa propre copie jusqu’à la fin.

La liste de départ reprend les quatre comptes demandés pour le projet, puis les comptes officiels des partis directement associés. Elle n’est pas exhaustive. Les identifiants et les sources sont dans [`liste/sources.json`](liste/sources.json).

### Proposer un compte

La liste est gérée uniquement par **[MEYTRED sur X](https://x.com/MEYTRED)**. Pour demander l’ajout d’un compte ou signaler une erreur, contacte **[@MEYTRED](https://x.com/MEYTRED)** avec le lien du profil et les éléments qui justifient la demande.

Chaque demande est examinée avant un éventuel ajout. Seul le propriétaire du dépôt publie les modifications de la liste officielle ; les demandes ne sont jamais ajoutées automatiquement. Les comptes retenus seront pris en compte au prochain lancement du blocage, sans réinstaller l’extension.

Retirer un compte du fichier ne le débloque pas sur X.

## Pendant le blocage

Le popup peut être fermé ; Chrome doit rester ouvert. L’extension attend la confirmation de chaque blocage avant de passer au suivant. La pause entre deux profils est de 250 ms ; le reste du temps dépend du chargement de X.

Les comptes déjà bloqués sont laissés tels quels. Les profils indisponibles sont indiqués dans le bilan. Si X demande une connexion, une vérification, ou affiche une page inattendue, le traitement se met en pause. **Vérifier X** ouvre alors l’onglet de travail, et **Reprendre le blocage** continue au même endroit.

**Arrêter** ferme cet onglet. Les blocages déjà effectués restent actifs et peuvent être retirés depuis les paramètres de X.

## Ce qu’il faut savoir

Cette extension utilise les boutons du site, en français ou en anglais. X interdit cette automatisation dans [ses règles](https://help.x.com/en/rules-and-policies/x-automation) et peut restreindre un compte. Un changement d’interface peut aussi casser le fonctionnement. Ce projet n’est pas affilié à X.

Aucun mot de passe, cookie ou jeton n’est lu. La liste et l’avancement restent dans le navigateur ; il n’y a pas de suivi d’audience. Le fichier de comptes est public et hébergé sur GitHub. [La page de confidentialité](extension/privacy.html) donne les détails.

## Travailler sur le code

Node.js 20 ou plus récent suffit pour les outils de développement. L’extension elle-même n’a aucune dépendance à installer.

```sh
npm ci
npm test
npm run validate:list
npx playwright install chromium
npm run test:browser
npm run build
```

Le ZIP est créé dans `dist/extension-chrome.zip`. Les tests navigateur utilisent des pages de test : ils ne bloquent aucun compte réel. Sous Windows, `TEST_BROWSER_CHANNEL=msedge` permet de les lancer avec Edge déjà installé. `TEST_BROWSER_HEADED=1` permet de voir le navigateur de test.

Les notes de dépôt sur le Store sont rangées dans [`docs/publication-chrome.md`](docs/publication-chrome.md).
