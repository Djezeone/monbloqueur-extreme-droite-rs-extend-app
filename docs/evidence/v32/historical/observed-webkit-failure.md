# Observation WebKit de la première matrice

Transcription factuelle de la sortie de lecture de `docs/evidence/v32/webkit-test-pwa-concurrency.log` pendant cette session, avant ajout du témoin. Le fichier a ensuite été remplacé par les exécutions finales ; cette transcription **ne constitue pas une copie ni une empreinte du journal brut initial**. La sortie originale reste dans l'historique des appels de cette conversation.

- MoteurWebKit27.2, Linux, aucun appareil physique.
- Scénario `simultaneous clicks preserve both additions or explicitly refuse the losing writer` :FAIL.
- Lecture d'un troisième onglet : snapshot ne contenant que `qa_race_a`.
- VuesA etB : champs `handle` vides ; message de conflit dans les deux vues ; trace désactivée (`[]`).
- Assertion : `A refused write must keep the form`, attendu `qa_race_b`, obtenu chaîne vide.
- Bilan observé : `PWA concurrency: 3/4 scenarios passed.`

La répétition ciblée avec instrumentation passe1/1 ; elle ne démontre pas la cause interne. Le [RED déterministe](stale-read-red.log) conserve ensuite la preuve de la faiblesse des contrôles fondés sur une lecture périmée seule. Les résultats finaux du nouveau protocole sont dans les journaux hors de `historical/`. Aucune simple répétition verte n'a été prise pour une résolution de l'échec initial.
