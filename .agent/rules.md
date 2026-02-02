# AI Agent Rules for Simple POS

## Project Overview

Simple POS is a modern, offline-capable Point-of-Sale system built with:

- **Frontend:** Angular 19 with Signals
- **Desktop:** Tauri v2
- **Database:** SQLite (desktop) / IndexedDB (web)
- **Architecture:** Clean Architecture with Repository Pattern
- **Styling:** TailwindCSS v4

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

### Examples

```bash
# ✅ CORRECT
feat: add receipt printing support
fix: resolve cart calculation error
feat!: redesign authentication system
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
feat!: migrate to new database schema

BREAKING CHANGE: Old data format is incompatible
```

## Code Style Guidelines

### TypeScript/Angular

- Use **Signals** for reactive state (not RxJS Observables)
- Follow **Clean Architecture** layers:
  - Domain: Pure business logic
  - Application: Use cases and services
  - Infrastructure: Data access (repositories)
  - Presentation: UI components
- Use **Repository Pattern** for all data access
- Prefer **standalone components** (no NgModules)
- Use **inject()** function for dependency injection

### File Naming

- Components: `kebab-case.component.ts`
- Services: `kebab-case.service.ts`
- Repositories: `kebab-case.repository.ts`
- Interfaces: `PascalCase` (e.g., `BaseRepository<T>`)

### Styling

- Use **TailwindCSS v4** utility classes
- Custom utilities in `src/styles.css`
- Mobile-first responsive design
- Glassmorphism effects for premium UI

## Testing

- Use **Vitest** for unit tests
- Test files: `*.spec.ts`
- Run tests: `pnpm test`

## Build & Release

### Local Development

```bash
pnpm start          # Web mode (browser)
pnpm tauri:dev      # Desktop mode (Tauri)
pnpm build          # Build web
pnpm tauri build    # Build desktop
```

### Automated Releases

- **Trigger:** Push to `main` branch
- **Process:** Semantic-release analyzes commits → bumps version → creates tag → triggers release workflow
- **Output:** Signed desktop apps (DMG, AppImage, MSI) + GitHub Release

## Important Files

- `src-tauri/tauri.key` - **NEVER commit** (git-ignored signing key)
- `src-tauri/tauri.key.pub` - Public key (committed)
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

1. **Always use conventional commits**
2. Follow Clean Architecture layers
3. Use Signals for reactive state
4. Test your changes (`pnpm test`)
5. Ensure build works (`pnpm build`)
6. For desktop changes, test with `pnpm tauri:dev`

## Documentation

- Update `README.md` for user-facing changes
- Update `docs/` for architecture changes
- Update `CONTRIBUTING.md` for process changes
- Generate CHANGELOG automatically (semantic-release)

## Questions?

See:

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) - Detailed contributing guide
- [`docs/architecture.md`](../docs/architecture.md) - Architecture overview
- [`docs/technical-details.md`](../docs/technical-details.md) - Technical details
