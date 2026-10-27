# Bloquer l’extrême-droite

Une petite extension pour Chrome, Firefox et Edge pour bloquer les comptes d’une liste sur X. On ouvre l’extension, on clique sur **Bloquer l’Extrême-droite**, et elle s’occupe du reste avec la session X déjà connectée.

Un seul onglet de travail est ouvert dans la fenêtre courante, sans changer l’onglet actif. Il sert à toute la liste, reste disponible si le traitement s’arrête et se ferme à la fin. Pas de clé API à renseigner.

## L’installer

Choisis le paquet de ton navigateur :

| Navigateur | Télécharger                                              | Installation                                                      |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| Chrome     | [Version Chrome](https://raw.githubusercontent.com/LaRosette/bloquer-extreme-droite-x/main/downloads/extension-chrome.zip)   | Décompresser, puis charger le dossier dans `chrome://extensions`. |
| Edge       | [Version Edge](https://raw.githubusercontent.com/LaRosette/bloquer-extreme-droite-x/main/downloads/extension-edge.zip)       | Décompresser, puis charger le dossier dans `edge://extensions`.   |
| Firefox    | [Version Firefox](https://raw.githubusercontent.com/LaRosette/bloquer-extreme-droite-x/main/downloads/extension-firefox.zip) | Charger le ZIP dans `about:debugging#/runtime/this-firefox`.      |

Les étapes détaillées sont dans le [guide d’installation](INSTALLATION.md). Les extensions ne sont pas encore publiées dans les boutiques. Sur Firefox, le chargement est temporaire jusqu’au redémarrage ; une installation permanente demandera la signature Mozilla.

## La liste

Les comptes sont dans [`liste/accounts.json`](liste/accounts.json). Le fichier est récupéré au lancement : les modifications de la liste ne demandent pas de réinstaller l’extension. Un traitement déjà lancé garde sa propre copie jusqu’à la fin.

La liste reprend les comptes choisis par MEYTRED ainsi que les comptes officiels de partis déjà retenus. Elle n’est pas exhaustive. Les identifiants et les sources sont dans [`liste/sources.json`](liste/sources.json).

### Proposer un compte

La liste est gérée uniquement par **[MEYTRED sur X](https://x.com/MEYTRED)**. Pour demander l’ajout d’un compte ou signaler une erreur, contacte **[@MEYTRED](https://x.com/MEYTRED)** avec le lien du profil et les éléments qui justifient la demande.

Chaque demande est examinée avant un éventuel ajout. Seul le propriétaire du dépôt publie les modifications de la liste officielle ; les demandes ne sont jamais ajoutées automatiquement. Les comptes retenus seront pris en compte au prochain lancement du blocage, sans réinstaller l’extension.

Retirer un compte du fichier ne le débloque pas sur X.

### Comptes de la liste

<!-- comptes:debut -->
**162 comptes** · liste 2026-10-27.5

Ce tableau suit la liste de l’extension. Les blocages de chaque utilisateur restent privés.

| A – C | C – G | G – L | M – R | R – Z |
| :--- | :--- | :--- | :--- | :--- |
| [@A_Dutremble](https://x.com/A_Dutremble) | [@C_Szczurek](https://x.com/C_Szczurek) | [@Guillaume_Bigot](https://x.com/Guillaume_Bigot) | [@M_Dauchy](https://x.com/M_Dauchy) | [@RNational_off](https://x.com/RNational_off) |
| [@A_Masson06](https://x.com/A_Masson06) | [@CathRimbert84](https://x.com/CathRimbert84) | [@guillaumefl59](https://x.com/guillaumefl59) | [@MalikaSorel](https://x.com/MalikaSorel) | [@RomainTonussi](https://x.com/RomainTonussi) |
| [@Al_Nikolic](https://x.com/Al_Nikolic) | [@CColombier_RN](https://x.com/CColombier_RN) | [@HdeLepinau](https://x.com/HdeLepinau) | [@MAndrouet](https://x.com/MAndrouet) | [@RoullaudBeatric](https://x.com/RoullaudBeatric) |
| [@AlexandreDfss](https://x.com/AlexandreDfss) | [@Cengrand_](https://x.com/Cengrand_) | [@HeleneLaporteRN](https://x.com/HeleneLaporteRN) | [@MarcDeFleurian](https://x.com/MarcDeFleurian) | [@RTolassy](https://x.com/RTolassy) |
| [@AlexandreLoubet](https://x.com/AlexandreLoubet) | [@ChristineLoirRN](https://x.com/ChristineLoirRN) | [@ID_Libertes](https://x.com/ID_Libertes) | [@MarchioMatthieu](https://x.com/MarchioMatthieu) | [@S_Werbrouck](https://x.com/S_Werbrouck) |
| [@AlexandreVaraut](https://x.com/AlexandreVaraut) | [@ChudeauR](https://x.com/ChudeauR) | [@J_Bardella](https://x.com/J_Bardella) | [@MarieLuceBC](https://x.com/MarieLuceBC) | [@SandraDELANNOY1](https://x.com/SandraDELANNOY1) |
| [@alexisjollyrn](https://x.com/alexisjollyrn) | [@ClaireBeuil](https://x.com/ClaireBeuil) | [@J_Rancoule](https://x.com/J_Rancoule) | [@marine_hamelet](https://x.com/marine_hamelet) | [@Sandrine_Dogor](https://x.com/Sandrine_Dogor) |
| [@Anais_Sabatini](https://x.com/Anais_Sabatini) | [@CNEWS](https://x.com/CNEWS) | [@jerome_buisson](https://x.com/jerome_buisson) | [@MarionMarechal](https://x.com/MarionMarechal) | [@sblanc66000](https://x.com/sblanc66000) |
| [@AndreRougeOff](https://x.com/AndreRougeOff) | [@Coll_Nemesis](https://x.com/Coll_Nemesis) | [@JLechanteux](https://x.com/JLechanteux) | [@MassonBryan](https://x.com/MassonBryan) | [@seb_humbert](https://x.com/seb_humbert) |
| [@angelique_ranc](https://x.com/angelique_ranc) | [@diaz_edwige](https://x.com/diaz_edwige) | [@JLeonardelli_](https://x.com/JLeonardelli_) | [@MatthiasRN](https://x.com/MatthiasRN) | [@sebchenu](https://x.com/sebchenu) |
| [@AnneSicard1](https://x.com/AnneSicard1) | [@e_Fouquart](https://x.com/e_Fouquart) | [@jllacapelle](https://x.com/jllacapelle) | [@MauvieuxKevin](https://x.com/MauvieuxKevin) | [@Serge_Muller24](https://x.com/Serge_Muller24) |
| [@AntBoulogne54](https://x.com/AntBoulogne54) | [@EddyCasterman](https://x.com/EddyCasterman) | [@JocelynDessigny](https://x.com/JocelynDessigny) | [@MaximeAmblard5](https://x.com/MaximeAmblard5) | [@SJosserand30](https://x.com/SJosserand30) |
| [@antoine_golliot](https://x.com/antoine_golliot) | [@EmericSalmon](https://x.com/EmericSalmon) | [@JoelleMelinRN](https://x.com/JoelleMelinRN) | [@melanie_disdier](https://x.com/melanie_disdier) | [@sRambaudRN](https://x.com/sRambaudRN) |
| [@ArnaudSa3](https://x.com/ArnaudSa3) | [@F_Desouche](https://x.com/F_Desouche) | [@jordan_guitton](https://x.com/jordan_guitton) | [@Meurin_P](https://x.com/Meurin_P) | [@T_Houssin](https://x.com/T_Houssin) |
| [@ASabatou](https://x.com/ASabatou) | [@FabriceLeggeri](https://x.com/FabriceLeggeri) | [@JorysB3](https://x.com/JorysB3) | [@MichelGuiniot](https://x.com/MichelGuiniot) | [@TaverneMichael](https://x.com/TaverneMichael) |
| [@asfrigout](https://x.com/asfrigout) | [@FalconFrederic](https://x.com/FalconFrederic) | [@joshuaHochart](https://x.com/joshuaHochart) | [@MichleMartinez3](https://x.com/MichleMartinez3) | [@Th_Bnrdt](https://x.com/Th_Bnrdt) |
| [@Au_Evrard](https://x.com/Au_Evrard) | [@Flo_Joubert](https://x.com/Flo_Joubert) | [@JPGarraud](https://x.com/JPGarraud) | [@MLP_officiel](https://x.com/MLP_officiel) | [@thierry_frappe](https://x.com/thierry_frappe) |
| [@AymericDurox](https://x.com/AymericDurox) | [@FlorenceGoulet4](https://x.com/FlorenceGoulet4) | [@JphTanguy](https://x.com/JphTanguy) | [@MoniqueGriseti](https://x.com/MoniqueGriseti) | [@ThierryMARIANI](https://x.com/ThierryMARIANI) |
| [@BallardPhilippe](https://x.com/BallardPhilippe) | [@FranceJamet](https://x.com/FranceJamet) | [@jrechagneux](https://x.com/jrechagneux) | [@MonnierThibaut](https://x.com/MonnierThibaut) | [@thierryperez_](https://x.com/thierryperez_) |
| [@BarthesChristop](https://x.com/BarthesChristop) | [@FranceLorho](https://x.com/FranceLorho) | [@jsanchez_rn](https://x.com/jsanchez_rn) | [@mvalet_officiel](https://x.com/mvalet_officiel) | [@Thomas_Mng](https://x.com/Thomas_Mng) |
| [@BaubryR](https://x.com/BaubryR) | [@franckallisio](https://x.com/franckallisio) | [@Julien_Limongi](https://x.com/Julien_Limongi) | [@NadineLechonRN](https://x.com/NadineLechonRN) | [@Tiffany_Joncour](https://x.com/Tiffany_Joncour) |
| [@Bay_Christophe](https://x.com/Bay_Christophe) | [@FrankGiletti](https://x.com/FrankGiletti) | [@JulienGabarron](https://x.com/JulienGabarron) | [@NathCarvalho91](https://x.com/NathCarvalho91) | [@TwitchGauchiste](https://x.com/TwitchGauchiste) |
| [@BeaurainJose](https://x.com/BeaurainJose) | [@FredericVos](https://x.com/FredericVos) | [@JulienOdoul](https://x.com/JulienOdoul) | [@NicolasDragon](https://x.com/NicolasDragon) | [@v_joron](https://x.com/v_joron) |
| [@BeneAuzanot](https://x.com/BeneAuzanot) | [@Frontieresmedia](https://x.com/Frontieresmedia) | [@K_Pfeffer](https://x.com/K_Pfeffer) | [@NMeizonnet](https://x.com/NMeizonnet) | [@ValerieDeloge](https://x.com/ValerieDeloge) |
| [@BentzChristophe](https://x.com/BentzChristophe) | [@furet_angeline](https://x.com/furet_angeline) | [@knafo_sarah](https://x.com/knafo_sarah) | [@Parmentier_RN](https://x.com/Parmentier_RN) | [@Valeurs](https://x.com/Valeurs) |
| [@BFMTV](https://x.com/BFMTV) | [@G_Dussausaye](https://x.com/G_Dussausaye) | [@LaureLavalette](https://x.com/LaureLavalette) | [@PascalePiera](https://x.com/PascalePiera) | [@villedieu_a](https://x.com/villedieu_a) |
| [@BlairyEmmanuel](https://x.com/BlairyEmmanuel) | [@GabrielAttal](https://x.com/GabrielAttal) | [@LeBourgeois7610](https://x.com/LeBourgeois7610) | [@Ph_Schreck](https://x.com/Ph_Schreck) | [@WEBERFrederic1](https://x.com/WEBERFrederic1) |
| [@Boccaletti83](https://x.com/Boccaletti83) | [@GalzyStephanie](https://x.com/GalzyStephanie) | [@LevavasseurK](https://x.com/LevavasseurK) | [@phlottiaux](https://x.com/phlottiaux) | [@YaelMenache](https://x.com/YaelMenache) |
| [@BrunoBilde](https://x.com/BrunoBilde) | [@GillesPennelle](https://x.com/GillesPennelle) | [@Lionel_Tivoli](https://x.com/Lionel_Tivoli) | [@PhOlivierRN](https://x.com/PhOlivierRN) | [@YoannGillet30](https://x.com/YoannGillet30) |
| [@BrunoClavet](https://x.com/BrunoClavet) | [@gisele_lelouis](https://x.com/gisele_lelouis) | [@LisettePollet](https://x.com/LisettePollet) | [@PierrePimpie](https://x.com/PierrePimpie) | [@ZemmourEric](https://x.com/ZemmourEric) |
| [@BrunoRetailleau](https://x.com/BrunoRetailleau) | [@GonzalezJoseRN](https://x.com/GonzalezJoseRN) | [@ljacobelli](https://x.com/ljacobelli) | [@PR_Thionnet](https://x.com/PR_Thionnet) |  |
| [@C_GirardRN](https://x.com/C_GirardRN) | [@GrangierGe](https://x.com/GrangierGe) | [@LopezLiguori](https://x.com/LopezLiguori) | [@Reconquete_off](https://x.com/Reconquete_off) |  |
| [@C_Jaouen_84](https://x.com/C_Jaouen_84) | [@groupeRN_off](https://x.com/groupeRN_off) | [@LRDehault](https://x.com/LRDehault) | [@Rivirejoseph1](https://x.com/Rivirejoseph1) |  |
<!-- comptes:fin -->

## Pendant le blocage

Le popup peut être fermé ; le navigateur doit rester ouvert. L’extension navigue dans X sans recharger tout le site à chaque profil et attend la confirmation de chaque blocage avant de passer au suivant. La pause entre deux profils est de 250 ms ; le reste du temps dépend des réponses de X. Si la navigation interne échoue, un chargement classique sert de secours.

Les comptes déjà bloqués sont laissés tels quels. Les profils indisponibles sont indiqués dans le bilan. Si X demande une connexion, une vérification, ou affiche une page inattendue, le traitement se met en pause. **Vérifier X** ouvre alors l’onglet de travail, et **Reprendre le blocage** continue au même endroit.

Une page noire ou un chargement qui ne finit pas peut venir d’une limitation de X. Dans ce cas, attendre avant de reprendre évite de multiplier les requêtes. Aucun délai fixe n’est garanti pour une grande liste.

**Arrêter** ferme cet onglet. Les blocages déjà effectués restent actifs et peuvent être retirés depuis les paramètres de X.

## Ce qu’il faut savoir

Cette extension utilise les boutons du site, en français ou en anglais. X interdit cette automatisation dans [ses règles](https://help.x.com/en/rules-and-policies/x-automation) et peut restreindre un compte. Un changement d’interface peut aussi casser le fonctionnement. Ce projet n’est pas affilié à X.

Aucun mot de passe, cookie ou jeton n’est lu. La liste et l’avancement restent dans le navigateur ; il n’y a pas de suivi d’audience. Le fichier de comptes est public et hébergé sur GitHub. [La page de confidentialité](extension/privacy.html) donne les détails.

## Travailler sur le code

Node.js 22 ou plus récent suffit pour les outils de développement. L’extension elle-même n’a aucune dépendance à installer.

```sh
npm ci
npm test
npm run validate:list
npx playwright install chromium
npm run test:browser
npm run test:firefox
npm run build
npm run lint:firefox
```

Les trois ZIP sont créés dans `dist/`. Les tests navigateur utilisent des pages de test : ils ne bloquent aucun compte réel. Sous Windows, `TEST_BROWSER_CHANNEL=msedge` permet de les lancer avec Edge déjà installé. `TEST_BROWSER_HEADED=1` permet de voir le navigateur de test.

Les notes de publication sont dans [`docs/publication-navigateurs.md`](docs/publication-navigateurs.md).
