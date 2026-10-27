# Fiche Chrome Web Store à déposer

Nom : Bloquer l’Extrême-droite

Description courte : Un bouton pour bloquer sur X tous les profils d’une liste actualisée automatiquement.

Description détaillée :

Ouvrez l’extension et cliquez sur « Bloquer l’Extrême-droite ». Elle utilise votre compte X déjà connecté dans Chrome pour bloquer les profils de la liste éditoriale. Aucun mot de passe ni clé API à saisir.

La liste est publique, consultable et mise à jour à distance. Les ajouts ne déclenchent aucune action automatique : vous gardez la main en lançant le bouton. Le traitement réutilise un seul onglet en arrière-plan, sans changer l’onglet actif et sans créer de fenêtre séparée. Vous pouvez fermer le popup pendant le blocage, suivre sa progression et arrêter l’opération. Les comptes déjà bloqués restent bloqués. Le bilan distingue les comptes indisponibles.

L’extension ne collecte ni cookies, ni mots de passe, ni jetons d’accès. La progression reste dans votre navigateur. Aucun suivi d’audience.

L’interface X doit être en français ou en anglais. Le blocage passe par l’interface du site, dépend de sa structure et peut être interrompu par une vérification ou un changement de X. X interdit cette forme d’automatisation et peut restreindre un compte. Cette extension est indépendante de X Corp.

## Objectif unique

Appliquer aux comptes de la liste les blocages explicitement demandés par l’utilisateur sur son compte X.

## Justifications des permissions

- storage : conserver la liste et l’avancement afin de fermer le popup et reprendre une opération interrompue.
- alarms : conserver une reprise de la file si Chrome suspend le service worker.
- x.com et twitter.com : exécuter le script qui reconnaît le compte connecté, vérifie le profil et utilise les commandes visibles de blocage ; lire uniquement l’URL de l’onglet de travail. Aucun accès aux cookies ou mots de passe, ni permission générale de lecture des onglets.
- raw.githubusercontent.com : télécharger le fichier JSON public des comptes.

Code distant : non. Les ressources distantes sont uniquement des données JSON validées ; aucun eval, script chargé à distance ou interpréteur de commandes.

## Données

L’extension traite localement le nom public du compte connecté, la liste et la progression ; elle transmet à X uniquement les actions de blocage via le site. GitHub reçoit la requête de téléchargement de la liste. Aucune télémétrie n’est ajoutée. La politique publiée doit décrire ce traitement et identifier l’exploitant avec un moyen de contact. Le dépôt public permet de signaler une correction.

## Vérification de la fiche

Joindre une capture réelle de la version finale sur un compte de test, une icône de 128 px et la page de confidentialité publique. Ne pas utiliser les captures de simulation comme preuve de fonctionnement sur un compte X réel. La version locale a été testée sur des pages reproduisant les contrôles observés de X ; une validation réelle et l’examen du Store restent distincts.
