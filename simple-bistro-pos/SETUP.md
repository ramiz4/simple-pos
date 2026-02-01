# Simple Bistro POS - Setup and Installation Guide

## Prerequisites

### For Web Development (Required)
- Node.js 20+ 
- npm 10+

### For Desktop Development (Optional)
- Rust 1.93+
- System dependencies (Linux):
  ```bash
  sudo apt-get update
  sudo apt-get install -y libgtk-3-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev libwebkit2gtk-4.1-dev
  ```

## Installation

1. **Install Dependencies**
   ```bash
   cd simple-bistro-pos
   npm install
   ```

2. **Verify Installation**
   ```bash
   npm run build
   ```

## Development

### Web Mode (Browser with IndexedDB)

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`

**Features:**
- Full CRUD operations via IndexedDB
- Reactive UI with Angular Signals
- Glassmorphism styling
- Mobile-first responsive design

### Desktop Mode (Tauri with SQLite)

**Prerequisites:** Install system dependencies (see above)

Start Tauri development:
```bash
npm run tauri:dev
```

**Features:**
- Native desktop application
- SQLite database with migrations
- Same codebase as web version
- Platform-specific optimizations

## Project Structure

```
simple-bistro-pos/
├── src/
│   ├── app/
│   │   ├── core/              # Interfaces and base classes
│   │   │   ├── interfaces/    # BaseRepository, etc.
│   │   │   └── base/          # Abstract classes
│   │   ├── domain/            # Business entities and enums
│   │   │   ├── entities/      # TestEntity, etc.
│   │   │   └── enums/         # Business enums
│   │   ├── application/       # Services and use cases
│   │   │   ├── services/      # TestService, etc.
│   │   │   └── use-cases/     # Business logic
│   │   ├── infrastructure/    # Data access and adapters
│   │   │   ├── repositories/  # SQLite, IndexedDB implementations
│   │   │   └── adapters/      # RepositoryFactory, etc.
│   │   ├── ui/                # Presentation layer
│   │   │   ├── components/    # Reusable components
│   │   │   └── pages/         # Page components
│   │   └── shared/            # Shared utilities
│   │       ├── utilities/     # PlatformService, etc.
│   │       └── helpers/       # Pure functions
│   ├── styles.css             # Global styles with TailwindCSS
│   └── index.html
├── src-tauri/                 # Tauri desktop configuration
│   ├── src/
│   │   └── main.rs           # Rust entry point
│   ├── migrations/           # SQLite migrations
│   │   └── 001_initial.sql
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── tailwind.config.js        # TailwindCSS configuration
├── tsconfig.json             # TypeScript configuration (strict mode)
├── angular.json              # Angular configuration
└── package.json              # Node.js dependencies
```

## Available Scripts

- `npm start` - Start development server (web mode)
- `npm run build` - Build for production (web)
- `npm run watch` - Watch mode for development
- `npm test` - Run tests
- `npm run tauri` - Tauri CLI
- `npm run tauri:dev` - Start Tauri development (desktop mode)
- `npm run tauri:build` - Build Tauri application (desktop)

## Testing the Persistence Layer

The application includes a test page to validate the persistence layer:

1. Start the app in web or desktop mode
2. Create test entities with name and optional value
3. Edit and delete entities
4. Observe platform detection (SQLite vs IndexedDB)
5. Data persists between sessions

### Web Mode Testing
- Open browser DevTools → Application → IndexedDB
- View `BistroPosDB` → `test_entity` store
- Data persists in browser storage

### Desktop Mode Testing  
- Data stored in `bistro.db` SQLite file
- Located in Tauri app data directory
- Use SQLite viewer to inspect database

## Architecture Highlights

### Clean Architecture
- **Domain Layer**: Pure business logic, no dependencies
- **Application Layer**: Use cases and services
- **Infrastructure Layer**: Data access, external APIs
- **Presentation Layer**: UI components

### Repository Pattern
- `BaseRepository<T>` interface for all data access
- `SQLiteTestRepository` for desktop (Tauri)
- `IndexedDBTestRepository` for web/PWA
- `RepositoryFactory` selects implementation at runtime

### Platform Detection
```typescript
platformService.isTauri() // true in desktop mode
platformService.isWeb()   // true in browser mode
```

### Reactive State with Signals
```typescript
entities = signal<TestEntity[]>([]);
isLoading = signal(false);
error = signal<string | null>(null);
```

## Styling System

### TailwindCSS v3
- Utility-first CSS framework
- Mobile-first responsive design
- Custom glassmorphism utilities

### Glass Components
```html
<div class="glass-card">Card with glass effect</div>
<button class="glass-button">Glass button</button>
```

### Custom Utilities
Defined in `src/styles.css`:
- `.glass-card` - Glassmorphism card style
- `.glass-button` - Glassmorphism button style

## Configuration Files

### TypeScript (`tsconfig.json`)
- Strict mode enabled
- ES2022 target
- Angular compiler strict options

### TailwindCSS (`tailwind.config.js`)
- Scans all HTML and TS files
- Extended theme with custom utilities

### Tauri (`src-tauri/tauri.conf.json`)
- Window configuration
- SQLite plugin enabled
- Build settings for Angular

## Database Migrations

Migrations are in `src-tauri/migrations/`:

```sql
-- 001_initial.sql
CREATE TABLE IF NOT EXISTS test_entity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Tauri automatically applies migrations on startup.

## Next Steps (Phase 1)

See `ai-mvp-execution-plan.md` for the complete roadmap:

1. **CodeTable System** - Enum persistence
2. **Domain Enums** - OrderType, OrderStatus, TableStatus, UserRole
3. **User Management** - Authentication and roles
4. **Table Management** - CRUD for tables
5. **Product Management** - Categories, products, variants, extras

## Troubleshooting

### Build Errors
- Ensure Node.js 20+ is installed
- Run `npm install` to update dependencies
- Clear cache: `rm -rf node_modules && npm install`

### Tauri Build Fails
- Install system dependencies (Linux)
- Ensure Rust is installed: `rustc --version`
- Check Tauri requirements: https://tauri.app/v1/guides/getting-started/prerequisites

### Styles Not Loading
- Verify TailwindCSS is installed
- Check `tailwind.config.js` content paths
- Restart dev server

## Resources

- [Angular Documentation](https://angular.dev)
- [Tauri Documentation](https://tauri.app)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [TypeScript Documentation](https://www.typescriptlang.org)

## License

MIT
