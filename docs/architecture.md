# Simple POS - Architecture Documentation

## Overview

**Simple POS v1.20.0** is a production-ready, cross-platform Point-of-Sale system built with **Clean Architecture** principles and **Nx Monorepo**. It supports **Local-First**, **SaaS**, and **On-Premise** deployments capabilities from a single codebase.

## Technology Stack

| Component     | Tech Stack                                                |
| :------------ | :-------------------------------------------------------- |
| **Frontend**  | Angular 21.1.2 (Standalone, Signals), TailwindCSS 4, RxJS |
| **Desktop**   | Tauri 2.9.6 (Rust), SQLite (`@tauri-apps/plugin-sql`)     |
| **Web (PWA)** | IndexedDB, `@angular/service-worker`, LocalStorage        |
| **Backend**   | NestJS 10+, PostgreSQL 16+ (Prisma v7), Redis             |
| **Tooling**   | Nx 22.4.5, pnpm 10+, Vitest, ESLint, GitHub Actions       |

## Project Structure (Nx Monorepo)

```
simple-pos/
├── apps/
│   ├── pos/            # Angular Frontend (UI, Logic, Local Repos)
│   ├── api/            # NestJS Backend (Sync, Multi-tenancy)
│   └── native/         # Tauri Host (Rust wrapper)
├── libs/
│   ├── domain/         # Pure business logic (Calculations)
│   └── shared/
│       ├── types/      # Shared Interfaces, Enums, DTOs
│       └── utils/      # Shared Utilities (Date, Validation)
└── docs/               # Architecture & PRD
```

**Key Libraries**:

- `@simple-pos/shared/types`: Entities (`Product`, `Order`), Enums.
- `@simple-pos/domain`: Tax rules, total calculations (Framework-agnostic).
- `@simple-pos/shared/utils`: Helpers used by both FE and BE.

## Clean Architecture & Data Access

The system follows a strict dependency rule: `UI -> Application -> Domain <- Infrastructure`.

### Dual Repository Pattern

Every entity has two implementations managed by a `RepositoryFactory`:

1.  **SQLite (Desktop)**: Direct SQL via Tauri plugin.
2.  **IndexedDB (Web)**: Browser-native object storage.

The `BaseRepository<T>` interface ensures strictly identical behavior across platforms.

### Core Services

- **AuthService**: Handles Hybrid Auth (Local PIN + Cloud JWT).
- **OrderService**: Manages lifecycle (OPEN → COMPLETED) & Sync status.
- **CartService**: Multi-context carts (Table/Takeaway) using **Angular Signals**.
- **SyncEngine**: Background bidirectional sync with conflict resolution.

## SaaS & Cloud Architecture

### Unified Deployment Diagram

```
[ Angular Frontend ] ◄── (Sync/Offline) ──► [ Local DB (SQLite/IDB) ]
         │                                         ▲
    (HTTP/WS)                                (Sync Push/Pull)
         ▼                                         ▼
[ Load Balancer ] ──► [ NestJS API ] ◄──► [ PostgreSQL (RLS) ]
                                     ◄──► [ Redis (Cache/Jobs) ]
```

### Multi-Tenancy Strategy

- **Isolation**: Single DB with **Row-Level Security (RLS)** enforcing `tenant_id`.
- **Identification**: Subdomain (`tenant.pos.com`) & `X-Tenant-ID` header.
- **Data Model**: All entities include `tenantId`, `cloudId` (UUID), `localId`, and `version`.

### Synchronization Engine

**Protocol**: Bidirectional Sync with Conflict Resolution (`SERVER_WINS`, `LAST_WRITE_WINS`, `MANUAL`).

- **Push**: Upload `ChangeSet` (Create/Update/Delete) to Cloud.
- **Pull**: Download changes since `lastSyncedAt`.

## Security Architecture

- **Authentication**:
  - **Local**: PIN-based (bcrypt hashed).
  - **Cloud**: JWT (Access + Refresh Tokens).
  - **SSO**: SAML/OIDC for Enterprise tenants.
- **Authorization**: RBAC (Admin, Cashier, Kitchen, Driver).
- **Compliance**: Audit logging, encrypted backups, TLS 1.3.

## Deployment Strategy

| Mode            | Database         | Hosting        | Use Case                         |
| :-------------- | :--------------- | :------------- | :------------------------------- |
| **Local-First** | SQLite/IndexedDB | Static / Local | Single device, offline-only      |
| **SaaS**        | PostgreSQL (RLS) | Kubernetes     | Multi-tenant, subscription-based |
| **On-Premise**  | PostgreSQL       | Docker/Helm    | Enterprise, data sovereignty     |

## Development & Testing

- **Commands**: `pnpm dev`, `pnpm build`, `pnpm test`.
- **Testing**: Vitest (Unit), Cypress/Playwright (E2E).
- **CI/CD**: GitHub Actions (Trunk-based).
