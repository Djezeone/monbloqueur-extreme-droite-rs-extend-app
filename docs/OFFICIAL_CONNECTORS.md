# FIL CLAIR — contrats locaux des connecteurs officiels

Date : 2026-10-28. Livraison B CONNECT **fermée**. Ces modules ne réalisent ni connexion OAuth, ni appel réseau au démarrage, ni intégration à l'interface PWA. Ils préparent des comportements vérifiables avec un transport authentifié injecté. Les tests utilisent exclusivement des fournisseurs simulés.

## Interfaces livrées

Modules ES, sans dépendance ajoutée :

- `pwa/connectors/mastodon.js` : `createMastodonConnector(options)`.
- `pwa/connectors/bluesky.js` : `createBlueskyConnector(options)`.
- `pwa/connectors/orchestration.js` : `createOrchestrator({ connector, now? })`.
- `pwa/connectors/internal.js` : contrat privé, validation et échéances des requêtes ; ne constitue pas une API d'intégration.

Une factory exige explicitement :

```js
{
  session: {
    type: "official-oauth",
    provider: "mastodon", // ou "bluesky"
    accountId: "7",      // DID pour Bluesky ; chaîne décimale pour Mastodon
    origin: "https://social.example",
    scopes: ["profile", "write:blocks", "read:follows"]
  },
  allowedOrigins: ["https://social.example"],
  transport: qualifiedAuthenticatedTransport,
  timeoutMs: 15000
}
```

Ce descripteur est un **contrat d'intégration**, pas une attestation cryptographique d'OAuth. Un futur adaptateur de SDK doit établir la session officielle, vérifier les scopes effectivement accordés et fournir un transport lié à cette session unique. Il ne doit jamais utiliser un compte courant mutable, un cookie implicite ou un token issu d'une liste importée. Les valeurs scalaires du descripteur sont capturées à la construction ; aucun secret ne doit y figurer.

`allowedOrigins` provient d'une configuration de déploiement revue, jamais directement d'un import. Les origines sont canonisées, limitées à HTTPS sans credentials, port non standard, chemin, query ou fragment ; les IP littérales et hôtes locaux sont refusés. Cela ne vérifie pas le DNS et ne garantit pas une protection contre le rebinding. La découverte d'instances arbitraires reste hors périmètre.

Le transport injecté reçoit :

```js
{ url, method, body?, redirect: "error", credentials: "omit", signal }
```

Il doit respecter l'origine fixée, l'annulation et `redirect:"error"`, puis renvoyer :

```js
{ status: 200, headers: {}, body: parsedJson, url: requestedUrl }
```

Le module exige l'URL exacte demandée et un HTTP 200. Il ne fait aucun `fetch` par défaut. Après une mutation, une réponse serveur 5xx, 408 ou hors protocole reste indéterminée et verrouille les écritures suivantes : un échec de passerelle peut arriver après traitement. Seuls les refus client déterministes conservés par le contrat sont distingués de cette incertitude. Une ancienne opération ne peut pas réconcilier ni libérer le verrou d'une opération plus récente. Le futur wrapper doit borner la taille des réponses et ne jamais journaliser les credentials, les codes OAuth ou les corps d'erreur. Ses signatures DPoP, son renouvellement et sa révocation restent à qualifier. Les tests refusent tout appel à `globalThis.fetch`.

La factory retourne un handle gelé `{ provider, accountId, origin, inspect(target, {signal}?) }`. `inspect` relit l'identité puis l'état ; il ne modifie rien. Aucune méthode d'écriture brute n'est exposée sur ce handle. L'orchestrateur accepte uniquement un handle créé par ces factories.

## Consentement et orchestration

API publique de l'orchestrateur :

```js
const consent = runner.grantConsent({
  accountId, target, action: "block", explicit: true, ttlMs: 60000
});
const result = await runner.execute({ consent, target, action: "block", signal });
runner.cancel(); // ou cancel(operationId) ; aucune annulation distante garantie
await runner.reconcile(result.operationId); // lectures uniquement
runner.getOperation(result.operationId);   // copie indépendante
```

- Le consentement est lié à cette instance d'orchestrateur, au fournisseur, à l'origine, au compte, à la cible canonique et à l'action `block` ou `unblock`.
- Il est à usage unique, valable 60 secondes par défaut, avec maximum de 5 minutes. Il expire aussi pendant une prélecture longue ; il est vérifié avant chaque écriture d'un déblocage multiple.
- Un ticket cloné, sérialisé, importé, réutilisé ou appliqué à une autre cible/action est refusé sans requête. `explicit:true` doit correspondre à un geste réel dans la future interface ; le module ne peut pas prouver ce geste humain.
- Une seule opération peut être active par orchestrateur ; aucune file ni relance automatique n'existe. L'intégration doit conserver un orchestrateur unique pour une session.
- Séquence : identité → prélecture complète → contrôle du consentement → identité → écriture → identité → relecture indépendante. Si l'état demandé existe déjà, la prélecture fraîche confirme cet état et aucune écriture n'est envoyée.
- Une annulation avant/durant la prélecture empêche toute écriture ultérieure, y compris si le transport résout tardivement. Une annulation après envoi d'une mutation laisse son résultat distant indéterminé.
- Un 401/403 ou une identité différente arrête l'orchestrateur. Il ne rafraîchit pas la session, ne change pas de compte et ne tente pas de nouveau scope.
- Un 429 conserve une échéance à partir de `Retry-After` (secondes ou date HTTP), sinon `X-RateLimit-Reset`, sinon 60 secondes. Aucun timer ne relance une opération. Un consentement neuf sera nécessaire après le délai.

Les snapshots contiennent `operationId`, l'identité fixée, la cible, l'action, `steps`, `accepted`, `confirmed`, `evidence` et un code `reason` maîtrisé. Aucun message d'erreur brut du fournisseur n'est exposé.

| Statut | Sens exact |
| --- | --- |
| `declared` | Opération locale créée, sans preuve d'écriture. |
| `accepted` | Réponse d'écriture validée ; relecture encore différente. |
| `confirmed` | Une lecture indépendante observe l'état demandé pour le compte et la cible fixés. |
| `unknown` | Mutation potentiellement appliquée ou partiellement acceptée, sans état final confirmé. |
| `rejected` | Consentement, identité, réponse ou opération explicitement refusés. |
| `cancelled` | Arrêt avant toute mutation potentiellement envoyée. |
| `cooldown` | Limitation fournisseur, sans reprise automatique. |

`accepted:true` signifie qu'au moins une requête d'écriture a reçu une réponse conforme ; `accepted:null` signifie qu'aucune réponse ne permet de trancher après un envoi. `changed:true` trace au moins une écriture acceptée, sans prétendre à une propagation globale ni à un changement certain par rapport à des écritures concurrentes. `confirmed:true` vient uniquement des lectures réalisées dans cette instance, jamais d'un champ importé. `evidence` est un constat à `observedAt`, pas une preuve cryptographique ni une garantie que l'état restera identique.

Après timeout, erreur réseau, annulation après envoi ou résultat accepté non confirmé, la cible reste verrouillée : un nouveau consentement ne rejoue pas l'écriture. `reconcile` ne réalise que des lectures. Un état relu différent ne prouve pas que l'ancienne requête ne s'appliquera pas plus tard : le verrou reste en place. Une lecture conforme peut constater l'état souhaité. Aucun mécanisme de « forcer la reprise » n'est fourni.

**Limite bloquante B CONNECT :** tickets, verrou et preuves sont en mémoire seulement. Ils ne sont pas restaurés à partir d'importations. Avant une intégration réelle, il faudra une politique durable et revue des opérations indéterminées entre rechargements, onglets, nouvelles sessions et appareils. Ne pas utiliser une recréation d'orchestrateur comme contournement du verrou. Il faudra également qualifier les écritures concurrentes et les réponses tardives du fournisseur.

## Mastodon

Scopes exactement acceptés par ce contrat : `profile write:blocks read:follows`. Les scopes larges `read`, `write` et `follow` ne sont pas acceptés comme remplacement automatique.

Cible : chaîne d'ID décimal positif, préalablement résolue **sur l'instance du compte connecté**. Le module ne résout pas les handles et n'accepte pas une URL arbitraire comme cible.

- Identité : `GET /api/v1/accounts/verify_credentials`, ID strictement égal au descripteur.
- État : `GET /api/v1/accounts/relationships?id[]=ID&with_suspended=true`, exactement une relation avec le même ID et un `blocking` booléen.
- Écriture : `POST /api/v1/accounts/ID/block` ou `/unblock` ; la `Relationship` retournée ne constitue que l'acceptation. Une nouvelle lecture est indispensable.

La documentation indique que le blocage peut être retourné avant sa propagation dans les timelines. Le constat est donc limité à la relation relue sur l'instance. `read:blocks` serait une autre stratégie, avec pagination complète de `/api/v1/blocks` ; elle n'est pas implémentée ici. La recherche fédérée `resolve=true` demande `read:search`, qui n'est pas accordé par ce contrat.

OAuth navigateur : Mastodon documente encore seulement des clients confidentiels, toujours provisionnés avec `client_secret`. PKCE S256 existe depuis 4.3, mais ne transforme pas le JavaScript public en stockage confidentiel. Une inscription par navigateur est techniquement possible sous ce modèle ; elle ne doit pas être annoncée comme un vrai client public sécurisé. Le choix d'architecture, les versions d'instances, les CORS et le secret expirant doivent être qualifiés avant B CONNECT. La révocation officielle `/oauth/revoke` est idempotente ; elle n'est pas implémentée par ces modules.

Sources primaires consultées pendant la recherche du 2026-10-28 :

- [OAuth et types de clients Mastodon](https://docs.joinmastodon.org/spec/oauth/).
- [Inscription d'applications](https://docs.joinmastodon.org/methods/apps/).
- [Scopes granulaires et profile](https://docs.joinmastodon.org/api/oauth-scopes/).
- [Accounts : identité, relations, block et unblock](https://docs.joinmastodon.org/methods/accounts/).
- [Recherche et resolve](https://docs.joinmastodon.org/methods/search/).
- [Endpoints OAuth et révocation](https://docs.joinmastodon.org/methods/oauth/).
- [Quotas Mastodon](https://docs.joinmastodon.org/api/rate-limits/).
- [Source officielle du lookup](https://github.com/mastodon/mastodon/blob/main/app/controllers/api/v1/accounts/lookup_controller.rb) : sans token selon configuration ; avec token, `read:accounts` exigé ; pas de résolution WebFinger.

## Bluesky / AT Protocol

Scopes exactement acceptés : `atproto repo:app.bsky.graph.block?action=create&action=delete`. Aucun scope de messagerie, publication, profil ou `transition:generic` n'est demandé.

Cible : `{ did, rkey }`. Le DID est résolu et présenté à l'utilisateur en amont. Le rkey TID valide est créé une fois par le futur SDK qualifié, puis conservé avec l'opération avant tout envoi ; le module ne génère pas de clé de remplacement après timeout. Le repo reste toujours le DID du compte connecté.

- Identité : `com.atproto.server.getSession` vérifie le DID attendu. Le [cookbook officiel vanilla JS](https://github.com/bluesky-social/cookbook/blob/main/vanillajs-oauth-web-app/main.js) utilise cet endpoint avec `atproto` et une permission repo de création de post, sans permission RPC supplémentaire. Cela constitue une référence d'implémentation, sans remplacer une recette OAuth/PDS réelle avec nos scopes exacts.
- Prélecture/relecture : `com.atproto.repo.listRecords` sur `app.bsky.graph.block`, pages de 100, jusqu'à absence de curseur. Une limite de 100 pages maximum, un curseur bouclé, un record invalide ou une page incohérente provoquent un refus, jamais une absence supposée.
- Blocage : si un blocage du DID existe, aucune création. Sinon `createRecord` avec rkey explicite et stable ; une collision de clé avec un autre DID est refusée. Le record contient `$type`, `subject` et `createdAt`.
- Déblocage : suppression séquentielle de tous les records préalablement observés pour ce DID, chacun avec son `swapRecord` CID, puis parcours complet pour vérifier qu'aucun blocage correspondant ne subsiste. Les records d'autres DID sont préservés. Refus/conflit/annulation entre suppressions conserve l'acceptation partielle et l'incertitude.

Les blocages Bluesky sont publics : le futur consentement doit l'indiquer. Un parcours paginé ne constitue pas un snapshot transactionnel du dépôt ; des écritures concurrentes peuvent changer l'état entre pages ou après observation. La confirmation représente le constat fournisseur collecté, sans promettre une propagation instantanée dans tous les AppViews.

Le SDK officiel `@atproto/oauth-client-browser` est conçu pour les SPA sans backend ; `@atproto/api` permet `new Agent(session)`. Versions observées dans les sources `main` pendant la recherche : respectivement 0.5.11 et 0.29.5 ; aucune dépendance n'est installée ici et aucune version publiée npm n'est affirmée. Un futur bundle devra geler les releases réellement vérifiées.

L'OAuth AT Protocol exige PKCE, PAR et DPoP avec gestion de nonces, identité issuer/DID et renouvellement. Publier des métadonnées HTTPS publiques sous le `client_id`, HTTP 200 sans redirection avec `Content-Type: application/json`, et déclarer les callbacks exacts. Le SDK doit gérer ces mécanismes. Les tokens et clés DPoP ne doivent jamais entrer dans les exports, caches du service worker ou journaux de FIL CLAIR. La résolution des handles par un tiers communique IP et identifiant au résolveur.

La révocation n'est pas livrée. Dans la source officielle du SDK, `OAuthClient.revoke` efface le stockage local dans `finally`, et `OAuthServerAgent.revoke` absorbe les erreurs distantes. Sa résolution ne prouve donc pas une révocation distante ; certains access tokens peuvent encore vivre brièvement. La future interface devra distinguer suppression locale, demande de révocation et contrôle chez le fournisseur.

Sources primaires consultées :

- [Spécification OAuth AT Protocol](https://atproto.com/specs/oauth).
- [Permissions granulaires](https://atproto.com/specs/permission).
- [SDK et exemple SPA officiels](https://atproto.com/guides/about-oauth).
- [SDK navigateur : WebCrypto, IndexedDB, résolveur](https://github.com/bluesky-social/atproto/blob/main/packages/oauth/oauth-client-browser/README.md).
- [Blocage/déblocage Bluesky](https://bsky.network/docs/bluesky-api/following/).
- [Lexicon createRecord](https://github.com/bluesky-social/atproto/blob/main/lexicons/com/atproto/repo/createRecord.json), [listRecords](https://github.com/bluesky-social/atproto/blob/main/lexicons/com/atproto/repo/listRecords.json), [getRecord](https://github.com/bluesky-social/atproto/blob/main/lexicons/com/atproto/repo/getRecord.json), [deleteRecord](https://github.com/bluesky-social/atproto/blob/main/lexicons/com/atproto/repo/deleteRecord.json).
- [Quotas Bluesky](https://bsky.network/docs/rate-limits/).
- [Source OAuthClient.revoke](https://github.com/bluesky-social/atproto/blob/main/packages/oauth/oauth-client/src/oauth-client.ts), [OAuthServerAgent.revoke](https://github.com/bluesky-social/atproto/blob/main/packages/oauth/oauth-client/src/oauth-server-agent.ts).

## Recette encore bloquante

B CONNECT demeure fermé : aucun OAuth E2E réel, compte de test, action sociale, révocation réelle, test CORS/DPoP fournisseur, recette sur appareil physique ou comportement de fournisseur concurrent n'a été validé. La PWA ne référence pas ces modules et leur démarrage ne peut donc déclencher d'appel.

Avant toute intégration : revue indépendante ; transport officiel et gestion durable des opérations indéterminées ; stockage de session et effacement ; origine/callbacks/métadonnées HTTPS ; CSP compatible avec les destinations autorisées sans ouvrir toutes les origines HTTPS ; exclusions du service worker ; consentement accessible et publicisation des blocs Bluesky ; comptes dédiés et protocole autorisé ; tests Android/iOS réels. Une future fonction serveur devra aussi filtrer DNS/IP/redirects pour éviter les SSRF. Les simulations locales ne ferment aucun de ces critères.

Aucune fusion `main`, publication générale ou action sur compte réel n'est autorisée par cette livraison. Voir `WORK_MISSION_FIL_CLAIR.md` et `evidence/2026-10-28-connectors.md`.
