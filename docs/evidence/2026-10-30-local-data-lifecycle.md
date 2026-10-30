# FIL CLAIR — cycle des données locales

30 octobre2026, Europe/Paris. Base PR5 `04454543f3df190f54f5fdacbccb82a413f901c0` ; branche `fix/fil-clair-local-data-lifecycle`. Correctif du socle A, sans activation sociale. **A SAFE/B CONNECT/C PUBLIC non livrées.**

## Fait

Reprise en lecture des cinq PR draft et des deuxCI vertes PR5. Main toujours `protected:false`, aucun ruleset ; trois anciens déploiements Vercel seulement. Cockpit huit lots/huit portes relu. PlanVercelPro connu, capacité gratuite non établie ; aucun build/promotion. Le quota historique identifié reste Actions3000/3000 au16/10, compteur actuel inaccessible. Gratuité des runners standards de dépôts publics revérifiée dans [la documentation GitHub](https://docs.github.com/en/billing/concepts/product-billing/github-actions) ; aucun Copilot/agent GitHub/cache/upload/runner payant.

Revue spécialisée bornée du modèle/persistance/UI : trois défauts trouvés. Un import commencé avant remplacement peut réintroduire une liste ; une sauvegarde lente vide le prochain brouillon ; une décision orpheline importée redevient active au nouvel ajout d'un profil sans nouvelle déclaration. Le dernier cas reproduit aussi avec Node donne `blocked:1, remaining:0, history:[]`.

Correctifs : mutation pure `addAccount`, comparaison des valeurs encore soumises avant nettoyage des deux formulaires, focus conservé après changement de tâche, génération d'espace périmant les seules lectures d'import après remplacement réussi. Pas de purge générale à l'import, de nouveau stockage ni de format modifié. Shellv8 ; nouvelle recette inscrite dans la boucle CI existante. Déploiement Git de cette seule nouvelle branche désactivé dans les deux configs.

## Vérifié comment

| Vérification locale | Résultat observé |
|---|---|
| Baseline avant changement | 226/226 Node |
| Modèle RED→GREEN | 4 échecs attendus sur fonction absente, puis4/4 ; reproduction comportementale orpheline distincte |
| Navigateur avant correctif | Chromium :5/21PASS,16FAIL, zéro requête externe laissée passer |
| Brouillons après premier correctif | 6/6Chromium |
| Nouvelle recette après correctifs | 21/21 par moteur : Chromium156.0.8078.4,Firefox157.0,WebKit27.2Linux ;63/63cas, zéro requête externe laissée passer |
| Suite Node après correctifs | 230/230 |
| SW/audit statique | 9/9,14modules du shell, aucun connecteur actif atteignable |
| Registre/liste |14services/43contrôles synchronisés ;162profils historiques valides |
| Dépendances |0high/critical ;3low de développement dans deepmerge→addons-linter→web-ext, conservées sans downgrade forcé |
| Non-régression locale élargie |16scripts terminés :6Chromium,5Firefox,5WebKit ;3scripts interrompus sans conclusion lorsque le transport exec s'est déconnecté. Aucun PASS attribué aux scripts incomplets |
| CI distante/nouvellePR |À constater après revue et push groupé ; aucune exécution distante présumée par ce journal pré-push |

Les tests utilisent un vrai Web Lock et IndexedDB, des fichiers synthétiques, des réponses de liste publique interceptées et des confirmations de dialogue contrôlées. Aucun mot de passe, compte social, préférence réelle, API IA ou service de financement. Les scénarios périmés vérifient stockage/état et absence de confirmation ; un fichier plus récent n'est pas vidé par l'ancien. Refus, annulation et mutation ordinaire laissent l'import autorisé terminer.

Runtime restauré uniquement sous `/tmp` depuis archives officielles, taille/CRC/SHA256 enregistrés ;20paquets Ubuntu extraits après vérification des index signés. Aucun changement de dépendance, installation système ni certificat réel. WebKit a nécessité libdw puis libGLESv2 chargée dynamiquement ; avertissement automation-context conservé. Linux headless, pas d'appareil physique, Safari commercial, VoiceOver/TalkBack ni certification WCAG. L'essai de diagnostic navigateur relancé pendant investigation de sortie tamponnée n'est pas une qualification au SHA ; seule la passe RED complète stable et les passes GREEN identifiées sont retenues.

## Ouvert

Revue indépendante finale puis CI au head exact. Lots01/06/08 bloqués,02/03/04/05/07 en revue ; une seule porte automatisée cochée, sept ouvertes. Main/admin, preview au SHA et capacité gratuite Vercel, physiques/installations/WCAG complet, responsable/contact/bases légales/article9/AIPD/contrats, supervision/support/restauration/rollback restent requis. OAuth officiel, stockage/session/journal serveur durables, auth/CSRF, droits/rétention/révocation et recette API réelle restent des travaux B. Soutien CONTRIB.OS désactivé sans URL officielle. Aucun déclenchement de développement futur créé.

## Périmé

« Cycle local sans risque après remplacement » : contredit par les reproductions ; correctifs ciblés et non reconstruction V3.2. Déclarations orphelines compatibles ne doivent plus se réactiver au nouvel ajout. Un nouveau brouillon ne doit plus être vidé après accusé du précédent. « Plan Vercel inconnu » :Pro identifié lors de PR5, capacité gratuite toujours inconnue. Les sorties RED et anciennes versions du shell ne décrivent pas le comportement corrigé ; la CI/poussée demeurent à constater séparément.
