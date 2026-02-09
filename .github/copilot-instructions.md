# GitHub Copilot Custom Instructions for Simple POS

## Project Overview

This is a **modern Point-of-Sale (POS) system** built as an **Nx monorepo** with Angular 21 and Tauri 2, designed for both web browsers and desktop platforms with offline-first capabilities. The project is preparing for SaaS transformation with a NestJS backend.

### Tech Stack

- **Monorepo:** Nx with pnpm workspaces
- **Frontend**: Angular 21.1.2 (standalone components, Signals API) - `apps/pos`
- **Backend**: NestJS (for SaaS/cloud sync) - `apps/api`
- **Desktop Runtime**: Tauri 2.9.6 (native desktop app) - `apps/desktop`
- **Shared Libraries**: `libs/shared/types`, `libs/domain`, `libs/shared/utils`
- **Styling**: TailwindCSS 3.4.19 with custom glassmorphism utilities
- **State Management**: Angular Signals for reactive state
- **Data Storage**:
  - **Web**: IndexedDB (browser storage)
  - **Desktop**: SQLite (via Tauri plugin)
  - **Cloud**: PostgreSQL (SaaS backend)
- **Language**: TypeScript 5.9.2 (strict mode enabled)
- **Build Tool**: Vite 7.3.1
- **Package Manager**: **pnpm 10.2.1** (enforced - always use `pnpm` commands)
- **Testing**: Vitest 4.0.8 with jsdom environment

---

## Monorepo Structure

```
simple-pos/
├── apps/
│   ├── pos/                      # 🖥️ Angular 21 POS frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── domain/       # Entities, enums
│   │   │   │   ├── application/  # Services
│   │   │   │   ├── infrastructure/ # Repositories
│   │   │   │   └── ui/           # Components, pages
│   │   │   └── styles.css
│   │   └── project.json
│   ├── api/                      # 🌐 NestJS backend
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── sync/
│   │   └── project.json
│   ├── desktop/                  # 🖥️ Tauri wrapper
│   └── admin-portal/             # 🔧 (Future) Super admin dashboard
│
├── libs/
│   ├── shared/
│   │   ├── types/                # 📦 Shared TypeScript interfaces
│   │   │   └── src/
│   │   │       ├── entities/     # Product, Order, User, etc.
│   │   │       ├── dtos/         # API request/response DTOs
│   │   │       └── sync/         # Sync protocol types
│   │   ├── utils/                # 🔧 Common utilities
│   │   └── constants/            # 📝 Shared constants
│   │
│   └── domain/                   # 🏛️ Domain logic
│       └── src/
│           ├── validators/
│           └── calculations/     # Price calc, tax, discounts
│
├── tools/                        # 🔨 Custom scripts, generators
├── docs/                         # 📚 Documentation
├── nx.json                       # Nx configuration
├── pnpm-workspace.yaml           # pnpm workspace config
└── tsconfig.base.json            # Shared TypeScript config
```

---

## ⚠️ CRITICAL: Commit Message Requirements

**This project uses automated semantic versioning.** All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/) format.

### Commit Format

```
<type>(<scope>): <subject>
```

### Scopes (Monorepo)

Use the app or lib name as scope:

```bash
feat(pos): add receipt printing support
fix(api): resolve authentication token refresh
feat(shared-types): add sync protocol interfaces
```

### Required Types & Version Bumps

- `feat:` - New feature → **minor** version bump (0.1.0 → 0.2.0)
- `fix:` - Bug fix → **patch** version bump (0.1.0 → 0.1.1)
- `feat!:` - Breaking change → **major** version bump (0.1.0 → 1.0.0)
- `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`, `ci:` - No release

### Examples

```bash
# ✅ CORRECT
feat(pos): add receipt printing support
fix(api): resolve cart calculation error
feat(shared-types)!: redesign entity interfaces

# ❌ INCORRECT
Add receipt printing
Fixed bug
```

**See [`CONTRIBUTING.md`](../CONTRIBUTING.md) for detailed guidelines.**

---

## Architecture Guidelines

### Clean Architecture Layers

This project follows **Clean Architecture** principles with strict layer separation:

```
┌─────────────────────────────────────────────────────────┐
│ UI Layer (Presentation)                                 │
│ - Components, Pages, Routing                            │
│ - Location: apps/pos/src/app/ui/                        │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Application Layer                                        │
│ - Services, Use Cases, Business Logic Orchestration     │
│ - Location: apps/pos/src/app/application/services/      │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Domain Layer (Core Business Logic)                      │
│ - Entities (interfaces), Enums, Pure Business Rules     │
│ - Location: libs/shared/types/, libs/domain/            │
│ - NO DEPENDENCIES - must be framework-agnostic          │
└─────────────────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Infrastructure Layer                                     │
│ - Repositories (SQLite/IndexedDB), Adapters, I/O        │
│ - Location: apps/pos/src/app/infrastructure/            │
└─────────────────────────────────────────────────────────┘
```

**Key Rules:**

- **Shared types** (`libs/shared/types/`) used by both frontend and backend
- **Domain logic** (`libs/domain/`) contains pure TypeScript with NO framework dependencies
- **Services** in `application/services/` orchestrate business logic and depend on repositories
- **Repositories** have dual implementations: `sqlite-*.repository.ts` (Tauri) and `indexeddb-*.repository.ts` (Web)
- **UI components** should only depend on services, never directly on repositories

---

## Shared Code Imports

Import shared code seamlessly across apps:

```typescript
// In apps/pos (Angular frontend)
import { Product, CreateOrderDto } from '@simple-pos/shared/types';
import { calculateOrderTotal } from '@simple-pos/domain';

// In apps/api (NestJS backend) - SAME imports!
import { Product, CreateOrderDto } from '@simple-pos/shared/types';
import { calculateOrderTotal } from '@simple-pos/domain';
```

---

## Coding Standards

### TypeScript & Angular

1. **Always use standalone components** - No NgModule declarations:

   ```typescript
   @Component({
     selector: 'app-example',
     standalone: true,
     imports: [CommonModule, ReactiveFormsModule],
     templateUrl: './example.component.html'
   })
   ```

2. **Prefer Angular Signals** for reactive state over BehaviorSubject:

   ```typescript
   export class ExampleService {
     private _items = signal<Item[]>([]);
     items = this._items.asReadonly();

     addItem(item: Item) {
       this._items.update((items) => [...items, item]);
     }
   }
   ```

3. **Use async/await** in services and repositories (no callback-style code):

   ```typescript
   async getProduct(id: string): Promise<Product | null> {
     return await this.repository.findById(id);
   }
   ```

4. **All services** must use `@Injectable({ providedIn: 'root' })` for singleton behavior

5. **Type safety is mandatory** - Never use `any`, always define proper interfaces:

   ```typescript
   // ✅ Correct
   async findProducts(filter: ProductFilter): Promise<Product[]>

   // ❌ Wrong
   async findProducts(filter: any): Promise<any>
   ```

### Repository Pattern

When creating or modifying repositories:

1. **Always implement both versions**: SQLite (Tauri) and IndexedDB (Web)
2. **Both must extend `BaseRepository<T>`** interface from `apps/pos/src/app/core/interfaces/base-repository.interface.ts`
3. **Use consistent naming**:
   - SQLite: `sqlite-product.repository.ts`
   - IndexedDB: `indexeddb-product.repository.ts`
4. **Register in RepositoryFactory**

### File Organization

- **Components**: `apps/pos/src/app/ui/components/` or `apps/pos/src/app/ui/pages/`
- **Services**: `apps/pos/src/app/application/services/`
- **Entities**: `libs/shared/types/src/entities/*.interface.ts`
- **Enums**: `libs/shared/types/src/enums/*.enum.ts`
- **Repositories**: `apps/pos/src/app/infrastructure/repositories/`
- **Guards**: `apps/pos/src/app/core/guards/`
- **Utilities**: `libs/shared/utils/`

### Naming Conventions

- **Files**: kebab-case (e.g., `product-list.component.ts`, `order.service.ts`)
- **Classes/Interfaces**: PascalCase (e.g., `ProductService`, `Order`)
- **Methods/Variables**: camelCase (e.g., `getProduct()`, `currentUser`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ITEMS_PER_PAGE`)
- **Enum values**: camelCase (e.g., `OrderStatus.pending`)

---

## Styling Guidelines

### TailwindCSS Usage

- **Use Tailwind utility classes** for all styling (avoid custom CSS unless necessary)
- **Mobile-first approach** - Start with mobile layout, then add responsive modifiers:
  ```html
  <div class="p-4 md:p-6 lg:p-8"></div>
  ```

### Glassmorphism Effects

Custom glass utilities are available:

```html
<div class="glass-effect">
  <!-- Frosted glass background with backdrop blur -->
</div>

<div class="glass-card">
  <!-- Complete glass card with padding and rounded corners -->
</div>
```

---

## Testing Guidelines

### Test Framework Setup

- **Test Runner**: Vitest 4.0.8
- **Environment**: jsdom (browser simulation)
- **Mocking**: fake-indexeddb for IndexedDB tests
- **Location**: Tests co-located with code (`*.spec.ts`)

### Running Tests

```bash
pnpm test                    # Run all tests
pnpm nx test pos             # Test specific project
pnpm nx affected:test        # Test only affected projects
pnpm test -- --watch         # Watch mode
pnpm test -- --ui            # Visual test UI
```

---

## Platform-Specific Considerations

### Dual-Platform Support

This app runs on **both web (IndexedDB) and desktop (SQLite via Tauri)**. When writing code:

1. **Never hardcode platform-specific logic** in services or components
2. **Use PlatformService** to detect runtime:
   ```typescript
   if (this.platformService.isTauri()) {
     // Desktop-specific behavior
   }
   ```
3. **Prefer repository abstraction** - Let RepositoryFactory handle platform switching
4. **Test on both platforms** when possible

---

## Build & Development Commands

### Package Management

**Always use pnpm** - npm/yarn are disabled via preinstall hook:

```bash
pnpm install           # Install dependencies
pnpm add <package>     # Add new dependency
pnpm remove <package>  # Remove dependency
```

### Development Servers

```bash
pnpm dev                   # Start frontend + backend concurrently
pnpm nx serve pos          # Angular dev server only
pnpm nx serve api          # NestJS backend only
pnpm run tauri:dev         # Desktop dev (Tauri + SQLite)
```

### Production Builds

```bash
pnpm nx build pos          # Build Angular frontend
pnpm nx build api          # Build NestJS backend
pnpm run tauri:build       # Desktop production build → installers
```

### Nx Commands

```bash
pnpm nx affected:test      # Test only affected projects
pnpm nx affected:build     # Build only affected projects
pnpm nx affected:lint      # Lint only affected projects
pnpm nx graph              # Visualize project dependencies

# Generate new code
pnpm nx g @nx/angular:component payment --project=pos
pnpm nx g @nx/nest:service order --project=api
pnpm nx g @nx/js:lib new-lib --directory=libs/shared
```

### Code Quality

```bash
pnpm run lint          # Lint TypeScript code
pnpm run format        # Format code with Prettier
pnpm test              # Run all tests
```

---

## Common Patterns & Examples

### Creating a New Shared Type

1. **Define interface** in `libs/shared/types/src/entities/`:

   ```typescript
   // my-entity.interface.ts
   export interface MyEntity {
     id: string;
     name: string;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. **Export from barrel**: Add to `libs/shared/types/src/index.ts`

### Creating a New Service

1. **Create service file** in `apps/pos/src/app/application/services/`:

   ```typescript
   // my-entity.service.ts
   import { Injectable, signal } from '@angular/core';
   import { MyEntity } from '@simple-pos/shared/types';

   @Injectable({ providedIn: 'root' })
   export class MyEntityService {
     private _entities = signal<MyEntity[]>([]);
     entities = this._entities.asReadonly();

     private _isLoading = signal(false);
     isLoading = this._isLoading.asReadonly();

     constructor(private repository: BaseRepository<MyEntity>) {}

     async loadAll(): Promise<void> {
       this._isLoading.set(true);
       try {
         const data = await this.repository.findAll();
         this._entities.set(data);
       } finally {
         this._isLoading.set(false);
       }
     }
   }
   ```

### Creating a Standalone Component

```typescript
// my-component.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card p-6">
      <h2 class="text-xl font-bold mb-4">{{ title() }}</h2>
      <p>{{ description() }}</p>
    </div>
  `,
})
export class MyComponent {
  title = signal('My Component');
  description = signal('This is a standalone component');
}
```

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
pnpm nx serve pos           # Start Angular frontend only
pnpm nx serve api           # Start NestJS backend only
pnpm run tauri:dev          # Start desktop dev

# Building
pnpm nx build pos           # Build Angular frontend
pnpm nx build api           # Build NestJS backend
pnpm run tauri:build        # Build desktop app

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
