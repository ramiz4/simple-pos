# Simple Simple POS - Architecture Documentation

## Project Structure

This project follows **Clean Architecture** principles with clear separation of concerns:

```
src/app/
├── core/              # Core interfaces and base classes
│   ├── interfaces/    # BaseRepository, etc.
│   └── base/          # Abstract classes
├── domain/            # Business entities and enums
│   ├── entities/      # Data models (TestEntity, etc.)
│   └── enums/         # Business enums
├── application/       # Business logic and orchestration
│   ├── services/      # Application services
│   └── use-cases/     # Business use cases
├── infrastructure/    # External concerns (DB, APIs)
│   ├── repositories/  # Data access implementations
│   └── adapters/      # Platform adapters, factories
├── ui/                # Presentation layer
│   ├── components/    # Reusable UI components
│   └── pages/         # Page-level components
└── shared/            # Shared utilities
    ├── utilities/     # Helper functions, services
    └── helpers/       # Pure utility functions
```

## Technology Stack

- **Frontend**: Angular 21.1.2 (standalone components)
- **Desktop Runtime**: Tauri 2.9.6
- **Styling**: TailwindCSS 4.1.18 with glassmorphism
- **Database**:
  - SQLite (Tauri desktop mode)
  - IndexedDB (web/PWA mode)
- **TypeScript**: Strict mode enabled

## Key Features

### 1. Repository Pattern

The `BaseRepository<T>` interface defines standard CRUD operations:

- `findById(id)`: Get entity by ID
- `findAll()`: Get all entities
- `create(entity)`: Create new entity
- `update(id, entity)`: Update existing entity
- `delete(id)`: Delete entity
- `count()`: Count total entities

### 2. Platform Abstraction

The `RepositoryFactory` automatically selects the appropriate repository based on the platform:

- **Tauri Desktop**: Uses `SQLiteTestRepository` (native SQLite via Tauri plugin)
- **Web/PWA**: Uses `IndexedDBTestRepository` (browser IndexedDB)

The `PlatformService` detects the current runtime environment.

### 3. Reactive State Management

Uses Angular Signals for reactive state:

```typescript
entities = signal<TestEntity[]>([]);
isLoading = signal(false);
error = signal<string | null>(null);
```

### 4. Glassmorphism UI

Custom TailwindCSS utilities for modern glass effects:

```css
.glass-card {
  backdrop-blur-xl bg-white/30 border border-white/20 rounded-3xl shadow-xl
}

.glass-button {
  backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-lg
}
```

## Running the Application

### Web Mode (Browser)

```bash
pnpm run start
```

Opens at `http://localhost:4200` and uses **IndexedDB** for storage.

### Desktop Mode (Tauri)

```bash
pnpm run tauri:dev
```

Runs as a native desktop application and uses **SQLite** for storage.

### Build for Production

**Web:**

```bash
pnpm run build
```

**Desktop:**

```bash
pnpm run tauri:build
```

## Architecture Principles

1. **Dependency Inversion**: UI depends on abstractions (interfaces), not implementations
2. **Single Responsibility**: Each layer has one clear purpose
3. **Platform Agnostic**: Business logic works regardless of platform
4. **Offline First**: All data persists locally
5. **Type Safety**: Strict TypeScript mode enforced

## Test Entity

The project includes a `TestEntity` to validate the persistence layer:

- Demonstrates CRUD operations
- Works in both web and desktop modes
- Reactive UI updates via Signals
- Full error handling

## Next Steps (Phase 1)

1. Implement CodeTable system (enum persistence)
2. Create domain enums (OrderType, OrderStatus, etc.)
3. Implement User entity and authentication
4. Add role-based access control
5. Create Table and Product management

## Database Migrations

Migrations are defined in `src-tauri/migrations/`:

- `001_initial.sql`: Creates initial schema
- Future migrations will be numbered sequentially

Tauri automatically applies migrations on startup.

## Notes

- The app auto-detects platform via `window.__TAURI__`
- Both storage backends implement the same `BaseRepository<T>` interface
- The UI is platform-agnostic and works seamlessly on both web and desktop
- TailwindCSS provides responsive, mobile-first design
