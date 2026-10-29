# Journal local des opérations fournisseur — socle B CONNECT

29 octobre2026. **Modules isolés, non activés dans la PWA.** Aucun compte, token, session OAuth, serveur, écriture sociale ni synchronisation réelle n'est créé par ce chantier. Les tests emploient uniquement des identités synthétiques et des transports simulés ; les transactions IndexedDB sont réelles.

## Fonctionnement réalisé
`pwa/connectors/operation-journal.js` crée, à la demande d'un appelant de confiance, la base locale `fil-clair-operations-v1` / store `lanes`. Une voie correspond à fournisseur/compte/origine HTTPS, pas à une cible isolée. Une seule opération par voie ;128voies maximum,100points d'envoi maximum par opération. Une CAS transactionnelle attribue une révision croissante et n'est acquittée qu'à l'événement `complete`. Le mode de durabilité demandé et vérifié est `strict` ; refus si indisponible. Délai5000ms par défaut, sans repli en mémoire.

Le checkpoint contient la cible normalisée, l'action, un identifiant d'opération aléatoire, des dates, un compteur, une phase et une raison bornée. Aucun consentement, preuve de confirmation, secret, corps de réponse ou message fournisseur n'y est sauvegardé. `read` ne rend jamais une autorisation d'agir ; `compareAndSet` n'est pas un import. Le tuple stocké doit correspondre à sa clé. Les schémas inconnus ou altérés sont refusés, sans effacement automatique.

Le nouvel exécuteur `durable-orchestration.js` réserve `prepared` avant toute lecture authentifiée. Les adaptateurs attendent maintenant un point d'arrêt asynchrone avant chaque POST. L'état `sending` doit être committé avant cet envoi, y compris avant chaque suppression Bluesky avec CID. Le consentement est revérifié après l'attente. Deux onglets concurrents ne peuvent pas gagner la même réservation ; un ancien prepared repris par un autre exécuteur perd sa CAS avant d'envoyer.

Une exécution peut rendre une confirmation actuelle seulement après les réponses attendues, l'identité/lecture de contrôle fraîches et la clôture du checkpoint. Après rechargement, même un checkpoint `closed` reste une métadonnée locale, avec `confirmed:false` et `evidence:null`. L'interface d'exécution actuelle et les exports V3.2 ne sont pas modifiés.

## Résultats incertains et reprise
Timeout, résultat incohérent ou effet partiel après un envoi possible : quarantaine de **toute la voie**, y compris une autre cible ou une action inverse. Aucune expiration de verrou, nouvelle page ou nouveau ticket ne lève cette interdiction.

`recover()` ne reprend aucune écriture. Il peut fermer un prepared sans envoi, ou observer un sending/quarantined en lecture seule. Une observation conforme ne prouve ni la fin ni l'absence d'une ancienne requête encore en vol : elle reste séparée de la confirmation historique et ne libère pas la voie. La réponse429 déterministe conserve un cooldown durable ; son expiration ne déclenche aucune requête.401/403/identité incohérente arrêtent le runner et la voie ; aucune fonction de déverrouillage/effacement improvisée n'est exposée.

## Limites avant activation
- Les dépendances journal/transport et le code de même origine sont de confiance ; la validation de schéma ne constitue pas une signature contre une modification malveillante valide d'IndexedDB.
- La demande `strict` est une indication de durabilité du navigateur, pas une garantie de stockage matériel. Suppression/éviction du stockage, panne de courant et processus OS brutalement arrêté ne sont pas qualifiés par ces tests. Un ancien écrivain ignorant le journal n'est pas couvert.
- Une interruption entre checkpoint et envoi peut bloquer une opération jamais transmise. La quarantaine est conservatrice. Sa sortie nécessite une future procédure qualifiée ; ni import, relecture ni effacement de données conseillé comme raccourci.
- Avant toute activation : cycle OAuth/serveur/secrets/scopes/transport sans rejeu, comptes et cibles de test autorisés, renouvellement/révocation, récupération des voies arrêtées, information utilisateur, export/effacement de ces données sensibles, rétention et compatibilité des versions. Ces fonctions ne sont pas réalisées par ce journal.
- L'ancien orchestrateur mémoire reste disponible pour ses tests historiques ; sa réconciliation n'est pas la politique du nouvel exécuteur durable. Il n'est pas rendu accessible dans l'application.

## Sources et preuves
[IndexedDB3.0, transactions et durabilité](https://www.w3.org/TR/2026/WD-IndexedDB-3-20261029/) ; [recherche OAuth/SDK](research/2026-10-29-connect-auth-next.md) ; [conception](superpowers/specs/2026-10-29-durable-operations-design.md) ; [plan et ledger](superpowers/plans/2026-10-29-durable-operations.md). Les résultats datés et limites figurent dans [le journal de session](evidence/2026-10-29-durable-operations.md). Aucun test synthétique ne qualifie une API ou un appareil réel.
