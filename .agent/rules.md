# AI Agent Rules for Simple POS

## Project Overview

Simple POS is a modern, offline-capable Point-of-Sale system structured as an **Nx monorepo**:

- **Monorepo Tool:** Nx (with pnpm workspaces)
- **Frontend:** Angular 21 with Signals (`apps/pos`)
- **Backend:** NestJS (`apps/api`) - for SaaS/cloud sync
- **Desktop:** Tauri v2 (`apps/desktop`)
- **Shared Libraries:** `libs/shared/types`, `libs/domain`, `libs/shared/utils`
- **Database:** SQLite (desktop) / IndexedDB (web) / PostgreSQL (cloud)
- **Architecture:** Clean Architecture with Repository Pattern
- **Styling:** TailwindCSS v4

## Monorepo Structure

```
simple-pos/
├── apps/
│   ├── pos/              # Angular 21 POS frontend
│   ├── api/              # NestJS backend (SaaS)
│   ├── desktop/          # Tauri wrapper
│   └── admin-portal/     # (Future) Super admin dashboard
├── libs/
│   ├── shared/
│   │   ├── types/        # Shared TypeScript interfaces
│   │   ├── utils/        # Common utilities
│   │   └── constants/    # Shared constants
│   └── domain/           # Domain logic (validators, calculations)
├── tools/                # Custom scripts, generators
├── docs/                 # Documentation
├── nx.json               # Nx configuration
└── pnpm-workspace.yaml   # pnpm workspace config
```

## Commit Message Requirements

**CRITICAL:** This project uses automated semantic versioning. All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/) format.

### Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Required Types

- `feat`: New feature → **minor** version bump (0.1.0 → 0.2.0)
- `fix`: Bug fix → **patch** version bump (0.1.0 → 0.1.1)
- `feat!`: Breaking change → **major** version bump (0.1.0 → 1.0.0)
- `docs`: Documentation changes (no release)
- `style`: Code style/formatting (no release)
- `refactor`: Code refactoring (no release)
- `perf`: Performance improvements (no release)
- `test`: Test changes (no release)
- `chore`: Maintenance tasks (no release)
- `ci`: CI/CD changes (no release)

### Scopes (Monorepo)

Use the app or lib name as scope:

```bash
feat(pos): add receipt printing support
fix(api): resolve authentication token refresh
feat(shared-types): add sync protocol interfaces
chore(domain): update price calculation logic
```

### Examples

```bash
# ✅ CORRECT
feat(pos): add receipt printing support
fix(api): resolve cart calculation error
feat(shared-types)!: redesign entity interfaces
docs: update installation guide
chore: upgrade dependencies

# ❌ INCORRECT
Add receipt printing
Fixed bug
Update README
```

### Breaking Changes

Use `!` after type OR add `BREAKING CHANGE:` in footer:

```
feat(api)!: migrate to new database schema

BREAKING CHANGE: Old data format is incompatible
```

## Code Style Guidelines

### TypeScript/Angular

- Use **Signals** for reactive state (not RxJS Observables)
- Follow **Clean Architecture** layers:
  - Domain: Pure business logic (`libs/domain`)
  - Application: Use cases and services
  - Infrastructure: Data access (repositories)
  - Presentation: UI components
- Use **Repository Pattern** for all data access
- Prefer **standalone components** (no NgModules)
- Use **constructor injection** for dependency injection

### File Naming

- Components: `kebab-case.component.ts`
- Services: `kebab-case.service.ts`
- Repositories: `kebab-case.repository.ts`
- Interfaces: `PascalCase` (e.g., `BaseRepository<T>`)

### Styling

- Use **TailwindCSS v4** utility classes
- Custom utilities in `apps/pos/src/styles.css`
- Mobile-first responsive design
- Glassmorphism effects for premium UI

### Shared Code Imports

```typescript
// Import shared types from libs
import { Product, Order } from '@simple-pos/shared/types';
import { calculateOrderTotal } from '@simple-pos/domain';
```

## Testing

- Use **Vitest** for unit tests
- Test files: `*.spec.ts`
- Run tests: `pnpm test` or `pnpm nx test <project>`
- Run affected tests: `pnpm nx affected:test`

## Build & Development

### Local Development

```bash
pnpm dev               # Start frontend + backend concurrently
pnpm nx serve pos      # Angular dev server only
pnpm nx serve api      # NestJS backend only
pnpm tauri:dev         # Desktop mode (Tauri)
```

### Production Builds

```bash
pnpm nx build pos      # Build Angular frontend
pnpm nx build api      # Build NestJS backend
pnpm tauri build       # Build desktop app
```

### Nx Commands

```bash
pnpm nx affected:test   # Test only affected projects
pnpm nx affected:build  # Build only affected projects
pnpm nx graph           # Visualize project dependencies
pnpm nx g @nx/angular:component <name> --project=pos
pnpm nx g @nx/nest:service <name> --project=api
```

### Automated Releases

- **Trigger:** Push to `main` branch
- **Process:** Semantic-release analyzes commits → bumps version → creates tag → triggers release workflow
- **Output:** Signed desktop apps (DMG, AppImage, MSI) + GitHub Release

## Important Files

- `nx.json` - Nx configuration
- `pnpm-workspace.yaml` - Workspace configuration
- `apps/*/project.json` - Per-app Nx project configuration
- `libs/*/project.json` - Per-library Nx project configuration
- `.releaserc.json` - Semantic-release configuration
- `CONTRIBUTING.md` - Detailed contributing guide

## Platform Detection

```typescript
platformService.isTauri(); // true in desktop mode
platformService.isWeb(); // true in browser mode
```

## Repository Pattern

All data access goes through repositories:

```typescript
// ✅ CORRECT
constructor(private repository: BaseRepository<Entity>) {}

// ❌ INCORRECT - Don't access DB directly
constructor(private db: Database) {}
```

## When Making Changes

1. **Always use conventional commits** with proper scope
2. Follow Clean Architecture layers
3. Use Signals for reactive state
4. Place shared code in `libs/` not duplicated across apps
5. Test your changes (`pnpm nx affected:test`)
6. Ensure build works (`pnpm nx affected:build`)
7. For desktop changes, test with `pnpm tauri:dev`

## Documentation

- Update `README.md` for user-facing changes
- Update `docs/` for architecture changes
- Update `CONTRIBUTING.md` for process changes
- Generate CHANGELOG automatically (semantic-release)

## Questions?

See:

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) - Detailed contributing guide
- [`docs/architecture.md`](../docs/architecture.md) - Architecture overview
- [`docs/SAAS-ONPREM-TRANSFORMATION.md`](../docs/SAAS-ONPREM-TRANSFORMATION.md) - SaaS/On-Prem roadmap
