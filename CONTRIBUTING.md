# Modifier la liste

Le fichier à mettre à jour est `liste/accounts.json`. Pour chaque compte, il faut son pseudo sans `@` et son identifiant X numérique, entre guillemets.

```json
{ "id": "217749896", "username": "MLP_officiel" }
```

L’identifiant sert à vérifier que le pseudo appartient toujours à la bonne personne. Un simple changement de pseudo ne doit pas faire bloquer un autre compte.

Avant une modification :

- Vérifier le profil public et le lien avec le périmètre de la liste.
- Ajouter la source et la date de vérification dans `liste/sources.json`.
- Augmenter la version du fichier, puis lancer `npm run validate:list`.

Pour une erreur dans la liste, ouvrir une issue avec le profil concerné et un lien permettant de vérifier la correction. Merci de ne pas y joindre de mot de passe, cookie, jeton ou capture contenant des informations privées.

Pour une modification du code, lancer `npm test` et `npm run test:browser`. Les tests restent sur des profils fictifs.
