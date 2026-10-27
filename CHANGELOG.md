# Changements

## 2.3.0

- Nouveau popup, suivi du compte connecté et bilan détaillé.
- Les profils déjà traités sont mémorisés par compte ; « Tout revérifier » relance une vérification complète.
- Reprise bornée après un chargement en échec, avec attente explicite quand X limite les requêtes.
- Contrôle de l’identité dans l’en-tête du profil et prise en charge des comptes sans publications.
- Versions téléchargeables dans GitHub Releases, avec compteurs par navigateur et empreintes SHA-256.

## 2.2.0

- Versions Firefox et Edge, avec un paquet par navigateur.
- Guide d’installation commun.
- Navigation interne dans X pour éviter de recharger le site entre chaque profil.
- Tableau des comptes dans le README, actualisé à partir du fichier de liste.
- Liste élargie aux comptes demandés par MEYTRED.

## 2.1.0

- Le même onglet sert à toute la liste et aux reprises, sans ouverture de fenêtre séparée.
- La pause entre profils passe de 2,5 secondes à 250 ms.
- Le traitement réagit dès que les contrôles de X sont disponibles, sans attendre la fin du chargement de la page.
- Le bouton « Vérifier X » permet d’ouvrir l’onglet lorsqu’une intervention est nécessaire.

## 2.0.0

Première version avec un bouton de blocage et une liste de comptes mise à jour depuis GitHub, sans configuration d’API côté utilisateur.
