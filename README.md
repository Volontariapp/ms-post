# Microservice Post (ms-post)

## Project Overview & Value Proposition

Le microservice **`ms-post`** gère la création, la lecture et l'interaction (commentaires, likes) avec les publications (Posts) au sein de la plateforme Volontariapp. C'est un service backend headless communicant exclusivement via des interfaces gRPC.

De la même manière que les autres microservices de la plateforme, `ms-post` bénéficie d'une architecture hautement découplée et réutilisable. Il reçoit ses requêtes de l'API Gateway accompagnées d'un Token Interne garantissant le contexte de sécurité et d'autorisation, lui permettant de se focaliser uniquement sur l'orchestration des cas d'usages métier.

## Key Features

- **Gestion des Publications** : Création, édition, suppression et récupération des flux d'actualité (Posts).
- **Architecture Contract-First (gRPC)** : Exposition de services gRPC définis et versionnés dans le dépôt central `proto-registry`.
- **Délégation de l'Autorisation** : Utilisation du Token Interne (transmis par l'API Gateway) pour identifier l'utilisateur effectuant l'action sans logique RBAC locale complexe.
- **Outbox Pattern** : Publication fiable des événements de domaine asynchrones (ex: `PostCreated`, `CommentAdded`) sans risque de double-écriture grâce à `outbox-runners`.
- **Réutilisabilité Métier (DRY)** : Logique métier entièrement centralisée dans le paquet interne `@volontariapp/domain-post`.

## Tech Stack & Dependencies

| Composant                 | Technologie                     | Usage / Rôle                                              |
| :------------------------ | :------------------------------ | :-------------------------------------------------------- |
| **Framework Base**        | NestJS                          | Injection de dépendances et structure modulaire.          |
| **Logique Métier**        | `@volontariapp/domain-post`     | Librairie partagée contenant les entités (DDD).           |
| **Persistance**           | PostgreSQL & TypeORM            | Base de données relationnelle pour le stockage des posts. |
| **Messagerie Asynchrone** | BullMQ / `@volontariapp/outbox` | Implémentation du pattern Outbox.                         |
| **Communication RPC**     | gRPC (`@grpc/grpc-js`)          | Transport réseau interne.                                 |

## Getting Started

### Prérequis

- **Node.js** (>= 24.14.0)
- **Package Manager** : Yarn v4 (`corepack enable`)
- Accès à l'infrastructure locale PostgreSQL et Redis.

### Installation & Exécution

```bash
cd ms-post
yarn install

# Lancement en mode développement avec Hot-Reload
yarn start:dev

# Génération et exécution des migrations
yarn migration:generate
yarn migration:run:dev
```

## Testing & CI/CD

Les tests E2E nécessitent une infrastructure complète de base de données, instanciée via des conteneurs isolés orchestrés par le sous-module `ci-tools`.
Le déploiement est piloté par des workflows GitHub Actions (validation, build d'image Docker OCI) déployés ensuite via l'orchestrateur GitOps.
