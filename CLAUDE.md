## Domaine

ms-post gere les agregats `Post` (id, authorId, title, content, saga_status, eventId?) et `Comment`
(id, postId, authorId, content, saga_status), definis dans le package partage `@volontariapp/domain-post`
(npm-packages/packages/domain-post). Le service NestJS ne contient aucune logique metier propre : les
controllers gRPC delegent tout a `PostService`/`CommentService` importes de ce package. Les entites
TypeORM et migrations locales (src/migrations/domain) sont des copies synchronisees depuis ce package.

Invariants observes dans domain-post :

- `title` a une contrainte UNIQUE en base (migration `AddUniqueConstraintToPostTitle`) -> code Postgres
  23505 mappe vers `POST_ALREADY_EXISTS`.
- Seul l'auteur d'un post/commentaire (ou un `UserRoles.ADMIN`) peut le modifier/supprimer, sinon
  `ForbiddenError` (`PostService.update/delete`, `CommentService.delete`).
- Un commentaire ne peut etre cree que si le `Post` cible existe (`CommentService.create` verifie
  `postRepository.findById` avant insertion, sinon `POST_NOT_FOUND`).
- Colonne `saga_status` (enum `PENDING|DONE|CANCEL`, migration `AddSagaStatusToPost`) sur `posts` et
  `comments` : ms-post ne la met a jour lui-meme nulle part (pas de consumer BullMQ dans ce repo) ;
  c'est le service separe `worker-post` (workers-runners/worker-post) qui consomme la queue BullMQ
  `PostQueue.POST` et pilote ce statut de saga.

## Evenements emis (transactional outbox)

Emis via `EventQueueEntity.createEvent` dans la meme transaction TypeORM que l'ecriture SQL
(`PostgresPostRepository.createWithPostCreated` / `.deleteWithPostDeleted`, table `event_queue`) :

- `post.created` (`PostEventMessagingType.POST_CREATED`, target stream `Streams.POST_CREATED`) —
  payload `{ postId, eventId?, userId? }`.
- `post.deleted` (`PostEventMessagingType.POST_DELETED`, target stream `Streams.POST_DELETED`) —
  payload `{ postId, userId? }`.

Aucun evenement consomme directement par ms-post : c'est un service gRPC command/query pur (pas de
`BullModule`/consumer dans `app.module.ts`).

## gRPC expose (PostService, proto-registry/proto/volontariapp/post)

Implementes dans `PostCommandController`/`PostQueryController` :
`CreatePost`, `UpdatePost`, `DeletePost`, `CreateComment`, `DeleteComment`, `GetPost`, `ListPosts`,
`ListComments`.

Definis dans `post.services.proto` mais **non implementes** cote ms-post (pas de handler trouve dans
src/) : `AdminCreatePost`, `DeleteMyPosts` (seuls les DTO de reponse existent dans
`dto/response/post.response.dto.ts`).

`GetPost`/`ListPosts` enrichissent la reponse via un appel gRPC sortant vers ms-social
(`SocialEventPostLinkQueryClientService` -> `EventPostLinkQueryService.getEventRelatedToPost(s)`) pour
resoudre `post.eventId`, uniquement si un `x-internal-token` est present.

## Package partage

`@volontariapp/domain-post` (source dans `npm-packages/packages/domain-post`) fournit entites, modeles
TypeORM, repositories Postgres (avec outbox integre) et services `PostService`/`CommentService`. Toute
evolution de regle metier doit se faire dans ce package, pas dans ms-post.

---

## 🚀 RTK - Rust Token Killer (Optimized)

All shell commands (`git`, `npm`, `jest`, etc.) are automatically proxied via `rtk` for 80% token savings.

- **Direct Usage:** `rtk gain` (analytics), `rtk discover` (missed savings).
- **Files:** Use `rtk read <file>`, `rtk ls`, `rtk find`, `rtk grep` for compressed agent output.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
