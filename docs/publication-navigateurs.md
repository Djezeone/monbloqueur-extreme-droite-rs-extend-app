# Distribuer les trois versions

Les ZIP sont préparés par `npm run build`. Les versions destinées au partage sont publiées dans [GitHub Releases](https://github.com/LaRosette/bloquer-extreme-droite-x/releases), avec leurs empreintes SHA-256. Le processus est décrit dans [distribution.md](distribution.md).

## Chrome

Le paquet à déposer sur le Chrome Web Store est `dist/extension-chrome.zip`. Le texte de la fiche et les permissions sont détaillés dans [publication-chrome.md](publication-chrome.md).

## Edge

Le paquet est `dist/extension-edge.zip`. La fiche peut reprendre le même texte en remplaçant Chrome par Edge. Le dépôt se fait depuis le tableau de bord [Microsoft Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge/overview).

## Firefox

Le paquet est `dist/extension-firefox.zip`. Il utilise un script de fond en module, l’API native `browser` et un identifiant Firefox fixe. Firefox 142 ou plus récent est nécessaire. La déclaration de collecte de données est réglée sur `none` : pas de télémétrie ni de collecte par l’éditeur.

Firefox exige une signature Mozilla pour conserver une extension sur sa version habituelle. Le ZIP du dépôt est destiné au chargement temporaire, pas à une installation permanente.

Le propriétaire peut envoyer le ZIP sur [Mozilla Add-ons](https://addons.mozilla.org/developers/addon/submit/distribution), soit pour une publication dans la boutique, soit pour une distribution signée hors boutique. Après validation, il faut proposer le fichier XPI signé au téléchargement et remplacer les instructions temporaires du guide.

Les étapes de signature sont décrites dans la [documentation Mozilla](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/). Les comptes développeur, les accords des boutiques et la validation finale restent à la charge de l’éditeur.

## Avant une publication

Utiliser une vraie capture du paquet final sur un compte de test, vérifier les informations de confidentialité et fournir un contact. Les tests du dépôt utilisent des profils fictifs ; leurs captures illustrent l’interface sans attester d’un blocage sur X réel.
