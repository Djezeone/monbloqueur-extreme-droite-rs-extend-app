# Preuves serveur du30octobre2026

Les15logs et76sources sont empreintés dans receipt.json. Jeton/identités synthétiques seulement ; aucune clé/certificat privé n'est committé. Les tests TLS éphémères restent sur loopback ; aucun compte réel ni déploiement n'est qualifié.

| Logs | Portée exacte |
|---|---|
|baseline.log|183/183tests à la base42a70ca.|
|policy-red.log / policy-green.log|17groupes RED→GREEN, politique pure sans réseau.|
|transport-red.log / transport-first-green.log|18groupes RED→GREEN avant/avec implémentation.|
|transport-qualified.log|24/24, six couvertures additionnelles sans bug inventé.|
|node-qualified.log|État pré-revue224/224, distinct du résultat final.|
|review-red.log / review-green.log|Deux régressions de délai RED puis26/26GREEN.|
|node-final.log|226/226,0échec.|
|security-final.log|9/9SW, audit et14imports du shell sans connecteur.|
|fetch-inspection.log|Node/Undici etSHA du module embarqué, branche421 observée ; aucun source/token divulgué.|
|dependencies.log|Audit seuilhigh exit0 ;3lowdev héritées.|
|register.log / list.log|Registre14services/43contrôles et liste162valides.|

Les résultats CI/PR/Airtable postérieurs au push seront clôturés dans la PR et le cockpit ; ces fichiers restent l'instantané local. Les limites OAuth/driver/IPv6/stockage et décisions de revue sont dans les documents associés.
