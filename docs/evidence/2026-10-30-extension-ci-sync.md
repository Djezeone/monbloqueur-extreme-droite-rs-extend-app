# Synchronisation du test extension — FIL CLAIR

30 octobre2026, Europe/Paris. Base 998e05372e01e3bab25d9539591fe05369e76b24, PR6 draft. Journal avant nouvelle CI ; A SAFE/B CONNECT/C PUBLIC non livrées.

## Fait

[CI PWA40986303042](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/actions/runs/40986303042) : success, tentative1. Le journal de272767caractères a été lu :232/232Node,9/9SW et audit14modules,36scripts navigateur (12×3),24/24nouveauxcas par moteur (72), V3 15/15 et V3.2 14/14 par moteur, journal10/10 par moteur. Les marqueurs offline montrent arrêt du serveur, navigateur hors ligne et rechargement effectué dans les trois moteurs. Ce résultat confirme la recette au998, sans transformer l'hypothèse TCP de l'ancien arrêt en preuve d'une cause unique.

[CI extension40986302996](https://github.com/Djezeone/monbloqueur-extreme-droite-rs-extend-app/actions/runs/40986302996) : failure, tentative1 ;232Node passent, build et lint passent, puis test-browser.mjs:258 lit false au premier échantillon de l'onglet. Les18contrôles Firefox suivants n'ont pas été exécutés par ce run. Son log de67550caractères est conservé avec le succès PWA dans [les sorties](extension-ci-sync/README.md).

## Vérifié comment / changement

Le gestionnaire inspect dans extension/runner.js attend des lectures de stockage, chrome.tabs.get, chrome.tabs.update et windows.update. L'ancien test lisait immédiatement un état après le clic. Le contrat [Chrome Tabs](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-update) est asynchrone. L'interprétation d'une course de test est cohérente avec le code et l'observation ; elle ne remplace pas le verdict du prochain run.

Remplacement limité à l'assertion : expect.poll observe l'attribut active du tabId exact du job invalide en pause, dans la durée bornée du framework. Il exige toujours true. Aucune attente fixe, aucune modification de réponse, aucune acceptation d'un échec permanent, aucun changement du code extension/PWA/serveur, de dépendance ou de workflow. Les pages X de la recette sont des fixtures interceptées ; aucun compte réel n'est touché.

La copie du script modifiée avait passé node --check avant la perte de l'environnement. Le nouvel objet canonique est construit depuis le source GitHub998 par remplacement unique, puis son contenu UTF8 est relu et comparé exactement. Aucune comparaison à un nouvel arbre Git local n'est annoncée : le workspace est indisponible. La nouvelle attestation emploie les identifiants de blobs/arbres GitHub et borne les seuls chemins modifiés.

Le sous-agent runtime rapporte un Chrome complet156.0.8078.4 restauré depuis l'archive officielle (200345244octets, SHA25643fd31766c7533a02dda2ded5ad50c2f861cd5400be7509c0abad71129f79d79, taille/CRC/MD5 vérifiés), mais le lancement persistant échoue sur socket(PF_UNIX,SOCK_STREAM) EPERM. Aucun test applicatif extension local n'a exécuté ce parcours. Ensuite, l'environnement local entier est devenu indisponible. Pas de contournement d'isolation ni d'achat : qualification par les deux CI standards du dépôt public.

## Ouvert

Attendre et lire les deux CI du nouveau head, puis relire Airtable/PR/ref et les artefacts après fin. Les éventuels correctifs ou succès ne sont pas déduits des preuves du parent. Main/admin, VercelPro capacité gratuite/Login, preview au SHA, appareils physiques/WCAG complet, RGPD/décisions responsable, OAuth/serveur durable/révocation et exploitation restent ouverts. Aucun merge, déploiement, appel social réel ou dépense supplémentaire.

## Périmé

« PWA998 en cours » est remplacé par success après lecture du journal. « Extension998 en cours » devient failure, jamais succès. Les preuves plus anciennes230Node concernent leurs versions ;232Node et matrice complète PWA sont acquis au998 seulement. Le workspace local n'est plus une source de travail accessible ; GitHub reste la source de vérité. Aucun développement futur nouveau n'est programmé.
