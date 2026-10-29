# Environnement navigateur local — reprise V3

Document du 2026-10-29. Récupération et smokes effectués le **2026-10-28, de 23:43 à 23:45 UTC**. Mandat limité à la remise en service locale des moteurs après disparition des caches. Référence de reprise : [annexe du protocole QA V2](2026-10-28-universal-qa-protocol.md#annexe--reprise-de-lenvironnement-navigateur-après-reset).

**Les trois moteurs sont disponibles et passent une page HTML synthétique en mémoire.** Aucun scénario FIL CLAIR ni suite projet n'a été lancé dans cette intervention. Ces résultats qualifient le lancement des moteurs dans ce conteneur, pas le produit, les navigateurs commerciaux, les appareils physiques ou WCAG.

## Hôte et portée

- Ubuntu **24.04.3 LTS (noble), x86_64**, conforme à l'environnement décrit par le protocole ; aucune adaptation d'ABI ou de version nécessaire.
- Node **24.22.1** ; Playwright **1.64.1**, déjà présents dans le dépôt.
- `npx playwright install --dry-run chromium-headless-shell firefox webkit` confirme les révisions **1248 / 1555 / 2370**. Le dry-run ne télécharge rien.
- Récupération gratuite des archives officielles et des paquets Ubuntu ; aucun service GitHub ou Vercel, aucune ressource payante, aucune escalade.
- Aucun ajout npm, changement de dépendance du dépôt, `apt install`, `apt-get install`, `dpkg -i`, réglage OS, commit ou push. Les `.deb` ont seulement été extraits par `dpkg-deb -x`.
- Seul fichier du dépôt écrit dans cette intervention : `docs/research/2026-10-29-browser-environment.md`. Les binaires, bibliothèques, scripts de smoke, index et journaux sont temporaires, hors dépôt.

## Archives officielles et intégrité

Les trois téléchargements ont été lancés en parallèle vers `/tmp/fil-clair-browser-recovery/archives/*.zip.part`. Pour **chaque** archive, la taille exacte et le SHA-256 ont été comparés aux valeurs de reprise V2 ; `zipfile.ZipFile.testzip()` a ensuite contrôlé le CRC de toutes les entrées et la validité du ZIP. Les chemins d'entrées ont été contrôlés avant extraction. Seules les archives conformes ont été renommées `.zip` puis extraites avec `unzip`.

| Archive / version / révision Playwright | Octets | SHA-256 observé | Contrôle ZIP avant extraction |
| --- | ---: | --- | --- |
| [Chrome Headless Shell 156.0.8078.4 / 1248](https://storage.googleapis.com/chrome-for-testing-public/156.0.8078.4/linux64/chrome-headless-shell-linux64.zip) | 125 797 539 | `c3e50596aef52c58f8fda3c6b3411c33d34c88b177b3ed1c2243359fd3b8ba20` | PASS, 287 entrées |
| [Firefox 157.0 / 1555](https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/firefox/1555/firefox-ubuntu-24.04.zip) | 116 377 639 | `564f74fa3c46cb83c6252145cf1569c95236c8c404d6a5a80cc736cf32265f0c` | PASS, 54 entrées |
| [WebKit 27.2 / 2370](https://playwright.download.prss.microsoft.com/dbazure/download/playwright/builds/webkit/2370/webkit-ubuntu-24.04.zip) | 108 122 739 | `63b31a5d68d908d9aee2e445b88edc4c1e1d1eba488f5bd7e35668f91315b968` | PASS, 60 entrées |

Ces SHA-256 correspondent aux téléchargements V2 et à cette reprise ; ce ne sont pas des signatures indépendantes publiées par le fournisseur. Les téléchargements HTTPS proviennent des URLs officielles indiquées dans le tableau.

| Moteur | Chemin disponible |
| --- | --- |
| Chromium headless | `/root/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell` |
| Firefox | `/root/.cache/ms-playwright/firefox-1555/firefox/firefox` |
| WebKit, bundle | `/root/.cache/ms-playwright/webkit-2370/minibrowser-wpe` |
| WebKit, lanceur temporaire | `/tmp/fil-clair-webkit-launch.sh` |

Le lancement headless Chromium par défaut de Playwright fonctionne sans chemin explicite. `chromium.executablePath()` expose le chemin du Chromium complet, distinct du headless shell utilisé ici ; le Chromium complet et Google Chrome commercial n'ont pas été installés. FFmpeg, proposé par le dry-run, n'a pas été téléchargé : le smoke ne couvre pas l'enregistrement vidéo.

## Bibliothèques WebKit : snapshot signé et APT isolé

Source officielle fixe : `https://snapshot.ubuntu.com/ubuntu/20260828T000000Z`, suites `noble`, `noble-updates`, `noble-security`, composants `main universe`. Chaque ligne temporaire utilise explicitement `signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg`.

```text
deb [signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg] https://snapshot.ubuntu.com/ubuntu/20260828T000000Z noble main universe
deb [signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg] https://snapshot.ubuntu.com/ubuntu/20260828T000000Z noble-updates main universe
deb [signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg] https://snapshot.ubuntu.com/ubuntu/20260828T000000Z noble-security main universe
```

`apt-get update` a terminé avec exit 0 ; les index temporaires représentent 22,0 Mo. Les trois `InRelease` ont également été vérifiés séparément par `gpgv --keyring /usr/share/keyrings/ubuntu-archive-keyring.gpg`, tous avec exit 0 et **Good signature** de la clé **Ubuntu Archive Automatic Signing Key (2018)** :

```text
F6ECB3762474EDA9D21B7022871920D1991BC93C
```

`Acquire::Check-Valid-Until "false"` permet de lire ce snapshot figé ; la vérification des signatures et des empreintes reste active. Aucune option de dépôt non authentifié ou non sûr n'a été activée.

Configuration finale dans `/tmp/fil-clair-browser-recovery/apt/isolated.conf` :

```conf
Dir::Etc "/tmp/fil-clair-browser-recovery/apt";
Dir::State "/tmp/fil-clair-browser-recovery/apt/state";
Dir::Log "/tmp/fil-clair-browser-recovery/apt/log";
Dir::Etc::parts "/tmp/fil-clair-browser-recovery/apt/parts";
Dir::Etc::main "/dev/null";
Dir::Etc::sourcelist "/tmp/fil-clair-browser-recovery/apt/sources.list";
Dir::Etc::sourceparts "/tmp/fil-clair-browser-recovery/apt/sourceparts";
Dir::State::lists "/tmp/fil-clair-browser-recovery/apt/lists";
Dir::State::status "/var/lib/dpkg/status";
Dir::Cache "/tmp/fil-clair-browser-recovery/apt/cache";
Dir::Cache::archives "/tmp/fil-clair-browser-recovery/apt/archives";
APT::Sandbox::User "root";
APT::Get::List-Cleanup "false";
Acquire::Check-Valid-Until "false";
Acquire::Languages "none";
```

Les répertoires `parts`, `sourceparts`, `lists/partial`, `archives/partial`, `cache`, `state`, `log`, `preferences.d` et `auth.conf.d` sont temporaires. Le `apt-config dump` utilisé ne contient aucun hook `Pre-Invoke` ou `Post-Invoke` hérité. `Dir::State::status` ne sert qu'à lire l'état des paquets existants ; aucune installation n'est exécutée. Les commandes APT utilisent toutes `APT_CONFIG=/tmp/fil-clair-browser-recovery/apt/isolated.conf`.

`apt-get --print-uris download …` a fourni l'URL exacte, la taille et le SHA-512 de chaque paquet depuis ces index signés. `apt-get download …` a récupéré les 22 archives (8 680 ko, exit 0). Avant toute extraction, un contrôle local a recomparé les **22 tailles et SHA-512** aux métadonnées signées ; les 22 paquets sont `amd64`. Les SHA-256 supplémentaires ci-dessous identifient les octets effectivement récupérés. L'extraction seule a été effectuée dans `/tmp/fil-clair-browser-recovery/deps/root`.

| Paquet et URL exacte | Version | Octets | SHA-256 local |
| --- | --- | ---: | --- |
| [libabsl20220623t64](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/a/abseil/libabsl20220623t64_20220623.1-3.1ubuntu3.2_amd64.deb) | `20220623.1-3.1ubuntu3.2` | 422920 | `dec97687bc3bc4edbd1c26bc9182f7584e3ff1c36a9bb7ce80211951e5a5893d` |
| [libavif16](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/universe/liba/libavif/libavif16_1.0.4-1ubuntu3_amd64.deb) | `1.0.4-1ubuntu3` | 91250 | `b295a9954a4b756af05ff381d9808f3c0c582a111b7e4c7678cfe13de9ae8818` |
| [libdw1t64](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/e/elfutils/libdw1t64_0.190-1.1ubuntu0.1_amd64.deb) | `0.190-1.1ubuntu0.1` | 261194 | `edaa9ce4221d95f4bd72a9805100902e313092a2f31a7a51e7186be97734714d` |
| [libelf1t64](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/e/elfutils/libelf1t64_0.190-1.1ubuntu0.1_amd64.deb) | `0.190-1.1ubuntu0.1` | 57810 | `b4aee123a37472d213647594b4f7d4a0d13615b0ca2a6fd33926b768d6b232c2` |
| [libenchant-2-2](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/e/enchant-2/libenchant-2-2_2.3.3-2build2_amd64.deb) | `2.3.3-2build2` | 51354 | `4faecb5cee57ff00649b3ea4d83c072d9da2670797b7d2854708ff60cef17426` |
| [libevent-2.1-7t64](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/libe/libevent/libevent-2.1-7t64_2.1.12-stable-9ubuntu2_amd64.deb) | `2.1.12-stable-9ubuntu2` | 144558 | `f95eddfc9e9028567a21b8162a1cb8aae96b2fb168f149c0a5b01d72bfd42471` |
| [libgav1-1](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/universe/libg/libgav1/libgav1-1_0.18.0-1build3_amd64.deb) | `0.18.0-1build3` | 357148 | `428f353f449e6b15cdcf5823215416e36adcfba75fe9f0fedc1cd132d68e6b3f` |
| [libgles2](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/libg/libglvnd/libgles2_1.7.0-1build1_amd64.deb) | `1.7.0-1build1` | 17122 | `9dec2d79a2eebb80522f7cce77995f7a8ded22f0e3916f13353d066c62f97fac` |
| [libgstreamer-gl1.0-0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/g/gst-plugins-base1.0/libgstreamer-gl1.0-0_1.24.2-1ubuntu0.4_amd64.deb) | `1.24.2-1ubuntu0.4` | 213954 | `95200fbc93b7e88ccb451d7546cbf824189d9cefac0c9053be0246b9d0db8449` |
| [libgstreamer-plugins-bad1.0-0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/universe/g/gst-plugins-bad1.0/libgstreamer-plugins-bad1.0-0_1.24.2-1ubuntu4_amd64.deb) | `1.24.2-1ubuntu4` | 797390 | `6e8da41c0cbb2070f3477cf02360c2ce2eb55e825ba09e12b4270b3254e04f45` |
| [libgstreamer-plugins-base1.0-0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/g/gst-plugins-base1.0/libgstreamer-plugins-base1.0-0_1.24.2-1ubuntu0.4_amd64.deb) | `1.24.2-1ubuntu0.4` | 862084 | `508f0a23fab878be69390cd3f5d94024541875dc7034b64becb1c72241508afc` |
| [libgstreamer1.0-0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/g/gstreamer1.0/libgstreamer1.0-0_1.24.2-1ubuntu0.1_amd64.deb) | `1.24.2-1ubuntu0.1` | 1165196 | `306a6a5cff08630b79b8a68e5f888da7d8e209a452e9b5e24449cca95d8e71f5` |
| [libgtk-4-1](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/g/gtk4/libgtk-4-1_4.14.5%2bds-0ubuntu0.10_amd64.deb) | `4.14.5+ds-0ubuntu0.10` | 3295234 | `2361861e33d34a26f3d6c4906935fd9e6241eb44ff30564cb493b5671111a24f` |
| [libharfbuzz-icu0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/h/harfbuzz/libharfbuzz-icu0_8.3.0-2build2_amd64.deb) | `8.3.0-2build2` | 13310 | `9098670758e60b190d7edf367ad57e954bfc1b2a616def3f4e281062e036a843` |
| [libhyphen0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/h/hyphen/libhyphen0_2.8.8-7build3_amd64.deb) | `2.8.8-7build3` | 26516 | `b508d3a5da168ddb2ae6e79ea0521ba64cd121285db0ece438d0bd56ba628556` |
| [libmanette-0.2-0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/libm/libmanette/libmanette-0.2-0_0.2.7-1build2_amd64.deb) | `0.2.7-1build2` | 30570 | `8fbb67e94abf563c01398ad7458df1a6824f19a0b4337f67d61c0889771805db` |
| [liborc-0.4-0t64](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/o/orc/liborc-0.4-0t64_0.4.38-1ubuntu0.1_amd64.deb) | `1:0.4.38-1ubuntu0.1` | 207380 | `a546ca6e237748693596ba469e84a2e0581bc39113abc62b718931df00a4c682` |
| [libsecret-1-0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/libs/libsecret/libsecret-1-0_0.21.4-1build3_amd64.deb) | `0.21.4-1build3` | 116332 | `7d7263ffc92c33042328f99c93433a846e8d9e549876dab18ba18606e6541ecd` |
| [libsoup-3.0-0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/libs/libsoup3/libsoup-3.0-0_3.4.4-5ubuntu0.7_amd64.deb) | `3.4.4-5ubuntu0.7` | 291712 | `b76f5a065cb2d789cf8cb2826614dd77654e70064ec8882d9d41f9c7aa3e2a8f` |
| [libwayland-server0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/w/wayland/libwayland-server0_1.22.0-2.1build1_amd64.deb) | `1.22.0-2.1build1` | 33928 | `edbfa4b6857691ae922cc768a753fab230eee9e956aa2ce4f2eaa8d9ad777dca` |
| [libwoff1](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/main/w/woff2/libwoff1_1.0.2-2build1_amd64.deb) | `1.0.2-2build1` | 45252 | `e23a6287ff611ff60a5a598de21f8f60f6236b6ad9443376318e6cc7914219c1` |
| [libyuv0](https://snapshot.ubuntu.com/ubuntu/20260828T000000Z/pool/universe/liby/libyuv/libyuv0_0.0%7egit202401110.af6ac82-1_amd64.deb) | `0.0~git202401110.af6ac82-1` | 178208 | `88bd472e50a7e45469e31f8e0ba232b4d8ed30322f5badb285c58cc1ba0d2176` |

Avec le chemin combinant le bundle et les bibliothèques extraites, `ldd` sur `minibrowser-wpe/bin/MiniBrowser` ne rapporte **aucun `not found`**. Le smoke WebKit ci-dessous confirme aussi le chargement dynamique nécessaire à cette page.

## Lanceur WebKit

Le `pw_run.sh` du bundle remplace `LD_LIBRARY_PATH` ; une simple variable avant ce script ne suffit pas. Le lanceur suivant reprend les chemins WPE officiels et ajoute les bibliothèques extraites. Il existe avec le mode **0755** dans `/tmp/fil-clair-webkit-launch.sh` ; SHA-256 `d7d4071752f98871c0a4ade027399e7095c4ba014bf5e7cec5c302a567f58896`.

```sh
#!/bin/sh
FIL_CLAIR_WK=/root/.cache/ms-playwright/webkit-2370/minibrowser-wpe
FIL_CLAIR_WK_DEPS=/tmp/fil-clair-browser-recovery/deps/root/usr/lib/x86_64-linux-gnu
export WEBKIT_EXEC_PATH="$FIL_CLAIR_WK/bin"
export WEBKIT_INJECTED_BUNDLE_PATH="$FIL_CLAIR_WK/lib"
export WEBKIT_INSPECTOR_RESOURCES_PATH="$FIL_CLAIR_WK/share"
export LD_LIBRARY_PATH="$FIL_CLAIR_WK/lib:$FIL_CLAIR_WK/sys/lib:$FIL_CLAIR_WK_DEPS${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export WEBKIT_FORCE_COMPLEX_TEXT=1
exec "$FIL_CLAIR_WK/bin/MiniBrowser" "$@"
```

## Preuve des smokes uniquement

Script temporaire : `/tmp/fil-clair-browser-recovery/environment-smoke.cjs`. Il charge le Playwright déjà présent dans le dépôt, ouvre un navigateur headless puis une page, injecte un document synthétique via `setContent`, vérifie le titre **FIL CLAIR environment smoke** et le bouton **Fixture locale**, puis ferme le navigateur. Aucun serveur produit, page FIL CLAIR, fixture projet ou parcours applicatif n'est ouvert.

Commandes effectivement exécutées, chacune avec exit 0 :

```sh
node /tmp/fil-clair-browser-recovery/environment-smoke.cjs chromium
PWA_FIREFOX_NO_SANDBOX=1 node /tmp/fil-clair-browser-recovery/environment-smoke.cjs firefox
node /tmp/fil-clair-browser-recovery/environment-smoke.cjs webkit
```

| Moteur | Version retournée par le navigateur | Début → fin UTC | Résultat |
| --- | --- | --- | --- |
| chromium | 156.0.8078.4 | 2026-10-28T23:43:59.387Z → 2026-10-28T23:43:59.816Z | PASS, exit 0 |
| firefox | 157.0 | 2026-10-28T23:44:27.967Z → 2026-10-28T23:44:30.140Z | PASS, exit 0 |
| webkit | 27.2 | 2026-10-28T23:45:10.442Z → 2026-10-28T23:45:11.395Z | PASS, exit 0 |

Le smoke Firefox applique l'option locale déjà prévue par `scripts/pwa-test-utils.mjs` : préférence `security.sandbox.content.level=0` et variable `MOZ_DISABLE_CONTENT_SANDBOX=1` lorsque `PWA_FIREFOX_NO_SANDBOX=1`. Le sandbox par défaut n'a pas été requalifié dans cette reprise. Ce contournement reste limité à ce conteneur.

Le smoke WebKit utilise explicitement `/tmp/fil-clair-webkit-launch.sh` comme `executablePath`. Son journal capturé ne contient que le résultat PASS, sans avertissement remonté par cette invocation. Cela ne prouve ni l'isolation des contextes applicatifs ni les scénarios de persistance ou de concurrence.

Pour les scripts nécessaires que la coordination exécutera séparément : Chromium est disponible par défaut ; Firefox requiert `PWA_BROWSER=firefox PWA_FIREFOX_NO_SANDBOX=1` ; WebKit requiert `PWA_BROWSER=webkit PWA_EXECUTABLE_PATH=/tmp/fil-clair-webkit-launch.sh`. Aucune de ces suites projet n'a été exécutée par cette intervention.

## Journaux et limites de reprise

Toutes les preuves locales détaillées sont sous `/tmp/fil-clair-browser-recovery/logs/` : `archive-verification.json`, `apt-update.log`, `apt-download.log`, `apt-config-dump.txt`, `inrelease-signatures.log`, `dependency-uris.txt`, `dependency-manifest.json`, `webkit-ldd.txt`, `smoke-chromium.log` / `.json`, `smoke-firefox.log` / `.json`, `smoke-webkit.log` / `.json`. `dependency-manifest.json` conserve notamment les SHA-512 des métadonnées signées et les SHA-256 locaux.

Le champ `executable` du JSON de smoke Chromium vient de l'API `chromium.executablePath()` et désigne son chemin nominal de navigateur complet ; il ne doit pas être utilisé comme chemin du shell headless. Le chemin headless réellement disponible est celui du tableau ci-dessus. Le PASS provient du lancement headless par défaut.

Les archives restent sous `/tmp/fil-clair-browser-recovery/archives/`, les `.deb` sous `/tmp/fil-clair-browser-recovery/deps/`, les bibliothèques extraites sous `/tmp/fil-clair-browser-recovery/deps/root/usr/lib/x86_64-linux-gnu`. Le reset du conteneur peut supprimer `/tmp` et `/root/.cache/ms-playwright` ; ne pas considérer ces chemins comme des livrables persistants. Les archives intègres présentes ne doivent pas être retéléchargées inutilement.

Ces trois smokes rendent l'environnement utilisable pour les nouveaux tests V3 ; **aucun résultat V3 produit, résultat Safari physique, validation commerciale universelle ou conformité WCAG complète n'est revendiqué ici**.
