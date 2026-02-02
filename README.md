# Simple POS

> 📊 **[Implementation Status & Roadmap →](docs/implementation-status.md)** - ✅ MVP COMPLETE
> 🏗️ **[Architecture →](docs/architecture.md)**
> 🤝 **[Contributing →](CONTRIBUTING.md)** - Automated releases with conventional commits

A modern, offline-capable Point-of-Sale (POS) system built with Angular, Tauri, and Clean Architecture.

## Prerequisites

### For Web Development (Required)

- Node.js 20+
- pnpm 10+

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
   pnpm install
   ```

2. **Verify Installation**
   ```bash
   pnpm run build
   ```

## Development

### Web Mode (Browser with IndexedDB)

Start the development server:

```bash
pnpm start
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
pnpm run tauri:dev
```

**Features:**

- Native desktop application
- SQLite database with migrations
- Same codebase as web version
- Platform-specific optimizations

## Available Scripts

- `pnpm start` - Start development server (web mode)
- `pnpm run build` - Build for production (web)
- `pnpm run watch` - Watch mode for development
- `pnpm test` - Run tests
- `pnpm run tauri` - Tauri CLI
- `pnpm run tauri:dev` - Start Tauri development (desktop mode)
- `pnpm run tauri:build` - Build Tauri application (desktop)

## Testing the Persistence Layer

The application includes a test page to validate the persistence layer:

1. Start the app in web or desktop mode
2. Create test entities with name and optional value
3. Edit and delete entities
4. Observe platform detection (SQLite vs IndexedDB)
5. Data persists between sessions

### Web Mode Testing

- Open browser DevTools → Application → IndexedDB
- View `SimplePosDB` → `test_entity` store
- Data persists in browser storage

### Desktop Mode Testing

- Data stored in `simple-pos.db` SQLite file
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
platformService.isTauri(); // true in desktop mode
platformService.isWeb(); // true in browser mode
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

## CLI Reference (Angular)

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## 🔐 Tauri Signing Setup

This project uses cryptographic signing to ensure app updates are authentic. For detailed setup instructions, see [`src-tauri/SIGNING.md`](src-tauri/SIGNING.md).

**Quick Setup for GitHub Actions:**

1. Copy your private key:

   ```bash
   cat src-tauri/tauri.key
   ```

2. Add it as a GitHub Secret:
   - Go to: `Settings → Secrets and variables → Actions`
   - Create secret: `TAURI_SIGNING_PRIVATE_KEY`
   - Paste the key content

For local development, the keys are automatically used from `src-tauri/tauri.key`.

## 🤖 GitHub Copilot Support

This repository is configured with GitHub Copilot instructions and custom agents to help you develop faster:

- **General Instructions**: `.github/copilot-instructions.md` - Comprehensive coding standards and best practices
- **Custom Agents**: `.github/agents/` - Specialized agents for testing, repositories, and Angular components
  - 🧪 **test-specialist**: Expert in Vitest testing
  - 🗄️ **repository-specialist**: Dual-platform repository implementations
  - 🎨 **angular-component-specialist**: Modern Angular 21 components

Learn more: [Custom Agents README](.github/agents/README.md)

## Contact & Resources

- **AI Execution Plan:** `docs/ai-mvp-execution-plan.md`
- **PRD:** `docs/prd.md`
- **Architecture:** `docs/architecture.md`
- **Technical Details:** `docs/technical-details.md`
- **Setup Guide:** `SETUP.md`

## Troubleshooting

### macOS: "App is damaged and can't be opened"

If you see this error when trying to run the app on macOS, it's because the app is not signed with an Apple Developer ID. This is a common security feature for apps downloaded from the internet.

**Fix:**

1. Open Terminal
2. Run the following command (replace path with actual location):
   ```bash
   xattr -cr /Applications/Simple\ POS.app
   ```
   _or if running from the Downloads folder:_
   ```bash
   xattr -cr ~/Downloads/Simple\ POS.app
   ```
