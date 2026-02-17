<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

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
pnpm pos:dev          # Start POS (web)
pnpm tauri:dev        # Start Tauri (desktop)
pnpm nx test pos      # Run POS tests
pnpm nx test domain   # Run domain tests
```
