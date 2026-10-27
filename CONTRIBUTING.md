# Proposer un compte ou une correction

Pour une demande d’ajout à la liste ou une erreur sur un compte, contacte **[@MEYTRED sur X](https://x.com/MEYTRED)**. Indique le lien du profil et une source publique permettant d’examiner la demande.

La liste officielle est gérée et modifiée uniquement par le propriétaire du dépôt, **LaRosette / MEYTRED**. Chaque ajout est validé par lui avant publication. Merci de passer par ce contact pour les demandes concernant la liste.

## Maintenance de la liste

Cette procédure est destinée au propriétaire du dépôt.

Le fichier à mettre à jour est `liste/accounts.json`. Pour chaque compte, il faut son pseudo sans `@` et son identifiant X numérique, entre guillemets.

```json
{ "id": "217749896", "username": "MLP_officiel" }
```

L’identifiant sert à vérifier que le pseudo appartient toujours à la bonne personne. Un simple changement de pseudo ne doit pas faire bloquer un autre compte.

Avant une modification :

- Vérifier le profil public et le lien avec le périmètre de la liste.
- Ajouter la source et la date de vérification dans `liste/sources.json`.
- Augmenter la version du fichier, puis lancer `npm run validate:list`.

Ne joins jamais de mot de passe, cookie, jeton ou capture contenant des informations privées à une demande.

## Contribuer au code

Pour une modification du code, lancer `npm test` et `npm run test:browser`. Les tests restent sur des profils fictifs.
