# Preuves — cycle des données locales

Fichiers réellement produits durant la session du30octobre2026, Europe/Paris. [Journal](../2026-10-30-local-data-lifecycle.md), [revue et arbitrages](../2026-10-30-local-data-review.md), [empreintes](receipt.json). Le commit de qualification est local ; son arbre et ses fichiers sont comparés aux objets GitHub canoniques après import. L'API GitHub peut changer les métadonnées d'auteur et donc le SHA du commit sans changer son arbre. Les mappings et les conclusions CI distantes sont consignés dans le corps de la PR, sans nouveau push de documentation.

- `baseline-node.log` :226PASS avant changement ; `orphan-baseline.log` :réactivation sans historique.
- `model-red.log`/`model-green.log` :4tests RED→GREEN. `browser-red-chromium.log` :5PASS/16FAIL au code de base ; version du driver avant ajout de l'affichage de progression, assertions identiques pour ces21cas.
- `drafts-green.log` et `browser-green-*.log` :6cas de brouillons puis21/21 par moteur avant revue.
- `review-focus-red.log` :perte de focus au code97bf93f ; `review-boundaries-red.log` :2frontières en échec sur une copie de la PWA extraite de0445454 avec le nouveau driver uniquement.
- `browser-final-*.log` :24/24 par moteur,72PASS, zéro requête externe laissée passer ; `node-final.log` :230PASS ; `security-final.log` :9SW et audit.
- `regression-*.log` :source97bf93f,16scripts terminés (6Chromium,5Firefox,5WebKit). **Incomplets, sans verdict :** chromium/test-pwa-replacements,firefox/test-pwa-flows,webkit/test-pwa-flows. Les autres scripts de la boucle n'ont pas démarré après déconnexion du transport exec. Aucun résultat local de matrice33complète n'est revendiqué. La CI prévue exécute36scripts, dont la nouvelle suite, sur son head exact ; son succès reste à lire.
- `register.log`,`list.log`,`dependencies.log` :14services/43contrôles,162profils,3lowdev/0highcritical ; aucun downgrade forcé.
- `runtime-*` :provenance d'archives, empreintes/CRC/tailles et index Ubuntu signés/20paquets extraits en `/tmp`. Smokes de démarrage distincts des tests applicatifs. Aucun binaire/paquet/secret/certificat committé.

`node-qualified.log`/`security-qualified.log` sont les sorties initiales avant correctif focus ; les sorties `*-final` qualifient les fichiers de production finals. La relance de diagnostic à sortie tracée pendant investigation n'est pas retenue comme qualification d'un SHA. Les données des logs sont synthétiques. Aucun résultat ne constitue une validation physique, juridique, sociale réelle, de déploiement ou WCAG complète.

Vérifier : calculer SHA256 de chaque entrée `sourceSHA256` depuis la racine et de chaque entrée `logSHA256` dans ce dossier. Les docs de preuve ne s'auto-hachent pas. La version finale du code doit présenter les mêmes empreintes ; aucune autorisation ni consentement n'est restauré par cette vérification.

Actualisation après CI : ce receipt est le snapshot du036e66b. Après correction du helper de test, vérifier ses entrées historiques via `git show 036e66b:chemin` ; ne pas les comparer aveuglément au helper courant. Les fichiers PWA sont inchangés ; [nouvelle source et sorties de reprise](../local-data-ci-recovery/README.md). La CI annulée et les nouveaux résultats ne modifient aucun ancien log.
