# Installer l’extension

Il faut être connecté à X dans le navigateur où l’extension est installée. Ensuite, ouvre l’extension et clique sur **Bloquer l’Extrême-droite**. Un seul onglet de travail sert à toute la liste.

## Chrome

1. Télécharger [le ZIP Chrome](https://raw.githubusercontent.com/LaRosette/bloquer-extreme-droite-x/main/downloads/extension-chrome.zip) et le décompresser.
2. Ouvrir `chrome://extensions`.
3. Activer **Mode développeur**, en haut à droite.
4. Cliquer sur **Charger l’extension non empaquetée** et sélectionner le dossier décompressé contenant `manifest.json`.

## Microsoft Edge

1. Télécharger [le ZIP Edge](https://raw.githubusercontent.com/LaRosette/bloquer-extreme-droite-x/main/downloads/extension-edge.zip) et le décompresser.
2. Ouvrir `edge://extensions`.
3. Activer **Mode développeur**.
4. Cliquer sur **Charger l’extension décompressée** — ou **Charger l’extension non empaquetée**, selon la version d’Edge — puis sélectionner le dossier contenant `manifest.json`.

Chrome et Edge conservent cette installation après un redémarrage. Évite de déplacer ou supprimer le dossier une fois l’extension chargée. Pour une mise à jour du code, remplace ses fichiers et clique sur le bouton de rechargement de la fiche de l’extension.

## Firefox

Firefox 142 ou plus récent est nécessaire.

1. Télécharger [le ZIP Firefox](https://raw.githubusercontent.com/LaRosette/bloquer-extreme-droite-x/main/downloads/extension-firefox.zip).
2. Ouvrir `about:debugging#/runtime/this-firefox`.
3. Cliquer sur **Charger un module complémentaire temporaire**.
4. Sélectionner directement le fichier `extension-firefox.zip`. On peut aussi le décompresser et sélectionner son `manifest.json`.

**Cette installation est temporaire** : Firefox retire l’extension au redémarrage. Il faudra alors recharger le ZIP. Pour la garder en permanence et proposer une installation habituelle, le paquet doit d’abord être signé par Mozilla. Aucun réglage de sécurité à désactiver.

## Une fois installée

Épingle l’extension depuis le menu des extensions du navigateur si tu veux garder son bouton à portée de main. Le popup peut être fermé pendant le blocage ; le navigateur doit rester ouvert.

Si le traitement s’arrête, **Vérifier X** affiche l’onglet de travail. Termine la connexion ou la vérification demandée par X, puis clique sur **Reprendre le blocage**. **Arrêter** ferme l’onglet ; les blocages déjà effectués restent actifs.

La liste de comptes se met à jour sans réinstaller l’extension, quel que soit le navigateur. Un changement du code demande une mise à jour du paquet.

Les versions locales sont destinées aux navigateurs de bureau. Une publication sur Chrome Web Store, Microsoft Edge Add-ons et Mozilla Add-ons permettra ensuite une installation depuis leurs boutiques respectives.
