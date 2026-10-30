# Transport Mastodon serveur — socle inactif

30 octobre2026, Europe/Paris. Le journal PR#4 est conservé. Cette branche ajoute une bibliothèque Node24, sans route HTTP publique, serveur déployé ou import dans la PWA. Les seuls serveurs lancés par les tests sont des fixtures HTTPS sur loopback ; aucun compte/jeton réel n'est utilisé.

## Fonctionnement réalisé
`server/connectors/mastodon-transport.js` capture un jeton fourni par un **appelant OAuth serveur de confiance**, compte/origine et trois permissions précises dans une fermeture mémoire. Le handle expose des métadonnées sans jeton, un transport, un statut et une déconnexion locale. Les métadonnées `type:official-oauth` sont exigées par l'ancien adaptateur mais **ne prouvent pas l'obtention officielle d'un jeton**. Aucun login/échange/renouvellement OAuth n'est fourni ici.

La durée de vie locale vaut15minutes par défaut, maximum1heure. Elle invalide le handle et les requêtes en attente ; elle n'est pas une expiration ou révocation du jeton chez Mastodon. La déconnexion retire la référence privée et interrompt localement, sans promettre l'effacement physique de mémoire ou l'annulation d'un effet distant. Le résultat indique explicitement `providerRevocation:not-requested`.

Le transport n'autorise que les quatre routes utilisées par l'adaptateur Mastodon4.3+ : identité du compte, relation d'une seule cible, block/unblock d'une seule cible. Aucun header/query/corps arbitraire ; scopes exactement profile/read:follows/write:blocks. Les réponses200 sont bornées, décodées UTF-8 strict et projetées sur les champs ID/blocking nécessaires. Les corps d'erreur, cookies, redirections et messages fournisseur ne sont pas transférés. Seuls Retry-After et X-RateLimit-Reset bornés sont conservés. Identité incohérente/401/403 arrêtent le handle.

## Réseau et absence de rejeu
Origines HTTPS/443 explicitement approuvées par configuration administrateur. DNS A/AAAA résolu une fois, tout le jeu doit être public et cohérent ; une réponse privée ou malformée suffit à refuser avant socket. Une adresse est épinglée pour la requête. Host/SNI/vérification du certificat gardent le nom d'origine. Les plages spéciales IPv4/IPv6 sont refusées de façon conservatrice, y compris certaines mondialement joignables ; pas de fallback vers une autre adresse.

Une seule requête active par handle, un `https.request` et un `end` par appel, agent non partagé, aucun refresh/retry/redirect. Les tests421/302/503 constatent un seul POST. Ce mécanisme ne garantit pas une livraison exactement une fois chez le fournisseur. Une coupure après envoi garde un effet incertain et l'exécuteur durable peut maintenir sa quarantaine.

Timeout total10secondes par défaut, maximum30secondes, couvrant DNS→corps et détruisant la requête ; réponse64KiB par défaut/1MiB maximum, headers16KiB. Pas de décompression de réponse ; uniquement JSON UTF-8 non compressé. Aucun journal applicatif contenant jetons, identités ou cibles n'est émis par ces modules.

Le délai écoulé est revérifié avec une horloge monotone après DNS, avant dispatch et avant acceptation de réponse. Une boucle JavaScript bloquée peut retarder l'annulation physique ; quand le code reprend, aucune nouvelle construction ni réponse achevée hors délai n'est acceptée. Un effet distant déjà en vol reste incertain.

## Qualification et limites
Tests avec certificat/clé éphémères, serveur TLS loopback et drivers de confiance injectés. Le driver de test vérifie les options publiques/TLS puis redirige le fil vers localhost avec sa CA éphémère ; aucun bypass de ce type dans le module de production. IPv6 : validation de politique/paramètres testée, le fil de la fixture reste IPv4. Aucune connectivité IPv6 externe ou API réelle n'est certifiée.

Un assemblage avec adaptateur/exécuteur et journal **en mémoire de test** vérifie confirmation par lecture indépendante et quarantaine après POST appliqué puis coupure. Il ne qualifie pas un journal serveur durable ni la continuité interprocessus. Les drivers réseau/horloge et le code Node sont de confiance ; proxy transparent, NAT/routage cloud et compromission du serveur restent hors garantie.

Avant activation : client OAuth serveur officiel, stockage/session et journal serveur durables, authentification/CSRF des routes, preuve de version/permissions, révocation fournisseur, information/export/effacement/rétention, sortie des voies arrêtées, compte/cible de test autorisés, hébergement/coût/egress et recette réelle. Bluesky reste séparé : SDK officiel/DPoP/PAR et transport sans rejeu à qualifier. Aucun coût, login, opération sociale, fusion ou déploiement n'est engagé par cette bibliothèque.

Sources : [recherche datée](research/2026-10-30-server-transport.md), [conception](superpowers/specs/2026-10-30-server-transport-design.md), [plan/ledger](superpowers/plans/2026-10-30-server-transport.md). Les preuves datées et la clôture distante sont consignées dans la PR et le journal de session ; aucun test local ne vaut validation de production.
