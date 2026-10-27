# Versions et téléchargements

Les trois navigateurs ont chacun leur ZIP sur la [page des versions](https://github.com/LaRosette/bloquer-extreme-droite-x/releases). Les liens du README pointent vers la dernière version publique. Les fichiers `SHA256SUMS.txt` et `extension-*.zip.sha256` permettent de vérifier les paquets téléchargés.

## Publier une version

1. Mettre le même numéro de version dans `extension/manifest.json` et `package.json`.
2. Mettre à jour le changelog et vérifier les changements sur un compte de test.
3. Lancer les vérifications puis préparer les paquets :

```sh
npm ci
npm test
npm run validate:list
npm run build
npm run lint:firefox
node scripts/release.mjs
```

`scripts/release.mjs` vérifie le contenu exact de chaque ZIP, le manifeste adapté au navigateur, la version et l’empreinte de chaque paquet. Les fichiers prêts à publier sont dans `dist/releases/vVERSION/`. Le script refuse un paquet périmé ou contenant des fichiers supplémentaires.

4. Publier les changements sur `main`, puis créer et pousser le tag correspondant, par exemple `v2.3.0` pour la version `2.3.0`.
5. Le workflow [Publier une version](../.github/workflows/release.yml) refait les vérifications dans GitHub Actions et crée la release avec les trois ZIP et leurs empreintes.

La même opération peut être lancée depuis GitHub : **Actions → Publier une version → Run workflow**, choisir `main` et renseigner le tag correspondant au manifeste. Le workflow utilise le commit précis sélectionné au lancement, même si la branche avance entre-temps. Il crée explicitement le tag si nécessaire et refuse un tag existant qui pointe vers un autre commit, sans le déplacer. Il crée ensuite un brouillon, transfère les fichiers et vérifie à nouveau la cible avant publication. Un échec du transfert laisse le brouillon privé ; aucune version partielle ne devient la dernière version publique. Le tag créé reste présent pour permettre le diagnostic.

La tâche de préparation ne peut pas écrire dans le dépôt. Seule la tâche de publication dispose du droit de créer le tag et la release. Une release existante, même en brouillon, n’est pas remplacée. Après un transfert interrompu, son brouillon peut être supprimé avant de relancer la même version ; une version déjà publiée demande un nouveau numéro pour corriger son code. Cela conserve les anciens paquets et leurs compteurs.

Une modification de la liste de comptes ne nécessite pas de publier une nouvelle version de l’extension.

## Les compteurs

GitHub fournit un champ `download_count` pour chaque fichier joint à une release. Les badges du README affichent séparément le cumul des téléchargements de `extension-chrome.zip`, `extension-edge.zip` et `extension-firefox.zip`. Les empreintes SHA-256 et les archives de sources ne sont pas comptées dans ces badges.

Le compteur mesure des téléchargements de fichiers : une personne peut télécharger plusieurs fois le même paquet. Il ne permet pas de connaître le nombre d’installations ou d’utilisateurs actifs. Il commence avec les releases ; GitHub ne fournit pas de compteur public pour les anciens ZIP servis par les liens `raw.githubusercontent.com`.

Les badges sont servis par Shields.io à partir des compteurs publics de GitHub. Leur affichage peut avoir quelques minutes de retard. L’extension n’envoie aucune statistique, aucun identifiant et aucun événement de blocage à ce service.

Pour examiner les chiffres d’origine, consulter [l’API publique des releases](https://api.github.com/repos/LaRosette/bloquer-extreme-droite-x/releases?per_page=100) : chaque entrée `assets` contient le nom du fichier et son `download_count`. Les valeurs des badges peuvent aussi être vérifiées sur les [pages des releases](https://github.com/LaRosette/bloquer-extreme-droite-x/releases).

Références : [API GitHub des releases](https://docs.github.com/en/rest/releases/releases), [badge de téléchargement d’un fichier sur toutes les versions](https://shields.io/badges/git-hub-downloads-specific-asset-all-releases).

## Firefox et les boutiques

Le ZIP Firefox local reste non signé. Il se charge temporairement dans Firefox ; une distribution permanente nécessite la signature Mozilla. La création d’une release GitHub ne publie pas automatiquement l’extension sur les boutiques des navigateurs. Les étapes correspondantes sont dans [publication-navigateurs.md](publication-navigateurs.md).
