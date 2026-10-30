# Protection du cycle des données locales

30 octobre 2026, Europe/Paris. Suite de PR #5 au `04454543f3df190f54f5fdacbccb82a413f901c0`, sans reconstruction des parcours V3.2. L'autonomie de développement et de tests est déjà autorisée par le mandat ; les choix ci-dessous sont ceux de l'implémentateur.

## Problèmes et résultat attendu

Une lecture de fichier ou de liste publique commencée avant un effacement, une restauration ou l'ouverture d'un espace temporaire peut terminer après le remplacement et ajouter les anciennes données dans le nouvel espace. La fin d'une sauvegarde lente vide également le champ d'un nouveau brouillon. Enfin, une déclaration orpheline acceptée pour compatibilité peut redevenir active au simple ajout du profil manquant, sans nouvelle déclaration.

Le remplacement réussi d'un espace périme les imports encore en lecture. Un remplacement annulé ou refusé ne les périme pas. Une sauvegarde ne doit vider que le formulaire qui correspond encore aux valeurs soumises ; elle ne doit pas déplacer le focus d'une personne ayant changé de tâche. Ajouter un profil absent crée un suivi à faire, sans réactiver son ancienne déclaration, tout en préservant les autres déclarations et l'historique.

## Approches et choix

- Bloquer toute navigation pendant les lectures/sauvegardes empêcherait la personne de préparer le choix suivant et n'offrirait pas de secours à une lecture lente.
- Purger les décisions orphelines dès l'import modifierait silencieusement les sauvegardes historiques.
- **Choix retenu :** génération locale de l'espace pour les continuations d'import, comparaison des valeurs des formulaires avant nettoyage et mutation pure d'ajout de profil retirant seulement la déclaration qui deviendrait active. Aucun nouveau stockage ni format de sauvegarde.

La génération n'est ni un verrou inter-onglets ni une preuve fournisseur. Web Locks, comparaison de source et témoin IndexedDB existants restent obligatoires. La génération change seulement dans `applyState(..., true)`, après remplacement réussi ; les mutations ordinaires ne changent pas d'espace. Un import périmé ne demande pas de confirmation de restauration et n'écrit rien. Son message est générique ; aucun contenu du fichier ni erreur de l'ancienne opération ne doit réapparaître dans le nouvel espace. Le nettoyage du sélecteur de fichier ne doit pas vider une sélection plus récente.

## Périmètre et limites

Modifier seulement le modèle local, les deux formulaires d'ajout et les continuations des imports. Incrémenter le shell SW pour distribuer les modules ensemble ; ajouter la recette à la CI existante. Aucun connecteur serveur/OAuth, paiement, transfert IA, inscription, changement de dépendance ou opération sociale. Pas d'effacement de données réelles par l'agent. La compatibilité des anciens exports est conservée.

Recette : tests Node du modèle et tests navigateur déterministes (vrai Web Lock ; `File.text`/réponse publique synthétique retenus par un verrou de test). Vérifier données persistées, état affiché, brouillon et focus, refus/annulation, remplacement de l'espace, absence de trafic personnel. Trois moteurs Linux si disponibles, distincts de Safari/Android/iOS physiques. Main, déploiement gratuit/provenance, appareils physiques, WCAG complet et décisions RGPD gardent leurs portes ouvertes. A/B/C ne sont pas déduites de ces correctifs.
