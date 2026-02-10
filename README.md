# Simple POS

A production-ready, cross-platform Point-of-Sale system built with **Angular**, **Tauri**, and **NestJS** in an **Nx Monorepo**.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20+
- **pnpm**: 10+
- **Rust**: 1.93+ (for desktop development)

### Installation

```bash
pnpm install
# Set up environment variables
cp apps/api/.env.example apps/api/.env
```

### Development Commands

| Command          | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `pnpm dev`       | Start full stack (POS Frontend + API Backend)              |
| `pnpm dev:pos`   | Start POS Frontend only (Web Mode - http://localhost:4200) |
| `pnpm dev:api`   | Start API Backend only (http://localhost:3000/api)         |
| `pnpm dev:tauri` | Start Desktop App (Native Mode)                            |
| `pnpm test`      | Run tests across the workspace                             |
| `pnpm nx graph`  | Visualize project dependencies                             |

---

## 🏗️ Project Architecture

This project follows **Clean Architecture** principles and uses a **Dual Repository Pattern** to support both web (IndexedDB) and desktop (SQLite) persistence.

### Workspace Structure (`/`)

- **apps/**
  - `pos`: Angular frontend (UI, Application, Infrastructure layers)
  - `api`: NestJS backend (API endpoints, Auth, Multi-tenancy)
  - `native`: Tauri host application
- **libs/**
  - `domain`: Pure business logic and rules (Platform agnostic)
  - `shared/types`: Shared interfaces, enums, and DTOs
  - `shared/utils`: Common utilities (Date, Formatting, Validation)

### Dependency Flow

`UI` → `Application` → `Domain` ← `Infrastructure`

---

## 🛡️ Best Practices & Standards

### Coding Standards

- **State Management**: Use **Angular Signals** (`signal`, `computed`, `effect`) over Observables for synchronous state.
- **Components**: Use **Standalone Components** exclusively.
- **Type Safety**: strict mode, no `any`, explicit return types.
- **Async**: Use `async/await` with try/catch blocks.

### Database & Persistence

- **Dual Repositories**: Every entity needing local storage must have:
  - `sqlite-*.repository.ts` (Desktop)
  - `indexeddb-*.repository.ts` (Web)
- **Selection**: Logic is handled via `RepositoryFactory` and `PlatformService`.

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

**Scopes**: `pos`, `api`, `native`, `domain`, `shared-types`
**Examples**:

- `feat(pos): add receipt printing`
- `fix(api): correct jwt validation logic`

---

## 📚 Documentation

- [Architecture Guide](docs/architecture.md)
- [PRD](docs/prd.md)
- [Contributing Guidelines](CONTRIBUTING.md)
