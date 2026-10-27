# Fonctionnement avec X

L’extension utilise le compte déjà connecté dans le navigateur. Elle ne contient pas de jeton du compte MEYTRED, de clé serveur commune ni de mot de passe. MEYTRED gère uniquement la sélection éditoriale de la liste publique.

Le traitement vérifie le compte connecté, le pseudo et l’identifiant du profil ciblé avant de confirmer un blocage. Le même onglet sert à toute la liste. Les résultats sont mémorisés localement pour le compte X utilisé : cela évite de reparcourir les mêmes profils quand la liste s’agrandit.

Cette mémoire locale ne permet pas de savoir qu’un utilisateur a ensuite débloqué un profil directement dans X. **Tout revérifier**, dans la liste repliée du popup, permet de contrôler à nouveau tous les comptes.

## API officielle

Au 27 octobre 2026, la documentation de X réserve `POST /2/users/{id}/blocking` à l’offre Enterprise. Cet accès n’est pas disponible dans les offres en libre-service à l’usage. [Documentation de l’endpoint](https://docs.x.com/x-api/users/block-user).

Une extension à partager ne peut donc pas promettre un blocage instantané par cette API à chaque utilisateur. Cette version parcourt les contrôles de l’interface X avec la session propre à chaque navigateur. Elle n’utilise pas d’API privée et n’extrait pas les cookies ou les jetons de connexion.

## Rapidité et interruptions

La navigation interne évite de recharger X entre les profils. Les blocages restent confirmés un par un ; la mémoire locale réduit les traitements suivants. La durée réelle dépend des réponses de X et du nombre de nouveaux profils.

X peut imposer une connexion, une vérification ou une limitation temporaire. La progression est conservée lorsqu’une opération s’arrête. Multiplier les tentatives pendant une limitation peut prolonger le problème. Les [règles d’automatisation de X](https://help.x.com/en/rules-and-policies/x-automation) s’appliquent aussi à l’usage de son interface.
