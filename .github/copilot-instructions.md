# GitHub Copilot Custom Instructions for Simple POS

## Project Overview

This is a **modern Point-of-Sale (POS) system** built with **Angular 21** and **Tauri 2**, designed for both web browsers and desktop platforms with offline-first capabilities.

### Tech Stack

- **Frontend**: Angular 21.1.2 (standalone components, Signals API)
- **Desktop Runtime**: Tauri 2.9.6 (native desktop app)
- **Styling**: TailwindCSS 3.4.19 with custom glassmorphism utilities
- **State Management**: Angular Signals for reactive state
- **Data Storage**:
  - **Web**: IndexedDB (browser storage)
  - **Desktop**: SQLite (via Tauri plugin)
- **Language**: TypeScript 5.9.2 (strict mode enabled)
- **Build Tool**: Vite 7.3.1
- **Package Manager**: **pnpm 10.2.1** (enforced - always use `pnpm` commands)
- **Testing**: Vitest 4.0.8 with jsdom environment

---

## ⚠️ CRITICAL: Commit Message Requirements

**This project uses automated semantic versioning.** All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/) format.

### Commit Format

```
<type>(<scope>): <subject>
```

### Required Types & Version Bumps

- `feat:` - New feature → **minor** version bump (0.1.0 → 0.2.0)
- `fix:` - Bug fix → **patch** version bump (0.1.0 → 0.1.1)
- `feat!:` - Breaking change → **major** version bump (0.1.0 → 1.0.0)
- `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`, `ci:` - No release

### Examples

```bash
# ✅ CORRECT
feat: add receipt printing support
fix: resolve cart calculation error
feat!: redesign authentication system

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
│ - Location: src/app/ui/                                 │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Application Layer                                        │
│ - Services, Use Cases, Business Logic Orchestration     │
│ - Location: src/app/application/services/               │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Domain Layer (Core Business Logic)                      │
│ - Entities (interfaces), Enums, Pure Business Rules     │
│ - Location: src/app/domain/                             │
│ - NO DEPENDENCIES - must be framework-agnostic          │
└─────────────────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Infrastructure Layer                                     │
│ - Repositories (SQLite/IndexedDB), Adapters, I/O        │
│ - Location: src/app/infrastructure/                     │
└─────────────────────────────────────────────────────────┘
```

**Key Rules:**

- **Domain entities** (`src/app/domain/entities/*.interface.ts`) must be pure TypeScript interfaces with NO framework dependencies
- **Services** in `application/services/` orchestrate business logic and depend on repositories
- **Repositories** in `infrastructure/repositories/` have dual implementations: `sqlite-*.repository.ts` (Tauri) and `indexeddb-*.repository.ts` (Web)
- **UI components** should only depend on services, never directly on repositories
- Use **RepositoryFactory** (`infrastructure/adapters/repository.factory.ts`) for platform-aware dependency injection

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
2. **Both must extend `BaseRepository<T>`** interface from `src/app/core/interfaces/base-repository.interface.ts`
3. **Use consistent naming**:
   - SQLite: `sqlite-product.repository.ts`
   - IndexedDB: `indexeddb-product.repository.ts`
4. **Register in RepositoryFactory** (`infrastructure/adapters/repository.factory.ts`)

Example repository structure:

```typescript
// indexeddb-product.repository.ts
@Injectable({ providedIn: 'root' })
export class IndexedDBProductRepository implements BaseRepository<Product> {
  constructor(private indexedDbService: IndexedDbService) {}

  async findAll(): Promise<Product[]> {
    /* ... */
  }
  async findById(id: string): Promise<Product | null> {
    /* ... */
  }
  async save(entity: Product): Promise<Product> {
    /* ... */
  }
  async delete(id: string): Promise<void> {
    /* ... */
  }
}
```

### File Organization

- **Components**: `src/app/ui/components/` or `src/app/ui/pages/`
- **Services**: `src/app/application/services/`
- **Entities**: `src/app/domain/entities/*.interface.ts`
- **Enums**: `src/app/domain/enums/*.enum.ts`
- **Repositories**: `src/app/infrastructure/repositories/`
- **Guards**: `src/app/core/guards/`
- **Utilities**: `src/app/shared/utilities/`

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

Custom glass utilities are available in `tailwind.config.js`:

```html
<div class="glass-effect">
  <!-- Frosted glass background with backdrop blur -->
</div>

<div class="glass-border">
  <!-- Glass effect with visible border -->
</div>

<div class="glass-card">
  <!-- Complete glass card with padding and rounded corners -->
</div>
```

### Responsive Design Breakpoints

Follow TailwindCSS defaults:

- `sm:` - 640px and up (mobile landscape)
- `md:` - 768px and up (tablet)
- `lg:` - 1024px and up (desktop)
- `xl:` - 1280px and up (large desktop)

---

## Testing Guidelines

### Test Framework Setup

- **Test Runner**: Vitest 4.0.8
- **Environment**: jsdom (browser simulation)
- **Mocking**: fake-indexeddb for IndexedDB tests
- **Location**: Integration tests in `src/app/integration/`, unit tests co-located with code

### Writing Tests

1. **Use TestBed** for Angular component/service testing:

   ```typescript
   import { TestBed } from '@angular/core/testing';

   describe('ProductService', () => {
     let service: ProductService;

     beforeEach(() => {
       TestBed.configureTestingModule({
         providers: [ProductService /* mock dependencies */],
       });
       service = TestBed.inject(ProductService);
     });

     it('should create product', async () => {
       const product = await service.createProduct(mockData);
       expect(product).toBeDefined();
     });
   });
   ```

2. **Mock repositories** in service tests to avoid database dependencies
3. **Use descriptive test names** that explain the expected behavior
4. **Test both success and error paths**

### Running Tests

```bash
pnpm test              # Run all tests
pnpm test -- --watch   # Watch mode
pnpm test -- --ui      # Visual test UI
```

---

## Platform-Specific Considerations

### Dual-Platform Support

This app runs on **both web (IndexedDB) and desktop (SQLite via Tauri)**. When writing code:

1. **Never hardcode platform-specific logic** in services or components
2. **Use PlatformService** (`src/app/shared/utilities/platform.service.ts`) to detect runtime:
   ```typescript
   if (this.platformService.isTauri()) {
     // Desktop-specific behavior
   }
   ```
3. **Prefer repository abstraction** - Let RepositoryFactory handle platform switching
4. **Test on both platforms** when possible

### Tauri-Specific APIs

When using Tauri features:

```typescript
import { invoke } from '@tauri-apps/api/core';

// Check platform first
if (this.platformService.isTauri()) {
  const result = await invoke('some_command', { param: value });
}
```

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
pnpm start             # Web dev server (IndexedDB, http://localhost:4200)
pnpm run tauri:dev     # Desktop dev (Tauri + SQLite)
```

### Production Builds

```bash
pnpm run build         # Web production build → dist/simple-pos
pnpm run tauri:build   # Desktop production build → installers
```

### Code Quality

```bash
pnpm run lint          # Lint TypeScript code
pnpm run format        # Format code with Prettier
pnpm test              # Run all tests
```

---

## Common Patterns & Examples

### Creating a New Entity

1. **Define interface** in `src/app/domain/entities/`:

   ```typescript
   // my-entity.interface.ts
   export interface MyEntity {
     id: string;
     name: string;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. **Export from barrel**: Add to `src/app/domain/entities/index.ts`

### Creating a New Service

1. **Create service file** in `src/app/application/services/`:

   ```typescript
   // my-entity.service.ts
   import { Injectable, signal } from '@angular/core';
   import { MyEntity } from '../../domain/entities';

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

### Creating Dual Repositories

1. **IndexedDB version** (`indexeddb-my-entity.repository.ts`):

   ```typescript
   @Injectable({ providedIn: 'root' })
   export class IndexedDBMyEntityRepository implements BaseRepository<MyEntity> {
     constructor(private db: IndexedDbService) {}
     // Implement all BaseRepository methods using IndexedDB
   }
   ```

2. **SQLite version** (`sqlite-my-entity.repository.ts`):

   ```typescript
   @Injectable({ providedIn: 'root' })
   export class SQLiteMyEntityRepository implements BaseRepository<MyEntity> {
     private db: Database | null = null;

     constructor() {
       this.initDatabase();
     }

     private async initDatabase() {
       const { load } = await import('@tauri-apps/plugin-sql');
       this.db = await load('sqlite:pos.db');
     }

     // Implement all BaseRepository methods using SQLite
   }
   ```

3. **Register in RepositoryFactory** (add provider logic)

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
- [ ] **Performance**: No unnecessary re-renders, efficient queries
- [ ] **Accessibility**: Proper ARIA labels, keyboard navigation support

---

## Useful References

- **Angular Signals**: https://angular.dev/guide/signals
- **Standalone Components**: https://angular.dev/guide/components/importing
- **Tauri API**: https://tauri.app/v2/reference/javascript/
- **TailwindCSS**: https://tailwindcss.com/docs
- **Vitest**: https://vitest.dev/

---

## Quick Command Reference

```bash
# Development
pnpm start              # Start web dev server
pnpm run tauri:dev      # Start desktop dev

# Building
pnpm run build          # Build for web
pnpm run tauri:build    # Build desktop app

# Testing
pnpm test               # Run tests once
pnpm test -- --watch    # Watch mode
pnpm test -- --ui       # Test UI

# Code Quality
pnpm run lint           # Lint code
pnpm run format         # Format with Prettier

# Dependencies
pnpm add <pkg>          # Add dependency
pnpm add -D <pkg>       # Add dev dependency
```

---

## Questions or Issues?

When in doubt:

1. Check existing similar code in the repository
2. Follow the Clean Architecture principles
3. Use TypeScript strict mode features
4. Test on both web and desktop platforms
5. Keep changes minimal and focused

Happy coding! 🚀
