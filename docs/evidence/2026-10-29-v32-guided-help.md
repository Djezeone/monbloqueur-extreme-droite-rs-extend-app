# Session FIL CLAIR V3.2 — UX et soutien indépendant

Date :29octobre2026, Europe/Paris. **Instantané avant publication Git/CI V3.2 et clôture Airtable**. Les conclusions distantes finales au SHA exact seront consignées dans la PR et le cockpit ; elles ne sont pas anticipées par les tests locaux. Aucune mission de développement future n'est programmée automatiquement.

## Fait
- Reprise : mission complète relue, PR#2 draft au b3b0660 inchangée, main b7cd31b protected:false, rulesets=[] ; cockpit8lots/8portes relu. Baseline144/144, sans reconstruction V2/V3.
- Passe précédente close sur blocages précis avant V3.2 : administration GitHub absente ; Vercel3anciensdéploiements, facturation404 Plan not found, navigateur redirigé login sans connexion ni changement de plan. Aucun développement d'OAuth/d'opérations sociales n'était engagé. Deux recherches ont atteint la limite Work, sans achat ni recharge ; revue finale indépendante obtenue ensuite.
- Nouveau parcours facultatif Gérer une source : quatre étapes par boutons/listes/cases, nom libre ou exemple CNEWS sans identités associées, services facultatifs, contrôles réels et récapitulatif. Une seule sauvegarde de lot, dédoublonnage sans réinitialiser une déclaration. Aucun geste distant exécuté.
- FAQ gratuite13questions, choix d'appareil/recherche locale, aide contextuelle et reprise du parcours. Brouillons et recherches supprimés au remplacement réussi, conservés sur refus. Aucun fournisseur IA, voix ou compte imposé.
- Une seule entrée secondaire Soutenir FIL CLAIR, désactivée : aucune URL officielle fournie/validée. Configuration HTTPS revue, aucun domaine inventé, paiement, don, crypto, SDK financier, partage de session, donnée privée dans le lien ou ping automatique. Test externe uniquement synthétique, pas de vraie collecte.
- Correction du cache : styles/icônes natifs peuvent lire le précache public hors ligne ; auth/callback/API/query/origines tierces exclus, aucune réponse privée mise en cache. Shellv7,22URLpubliques. Notice et minimisation mises à jour, empreinte CSS CSP inchangée.
- Échec WebKit de concurrence observé ; répétition instrumentée non concluante sur la cause interne, puis RED déterministe par lecture périmée sans événements. Témoin SHA256 atomique IndexedDB avant écriture, sans copie du carnet, compensation sur quota, refus sûr après interruption ou indisponibilité. Ce n'est pas le journal durable d'opérations fournisseur. Les anciens onglets restent hors protocole : fermeture requise avant mise à jour/rollback.
- Revue indépendante :0Critical trouvé,1Important et1Minor. Ce dernier reclassé Important pour le risque de refaire une action déjà déclarée. Deux RED distincts, une passe de correction : gel du parcours pendant une sauvegarde lente et affichage du véritable état conservé d'un doublon. Aucune seconde revue ou approbation humaine revendiquée.
- Suite des huit lots organisée dans DELIVERY_QUEUE.md ; recherches officielles Mastodon/SDKBluesky relues, sans activation. Déploiements Git automatiques désactivés uniquement pour cette branche V3.2 dans les configurations racine/PWA ; aucune promotion/domaine/protection distante modifiée.

## Vérifié comment
[Reçu/empreintes et27journaux](v32/README.md), source locale0fafbfaa89406a2dcc28c680f30086989959c359. Les arbres Git distants seront comparés avant création de branche ; ce journal ne présume ni push ni CI.

| Contrôle final local | Résultat |
|---|---|
|Node|151/151,0échec|
|Sécurité/SW|9/9 + audit statiquePASS|
|Navigateurs|27suites,9scripts×3moteurs,exit0après revue|
|V3.2|14/14 chacun : parcours, Retour/annulation, aide, doublons/états, refus quota, local/offline, soutien inactif/URL synthétique/panne, effacement de brouillons et sauvegarde lente|
|Concurrence|6/6 chacun ; témoin indisponible/corrompu/interrompu et lectures périmées injectées|
|RégressionV3|15/15 chacun|
|Flux/qualité/remplacements|17/16/18 ;30/29/30 ;11/11 chacun|
|Accessibilité automatique|81scans,0violation détectée,69scans indéterminés ; pas de WCAG complet|
|Sauvegarde/restauration|Régression9 769 347octets/500préférences, remplacements et rawrecovery préservés|
|Drillloader|V2refuse, rawexactconservé, V3restaure ; pas de rollback fournisseur|
|Dépendances|0critical/high/moderate,3lowdev hérités ; seuilhighPASS|
|Liste/registre|162comptes valides ;14services/43contrôles synchronisés|

Chromium156.0.8078.4,Firefox157.0,WebKit27.2 surLinux. Les profils Android/iPhone/iPad et rendus sont émulés, sans certification physique/Safari commercial/installation/lecteur d'écran. Les captures ont été inspectées. Le test de texte espacé utilise CSSOM sans assouplir la CSP. Les tests attendent la fin observable des sauvegardes, pas un seul clic.

La première comparaison du drill utilisait des prototypes d'objets différents ; l'oracle final compare les octets JSON et la source brute, sans ignorer de champ. Un log WebKit initial n'a pas été archivé avant remplacement : transcription explicitement limitée, pas d'empreinte inventée. Les RED conservés et traces sont exclus des résultats finaux.

## Ouvert
|Lot|Statut exact|Réserve|
|---|---|---|
|01Sécurité/CI|Bloqué pour sortie|main non protégée/admin absent ; CI nouvelle à lire après push, sécurité du nouveau déploiement non qualifiée|
|02UX/PWA|En revue|Interface locale testée ; appareils physiques, installations, Safari commercial, VoiceOver/TalkBack et WCAG complet ouverts|
|03Listes/historique|En revue|Lot/backup/concurrence éprouvés pour versions coopérantes ; interruption peut bloquer la cohérence, récupération explicite, ancien écrivain/downgrade non certifié|
|04Connecteursofficiels|En revue du socle inactif|OAuth/serveur/SDK/transport/scopes/identité/comptes test/révocation réels à qualifier|
|05Orchestration|En revue du socle inactif|Journal/coordination durable fournisseur et reprise lecture seule toujours à construire ; témoin local distinct|
|06RGPD|Bloqué|Responsable/contact, bases légales/article9/AIPD, contrats/rétention/transferts et hébergement effectif non arrêtés|
|07QA|En revue|Preuves automatisées locales, CI distante à confirmer ; physique/WCAG/OAuth réel/audit externe ouverts|
|08Release/opérations|Bloqué/No-Go|Pas de déploiement courant ; gratuitéVercel non établie, support/rollback fournisseur/Go public absents. Soutien facultatif désactivé sans destination officielle|

**A SAFE, B CONNECT, C PUBLIC : non livrées.** Aucune fusion main, connexion/action sociale, signalement, achat, abonnement ou publication générale. Quota GitHub déjà identifié : alerte officielle du16/10 pour3000/3000minutes Actions incluses, reset annoncé01/11, compteur live non accessible. Dépôt public et runners standards ubuntu-latest gratuits relus sur GitHub Docs ; seulement les deux workflows existants prévus, sans upload/cache Actions, Copilot ou agent GitHub.

## Périmé
- Une application utilisable hors ligne sans vérifier les styles ne prouve pas un affichage hors ligne complet ; le défaut observé est corrigé et testé à partir deV3.2.
- WebLocks+lecture locale seuls ne suffisent plus à qualifier la concurrence face à une lecture périmée. Les anciennes réussites restent celles de leur SHA ; nouveau protocole et six scénarios requis.
- Ancien récapitulatif déclarant À faire pour tout doublon et navigation modifiable pendant sauvegarde ne décrivent plus la version corrigée.
- Les anciennes versions Vercel7348dbe0/ee515c17 ne prouvent pas laV3.2. Les chiffres144/24suites/V3antérieurs ne qualifient pas la présente recette.
- Financement interne exclu : toute intention d'ajouter paiement/don/crypto ou connecteur financier dans FIL CLAIR est remplacée par l'unique lien externe désactivé en attente de preuve.

Références : [UX/architecture](../UNIVERSAL_UX_V32.md), [persistance](../LOCAL_PERSISTENCE.md), [ordre d'exécution](../DELIVERY_QUEUE.md), [revue](2026-10-29-v32-review.md), [API](../research/2026-10-29-connect-auth-next.md), [mission](../WORK_MISSION_FIL_CLAIR.md), [Airtable](https://airtable.com/appXkTDooEjMD9lCs).
## Suivi de la première CI — fixture WebKit

La première CI PWA [40833424238](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/actions/runs/40833424238), au153a0d2, a **échoué** sur le dernier scénario WebKit : le mock de verrou retardé n'était plus observé (`typeof qaResumeSave` restaitundefined). Les logs ont été lus ; les autres scénarios passaient. L'extension40833424276 a réussi. Zéro artefact dans ces deux runs. La porte courante Parcours critiques a été suspendue dans Airtable ; la validation historiqueV3 demeure à son SHA.

Cause de fixture reproduite : WebKit peut collecter un wrapper DOM LockManager sans référence JavaScript forte et perdre sa propriété de mock. Un probe avec GC forcé a observé mock absent sans référence forte, présent avec référence forte. Le test complet avec `page.requestGC()` a reproduit le RED. Correction **du test seulement** : conserver le LockManager sur une référence forte du contexte de test et forcer explicitement le GC avant le scénario. Aucun fichier PWA ni réglage utilisateur ne change. Les3suitesV3.2 retestées passent14/14 chacune, Node151/151 ; les24autres scripts et sources produit sont inchangés.

La correction et le reçu sont regroupés avant une seule mise à jour de branche. Aucune relance de la CI au même SHA ni seconde revue n'est présentée comme preuve. La nouvelle CI au nouveau SHA reste à lire ; sa conclusion sera consignée dans la PR/cockpit. Le [RED GC](v32/historical/webkit-gc-red.log) est conservé. L'échec initial n'est pas effacé.
