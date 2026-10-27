# Bloquer l’Extrême-droite

Une extension Chrome, un bouton. Connectez-vous à X comme d’habitude, ouvrez l’extension et cliquez sur **Bloquer l’Extrême-droite**. Les profils de la liste sont bloqués automatiquement depuis votre session existante. Aucun compte développeur X, clé API ni autorisation OAuth n’est nécessaire.

## Installer la version disponible

1. Télécharger et décompresser `extension-chrome.zip`.
2. Ouvrir `chrome://extensions`, activer **Mode développeur**, puis **Charger l’extension non empaquetée**.
3. Sélectionner le dossier décompressé contenant `manifest.json`.

Épingler l’extension pour accéder au bouton. Garder Chrome ouvert pendant l’opération ; le petit popup peut être fermé. L’extension ouvre un onglet de travail en arrière-plan et le ferme à la fin. Si X demande une connexion ou une vérification, le blocage s’arrête et le bouton permet de reprendre.

**Installation grand public en un clic :** elle exige une publication et une validation sur le Chrome Web Store. Un ZIP téléchargé ne peut pas s’installer automatiquement dans Chrome. Le paquet fourni est fonctionnel en mode développeur ; il n’est pas encore référencé dans le Store.

## Liste mise à jour à distance

Le fichier public est ici :
https://github.com/LaRosette/bloquer-extreme-droite-x/blob/main/liste/accounts.json

L’extension récupère le fichier à chaque nouveau lancement et à l’ouverture du popup. Modifier ce JSON sur GitHub suffit : les utilisateurs n’ont pas besoin de télécharger une nouvelle version de l’extension. Un délai de cache de l’hébergeur peut s’appliquer. Un traitement lancé conserve sa liste initiale ; une modification n’entraîne aucun blocage sans clic de l’utilisateur.

```json
{
  "schemaVersion": 1,
  "version": "2026-10-27.1",
  "accounts": [
    {"id": "217749896", "username": "MLP_officiel"}
  ]
}
```

Incrémenter `version` après une modification. L’identifiant numérique X doit être une chaîne de caractères ; le script de contenu vérifie cet identifiant avant de cliquer, afin de ne pas bloquer le nouveau propriétaire d’un ancien pseudo. Ne jamais inventer un identifiant. Les sources de la liste initiale sont dans `liste/sources.json`. La liste est éditoriale et non exhaustive ; elle ne classe pas automatiquement les personnes privées.

Un compte retiré de la liste reste bloqué sur X tant que l’utilisateur ne le débloque pas. Un compte déjà bloqué n’est jamais débloqué par l’extension. Un compte inexistant ou suspendu est signalé dans le bilan et n’empêche pas le traitement des suivants.

## Limite de la méthode

L’extension automatise les boutons visibles de X, en français ou en anglais. **X interdit l’automatisation de son interface dans ses règles et peut restreindre un compte.** La structure du site peut changer ; l’extension suspend alors les actions au lieu de deviner où cliquer. Aucun contournement de CAPTCHA ou de vérification, aucun accès à une API interne de X.

Le bouton Arrêter ferme l’onglet de travail ; les blocages déjà faits restent actifs. La progression est conservée localement et liée au compte X utilisé au lancement. Un changement de compte suspend l’opération.

## Développement et contrôles

Node.js 20+ pour les outils de développement uniquement ; aucune dépendance n’est installée chez les utilisateurs.

```powershell
npm ci
npm test
npm run validate:list
npx playwright install chromium
npm run test:browser
npm run build
```

Si le Chromium téléchargé ne démarre pas sur Windows, le navigateur Edge déjà installé peut servir aux tests :

```powershell
$env:TEST_BROWSER_CHANNEL='msedge'
npm run test:browser
```

Le test navigateur charge une copie isolée de la véritable extension, remplace X par des pages de test et simule la liste. Il vérifie le clic de blocage, la confirmation, les comptes déjà bloqués, les comptes indisponibles et le refus d’un identifiant incohérent. Il ne modifie aucun compte réel. Les éléments de vérification se trouvent dans `verification/`.

Le ZIP de publication est produit dans `dist/extension-chrome.zip` et son empreinte dans le fichier `.sha256`. Aucun code de démonstration ni dépendance de test n’y est inclus. Tous les scripts exécutés chez l’utilisateur sont dans le paquet ; seul le JSON de comptes est distant.

## Publication sur le Chrome Web Store

La fiche suggérée et les déclarations de permissions sont dans `PUBLICATION.md`. Publier la page `extension/privacy.html` sur une URL publique de l’éditeur et renseigner cette adresse lors du dépôt. Le Store valide l’extension avant sa mise à disposition. Ne pas promettre une conformité ou une validation déjà acquise.

Sources techniques :
- https://help.x.com/en/rules-and-policies/x-automation
- https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements
- https://developer.chrome.com/docs/extensions/reference/api/alarms
