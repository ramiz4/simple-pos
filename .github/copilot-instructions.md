# GitHub Copilot Custom Instructions for Simple POS

## Project Overview

This is a **production-ready Point-of-Sale (POS) system** built with **Angular 21** and **Tauri 2**, currently transitioning to an **Nx Monorepo (Phase 0.5)** for SaaS transformation. It supports both web (PWA) and native desktop platforms with offline-first capabilities and dual-platform persistence (IndexedDB/SQLite).

### Tech Stack

- **Monorepo**: Nx with pnpm workspaces
- **Frontend**: Angular 21.1.2 (standalone components, Signals API)
- **Desktop Runtime**: Tauri 2.9.6 (Rust-based native wrapper)
- **Styling**: TailwindCSS 4.1.18 with custom glassmorphism utilities
- **Data Storage**: IndexedDB (Web) and SQLite (Desktop @tauri-apps/plugin-sql)
- **Language**: TypeScript 5.9.2 (strict mode)
- **Package Manager**: **pnpm 10+** (enforced)
- **Testing**: Vitest 4.0.8 with jsdom

---

## Workspace Structure (Nx Monorepo)

Following Phase 0.5 restructuring, the project is organized into `apps` and `libs`:

```
simple-pos/
├── apps/
│   ├── pos/                         # 🖥️ Angular POS frontend
│   │   └── src/app/
│   │       ├── application/        # Services (Business Logic)
│   │       ├── infrastructure/     # Persistence (Repositories)
│   │       ├── ui/                 # Components, Pages, Layouts
│   │       └── core/               # Guards, Interceptors
│   ├── api/                         # 🚀 NestJS Backend API
│   │   └── src/
│   │       ├── app/                # Controllers, Modules, Services
│   │       └── main.ts             # Bootstrap
│   └── native/                      # 🦀 Tauri Desktop Host (src-tauri)
│
├── libs/
│   ├── shared/
│   │   ├── types/                  # 📦 @simple-pos/shared/types (Interfaces, Enums)
│   │   └── utils/                  # 🔧 @simple-pos/shared/utils (Date, Validation)
│   └── domain/                      # 🏛️ @simple-pos/domain (Pure calculations, rules)
│
├── scripts/                         # 🔨 Maintenance scripts
└── docs/                            # 📚 Migration and architecture docs
```

---

## ⚠️ CRITICAL: Commit Message Requirements

**Automated semantic versioning is enforced.** All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format & Scopes

```bash
<type>(<scope>): <subject>

# Scopes: pos, api, native, domain, shared-types, shared-utils, deps
feat(pos): add receipt printing support
feat(api): add health check endpoint
fix(native): resolve SQLite migration error
chore(deps): update tauri-apps/api
```

### Version Bumps

- `feat:` -> **minor** (1.16.x -> 1.17.0)
- `fix:` -> **patch** (1.16.0 -> 1.16.1)
- `feat!:` or `BREAKING CHANGE:` -> **major** (1.x.x -> 2.0.0)

---

## Architecture Guidelines

### Clean Architecture Layers

**Strict dependency flow**: UI → Application → Domain ← Infrastructure

1.  **Domain Layer** (`libs/domain`, `libs/shared/types`): Pure TypeScript, framework-agnostic.
2.  **Application Layer** (`apps/pos/.../application`): Services orchestrating business logic.
3.  **Infrastructure Layer** (`apps/pos/.../infrastructure`): Data persistence (Dual Repositories).
4.  **UI Layer** (`apps/pos/.../ui`): Presentation only. Only injects Services.

### Dual Repository Pattern

Every data entity MUST have two repository implementations:

- `sqlite-*.repository.ts` (Tauri Desktop)
- `indexeddb-*.repository.ts` (Web/PWA)

**Accessing Data**:
Always inject via `RepositoryFactory` (Adapter pattern) which detects the platform using `PlatformService`.

---

## Coding Standards

### TypeScript & Angular

- **Standalone Components**: (No NgModules)
- **Angular Signals**: Use `signal`, `computed`, `effect` for reactive state.
- **Control Flow**: Use `@if`, `@for`, `@switch` in templates.
- **Async/Await**: Mandatory for all service and repository methods.
- **Import Aliases**: Always use `@simple-pos/*` aliases for libs:
  ```typescript
  import { Product } from '@simple-pos/shared/types';
  import { calculateTotal } from '@simple-pos/domain';
  ```

---

## Critical Commands

### Development

```bash
pnpm pos:dev                # Start Angular POS (Web)
pnpm tauri:dev              # Start Tauri Host (Desktop)
pnpm nx test pos            # Run tests for POS app
pnpm nx test domain         # Run tests for domain lib
```

### Monorepo Management

```bash
pnpm nx graph               # Visualize dependencies
pnpm nx g @nx/js:lib <name> # Create new library
pnpm nx lint <project>      # Check linting
```

---

## Testing Patterns

- **Vitest**: used for all unit tests.
- **Mocks**: Mock `PlatformService` and `RepositoryFactory` when testing UI/Services.
- **Dual Testing**: Ensure services are logic-tested for both `isTauri()` being true and false.
- **Integration**: `src/app/integration/*.spec.ts` for end-to-end flow validation.

---

## Security

- **Authentication**: PINs are hashed via `bcryptjs`. Never log or store plain-text.
- **Platform Guards**: Use `authGuard`, `staffGuard`, and `adminGuard` in `app.routes.ts`.
- **Validation**: Sanitize user inputs using `InputSanitizerService` before they reach repositories.

---

## Security & Best Practices

### Authentication

- **Passwords are hashed** using bcryptjs before storage
- **Never store plain-text passwords**
- Use `AuthService.hashPassword()` and `AuthService.comparePassword()`
- Check authentication with `AuthGuard` on protected routes

### Data Validation

- **Always validate user input** before processing
- Use Angular's `Validators` for form validation
- Perform server-side validation in services

### Error Handling

- **Always use try-catch** in async methods
- **Log errors** for debugging
- **Show user-friendly error messages** in UI
- Use signals for error state:
  ```typescript
  private _error = signal<string | null>(null);
  error = this._error.asReadonly();
  ```

---

## Code Review Checklist

When reviewing code changes, verify:

- [ ] **Architecture compliance**: Changes respect Clean Architecture layers
- [ ] **Shared code**: Types/utilities placed in `libs/` not duplicated
- [ ] **Type safety**: No `any` types, all interfaces properly defined
- [ ] **Dual repositories**: Both SQLite and IndexedDB versions implemented if data access changed
- [ ] **Standalone components**: No NgModule usage
- [ ] **Signals over Observables**: New reactive state uses Signals API
- [ ] **Async/await**: No callback-style promises
- [ ] **Error handling**: Try-catch blocks in async methods
- [ ] **Testing**: Tests added/updated for new functionality
- [ ] **Mobile-first**: Responsive design with Tailwind utilities
- [ ] **Package manager**: Only `pnpm` commands used
- [ ] **Platform awareness**: Platform-specific code uses PlatformService
- [ ] **Security**: No credentials in code, passwords hashed, input validated
- [ ] **Commit scope**: Conventional commit with proper scope (pos, api, shared-types, etc.)

---

## Useful References

- **Angular Signals**: https://angular.dev/guide/signals
- **Standalone Components**: https://angular.dev/guide/components/importing
- **Nx Documentation**: https://nx.dev/getting-started/intro
- **NestJS**: https://docs.nestjs.com/
- **Tauri API**: https://tauri.app/v2/reference/javascript/
- **TailwindCSS**: https://tailwindcss.com/docs
- **Vitest**: https://vitest.dev/

---

## Quick Command Reference

```bash
# Development
pnpm dev                    # Start all (frontend + backend)
pnpm pos:dev                # Start Angular frontend only
pnpm api:dev                # Start NestJS backend only
pnpm tauri:dev              # Start desktop dev

# Building
pnpm pos:build              # Build Angular frontend
pnpm api:build              # Build NestJS backend
pnpm tauri:build            # Build desktop app

# Testing
pnpm test                   # Run all tests
pnpm nx test pos            # Test specific project
pnpm nx affected:test       # Test affected projects only

# Code Quality
pnpm run lint               # Lint code
pnpm run format             # Format with Prettier
pnpm nx graph               # View dependency graph

# Code Generation
pnpm nx g @nx/angular:component <name> --project=pos
pnpm nx g @nx/nest:service <name> --project=api

# Dependencies
pnpm add <pkg>              # Add dependency
pnpm add -D <pkg>           # Add dev dependency
```

---

## Questions or Issues?

When in doubt:

1. Check existing similar code in the repository
2. Follow the Clean Architecture principles
3. Place shared code in `libs/` directory
4. Use TypeScript strict mode features
5. Test on both web and desktop platforms
6. Keep changes minimal and focused

Happy coding! 🚀
