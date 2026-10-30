# Revue indépendante — cycle des données locales

30octobre2026, Europe/Paris. Relecteur `local_lifecycle_review`, contexte neuf, lecture seule, gpt-6-astra/high. Base0445454→commit local97bf93f ;18fichiers, conception/plan et chemins voisins inspectés. Aucune mutation du dépôt ni opération distante par le relecteur. La revue ne certifie pas la production.

## Constat et passe corrective unique

0Critical,0Important,1Minor selon le relecteur. L'ajout normalisé et ciblé, la génération après succès, les gardes d'E/S, la comparaison de l'objet File, le protocole et le shell ont été examinés. Un diagnostic Chromium156 sans requête externe confirme : pendant une sauvegarde de flux sous Web Lock, déplacer le focus vers `flow-platform` sans changer sa valeur ; après libération, il revient à `flow-target`.

**Ruling de l'implémentateur : Important**, car la personne a choisi la position de son prochain geste clavier. La redirection peut envoyer sa frappe dans un autre champ ; aucune perte de données observée n'est extrapolée. Le correctif ne focalise que si le focus reste sur l'entrée ou le bouton d'envoi original. Test avec trois Shift+Tab réels :1FAIL/1 avant correction, puis inclus dans la recette finale des trois moteurs. Aucun second relecteur ni deuxième passe de revue.

Le relecteur recommande aussi de couvrir séparément le rejet de `File.text()` et le corps public retardé après réception des en-têtes. Deux tests de frontière ont été exécutés sur la PWA exportée exactement du commit de base0445454 (nouveau driver de test seulement), puis sur le code courant. Le corps utilise une vraie Response/ReadableStream de navigateur ; le rejet simule une panne d'E/S. Ils protègent les gardes catch/après-body existantes, sans ajouter de voie réseau ou de production.

Vérification propre du relecteur : diagnostic ciblé Chromium et `git diff --check` ; il n'a pas réexécuté les230Node,9SW,63cas initiaux ni la matrice large. Ces résultats restent ceux des sorties de l'implémentateur. Voir le [journal](2026-10-30-local-data-lifecycle.md) et les fichiers de preuve pour les résultats finals.

## Points non jugés par la revue et décisions de l'implémentateur

| Hors verdict du relecteur | Décision / vérification de l'implémentateur | Coût si une conclusion erronée était admise |
|---|---|---|
|CI exacte et matrice36scripts|À lire après push, sans l'inférer des tests locaux ; PR reste draft|Régression non détectée ; aucune fusion permise|
|Trois scripts locaux interrompus|Aucun verdict, logs incomplets conservés ; ne pas répéter les16terminés|Fausse qualification locale|
|Protections/admin/PR/Airtable|Lecture distante et readback séparés ; main non protégée, droits admin absents|Branche ou cockpit présentés à tort comme sécurisés|
|Vercel/coût/provenance/en-têtes/offline/rollback|Config inspectée ;Pro connu, capacité gratuite non établie, aucun déploiement lancé|Frais ou publication non autorisés ; No-Go maintenu|
|Physiques/OS/Safari/lecteurs d'écran/WCAG|Tests Linux identifiés ; recette complète reste ouverte|Promesse de compatibilité/accessibilité non démontrée|
|API/OAuth/permissions/révocation/serveur réel|Connecteurs inactifs, pas de tests sociaux autorisés ni de route déployée|Écriture sociale ou fausse confirmation ; activation interdite|
|RGPD/article9/AIPD/contrats/rétention|Décisions du responsable toujours ouvertes, pas d'approbation juridique déduite|Traitement sensible non qualifié ; public interdit|
|Support/supervision/reprise/incident|Aucun environnement opérationnel exercé ; portes maintenues|Reprise ou assistance indisponible au lancement|
|Vulnérabilités/provenance runtime|Audit actuel séparé :3lowdev/0highcritical ; archives et20paquets/index signés tracés, pas de test physique|Confiance indue dans dépendances ou environnement|
|CrashOS/éviction/privé/versions mixtes/écrivains externes/sync|Limites existantes reconduites ; aucun résultat ajouté|Perte de données hors protocole ; sauvegardes restent nécessaires|
|Sécurité globale inchangée serveur/extension/opérations|Revue limitée au diff et voisins ; tests/CI ne remplacent pas un audit global|Garantie de sécurité excessive|
|Affirmations historiques externes|États actuels GitHub/Vercel/cockpit relus ; quota historique16/10 daté, compteur actuel inconnu|Information périmée présentée comme actuelle|

Ruling d'organisation : un commit d'implémentation regroupe les deux tâches partageant app/shell, puis le correctif de focus et les preuves sont séparés. Coût : cherry-pick du premier commit plus large ; pas de migration ni d'opération supplémentaire. Aucune suggestion mineure laissée silencieusement en attente ; le point focus est traité, les deux frontières sont testées. Verdict technique : adapté à une PR draft/CI, **aucune approbation de fusion ou livraison A/B/C**.
