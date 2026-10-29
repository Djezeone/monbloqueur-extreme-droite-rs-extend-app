# Preuves locales V3.2

Date29octobre2026, Europe/Paris. [Reçu machine](receipt.json) :69empreintes source,27journaux de suites et empreintes des vérifications supplémentaires. Les octets source correspondent au commit local0fafbfaa89406a2dcc28c680f30086989959c359 ; un commit documentaire et la création d'objets Git distants peuvent changer le SHA sans changer ces fichiers. La PR finale conserve la correspondance d'arbres/commits et les résultats CI distants, sans être anticipés ici.

- [Node](node.log) :151/151 ; [sécurité/SW](security.log) :9/9 et invariants statiquesPASS.
- [Dépendances](dependencies.log) :0critical/high/moderate,3low de développement hérités ; seuil high passé, aucune mise à jour forcée.
- [Liste](list.log) :162comptes publics valides ; [registre](register-sync.log) :14services/43contrôles synchronisés.
- 9 scripts ×3moteurs =**27exécutions finales**, toutes exit0 : E2E, stockage, récupération, concurrence, qualité, flux, remplacements, V3 et V3.2. Chaque fichier porte le préfixe chromium/firefox/webkit et le nom du script.
- V3.2 :**14/14 par moteur**, y compris enregistrement lent de la revue et état conservé des doublons. Concurrence :**6/6 chacun**, y compris lecture périmée injectée et témoin indisponible/corrompu/interrompu. V3 :15/15 chacun ; flux17/16/18 ; remplacements11/11 chacun ; qualité30/29/30.
- **81scans axe,0violation détectée,69scans avec contrôles indéterminés** (contraste/dégradés ou éléments partiellement masqués). Les messages détaillés des nouveaux scans sont conservés. Aucun WCAG complet déduit.
- Hors ligne avec origine HTTP arrêtée : CSS, carnet, parcours et aide disponibles. Aucun nom cible envoyé dans un lien ; soutien réel non configuré, URL `.example` uniquement interceptée dans un contexte synthétique. Test de panne externe sans données du carnet/cookie/référent ajouté par l'application.
- [Drill des loaders](rollback-loader.log) : refus V2 et source brute intacte, restauration par V3 ; périmètre limité aux fonctions pures. Pas de rollback Vercel ou de downgrade compatible.

Chromium156.0.8078.4,Firefox157.0,WebKit27.2 sous Linux. Contextes tactiles/OS émulés et vues320/390/1280px ; **aucun appareil physique, Safari commercial, VoiceOver/TalkBack ou installation OS certifiés**. Les deux captures sont des rendus Chromium synthétiques390×844, sans déploiement : [accueil](home-390.png), [parcours](guided-390.png).

Les archives des trois moteurs ont été retéléchargées depuis leurs URLs officielles, SHA256 identiques au [reçu d'environnement](../../research/2026-10-29-browser-environment.md), CRCZIP vérifié avant extraction.22bibliothèques Ubuntu extraites seulement, avec SHA256 comparés aux octets précédemment qualifiés depuis index signés. Pas de nouvelle installation système, dépendance npm, service payant ou qualification d'appareil. Le téléchargement CDN initial tronqué a été refusé ; aucune archive corrompue n'a été utilisée.

`historical/` conserve les RED ciblés : cache/styles offline, quota Firefox, lectures périmées, texte200% et deux écarts de revue. Ils sont exclus des compteurs finaux. Le premier échec WebKit réel est une transcription explicitement limitée, le journal brut ayant été remplacé ; le RED déterministe est conservé intégralement. Aucun succès n'est déduit d'une répétition ou d'un log vide.
