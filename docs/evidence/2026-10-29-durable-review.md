# Revue du socle durable — 29 octobre2026

Relecteur indépendant gpt-6-astra/high, contexte neuf, lecture seule sur839049a..f998b0f. Aucun sous-agent de revue supplémentaire. Il a lu toute la différence, conception/plan, code et scripts, exécuté178/178Node et9/9SW avec audit statique. Il n'a pas réexécuté les navigateurs et n'a consulté aucun service externe. **Aucun Critical, deux Important et un Minor ; corrections par l'auteur, une passe RED→GREEN, pas de seconde revue.**

| Constat | Effet et décision | Preuve du correctif |
|---|---|---|
|Important : recover ignore cooldown et arrêt d'authentification|Des GET authentifiés pouvaient repartir pendant une pause ou après401/403/identité incohérente. Barrières mémoire et persistées avant lecture,429 de récupération conservé.|Tests Node de pause partielle,429 en récupération et401/403/identité ; scénarios navigateur pause et401 après recharge.|
|Important : échec persistant du journal efface la connaissance d'un effet accepté|Après une suppression acceptée, retour accepted:null/changed:false trompeur. Conserver accepted:true/changed:true connus, sans confirmed/evidence.|Deux régressions Node, abort persistant IndexedDB après première suppression ; une seule suppression et checkpoint sending conservé.|
|Minor : erreur fournisseur nommée erreur de journal|Reclassé Important : mauvais diagnostic pouvant inciter à effacer des données. Corrigé avec la première barrière ; raisons bornées distinctes.|Le test401 exige session-stopped ; les erreurs de stockage restent journal-write-failed.|

RED réel avant correction : **5 échecs/20 tests Node**, et **3 échecs/14 scénarios Chromium**. Après correction :20/20Node et14/14 par moteur, puis suite complète183/183. L'expiration pendant le deuxième checkpoint Bluesky était déjà correctement gérée : couverture ajoutée, aucun bug de ce cas inventé. Aucun Minor différé.

## Périmètres que le relecteur a refusé de qualifier et décisions
- OAuth/fournisseurs réels : identités/transports synthétiques ; porte B conservée.
- Panne matérielle, éviction et arrêt OS brutal : durabilité physique non établie ; aucune garantie élargie à ces cas.
- Modification malveillante de même origine : frontière de confiance explicite ; schéma strict ≠ signature.
- Export/effacement/rétention/révocation/déverrouillage : absents de ce module inactif, requis avant activation ; pas de raccourci par effacement conseillé.
- Déploiement/coût/main/CI distante : à vérifier séparément par le coordinateur ; configuration seule ne prouve pas état distant.
- UX complète/appareils/accessibilité : hors cette revue ; non-régression locale de trois moteurs par le coordinateur, recette physique/WCAG entière toujours ouverte.

Ces décisions maintiennent les risques visibles. La revue autorise une PR de développement inactive, ne certifie ni fusion, ni production, ni livraison A/B/C.
