<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (build, lint, test, e2e), prefer `nx` (`nx run`, `nx run-many`, `nx affected`).
- Use Nx MCP tools when you need workspace or project details.
- For Nx configuration questions, consult `nx_docs` rather than assuming.
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md` when available.

<!-- nx configuration end-->

# AI Agent Rules for Simple POS

## Project Overview

Simple POS is a production-ready, offline-capable POS system in an Nx monorepo:

- **Frontend:** Angular 21 (Signals, standalone components) in `apps/pos`
- **Desktop:** Tauri 2 in `apps/native`
- **Styling:** TailwindCSS 4 with glassmorphism utilities
- **Data:** IndexedDB (web) + SQLite (desktop)
- **Architecture:** Clean Architecture with dual repositories
- **Language:** TypeScript 5.9 (strict)
- **Package manager:** pnpm 10+

## Workspace Structure (Current)

```
simple-pos/
├── apps/
│   ├── pos/            # Angular POS frontend
│   └── native/         # Tauri host (src-tauri)
├── libs/
│   ├── domain/         # Pure calculations and rules
│   └── shared/
│       ├── types/      # Interfaces and enums
│       └── utils/      # Utilities (date, validation)
├── docs/               # Architecture and PRD
└── scripts/            # Maintenance scripts
```

## Commit Message Requirements (CRITICAL)

Conventional Commits are required:

```
<type>(<scope>): <subject>
```

Scopes: `pos`, `native`, `domain`, `shared-types`, `shared-utils`, `deps`

Examples:

```
feat(pos): add receipt printing support
fix(native): resolve sqlite migration error
chore(deps): update tauri-apps/api
```

## Coding Standards

- **Signals over Observables** for new reactive state.
- **Standalone components** only (no NgModules).
- **Async/await** for service/repository methods, with try/catch.
- **Dual repository pattern** for each entity: `sqlite-*.repository.ts` and `indexeddb-*.repository.ts`.
- **Platform-specific logic** goes through `PlatformService` and `RepositoryFactory`.
- **No `any`**; keep strict typing.
- **Shared imports** use aliases: `@simple-pos/*`.

## Architecture Rules

Dependency flow: UI -> Application -> Domain <- Infrastructure.

- Domain: `libs/domain` and `libs/shared/types`
- Application: `apps/pos/src/app/application`
- Infrastructure: `apps/pos/src/app/infrastructure`
- UI: `apps/pos/src/app/ui`

## Testing

- **Vitest** for unit tests.
- Use `pnpm nx test <project>` for project tests.
- When testing UI/services, mock `PlatformService` and `RepositoryFactory`.

## Common Commands

```
pnpm start            # Start POS (web)
pnpm run tauri:dev    # Start Tauri (desktop)
pnpm nx test pos      # Run POS tests
pnpm nx test domain   # Run domain tests
```
