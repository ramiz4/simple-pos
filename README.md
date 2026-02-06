# Simple POS

> 📊 **Version 1.11.0** - ✅ PRODUCTION READY
> 🏗️ **[Architecture →](docs/architecture.md)**
> 🤝 **[Contributing →](CONTRIBUTING.md)** - Automated releases with conventional commits
> 🤖 **[GitHub Copilot Custom Agents →](.github/agents/README.md)** - AI-assisted development

A modern, cross-platform Point-of-Sale system built with Angular 21, Tauri v2, and Clean Architecture. Supports restaurant operations with dine-in, takeaway, and delivery orders, kitchen display, thermal printing, and automatic backups.

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

## ✨ Key Features

### 🍽️ Restaurant Operations

- **Multi-Order Types**: Dine-in (table-based), Takeaway, Delivery
- **Table Management**: Real-time table status (Available, Occupied, Reserved)
- **Order Lifecycle**: OPEN → PREPARING → READY → SERVED → COMPLETED
- **Customer Names**: Track customer info for takeaway/delivery orders
- **Per-Item Tracking**: Independent status for each order item

### 👨‍🍳 Kitchen Display System

- **Real-time Order View**: Auto-refreshing kitchen dashboard
- **Status Filtering**: Active, Preparing, Ready, Completed
- **Kitchen Tickets**: Thermal printer support with ESC/POS commands
- **Item-Level Control**: Mark items as preparing/ready independently

### 🖨️ Thermal Printing

- **Dual Printer Support**: Receipt printer + Kitchen printer
- **ESC/POS Protocol**: Native thermal printer commands (Tauri)
- **Web Print Fallback**: HTML print preview for browser mode
- **Bilingual Receipts**: English/Albanian support
- **Network Printers**: TCP/IP connection (e.g., `tcp:192.168.1.100:9100`)

### 📊 Product Management

- **Categories & Products**: Full CRUD operations
- **Variants**: Size/type variations (Small, Medium, Large)
- **Extras**: Add-ons and modifiers with separate pricing
- **Ingredients**: Track product composition
- **Stock Management**: Real-time availability tracking

### 🔐 Security & Access Control

- **Role-Based Access**: Admin, Cashier, Kitchen, Driver roles
- **PIN Authentication**: Fast staff login with bcrypt-hashed PINs
- **Email Login**: Owner/admin access with email+password
- **Session Management**: Persistent sessions with staff selection
- **Lock Feature**: Quick lock/unlock from sidebar

### 💾 Data Management

- **Automatic Backups**: Scheduled database backups
- **Manual Backup/Restore**: Full database export/import
- **Optional Encryption**: Password-protected backup files
- **Cross-Platform**: Works with both SQLite and IndexedDB

### 📱 Multi-Platform

- **Desktop App**: Native Tauri application (Windows, macOS, Linux)
- **PWA**: Progressive Web App with offline support
- **Unified Codebase**: Same Angular app for all platforms
- **Platform Detection**: Auto-selects SQLite or IndexedDB

### 💰 Payment & Reports

- **Tax-Inclusive Pricing**: Kosovo VAT (18%) built into prices
- **Tip Support**: Add tips to orders
- **Sales Reports**: Daily/period sales analytics
- **Order History**: Complete order tracking with timestamps

## Available Scripts

- `pnpm start` - Start development server (web mode with IndexedDB)
- `pnpm run build` - Build for production (web/PWA)
- `pnpm run watch` - Watch mode for development
- `pnpm test` - Run Vitest unit tests
- `pnpm run tauri` - Tauri CLI access
- `pnpm run tauri:dev` - Start Tauri development (desktop mode with SQLite)
- `pnpm run tauri:build` - Build native desktop application
- `pnpm run db:reset` - Reset database (development only)

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

### Clean Architecture Layers

```
src/app/
├── domain/              # Business entities (16 types), enums, DTOs
│   ├── entities/        # Order, Product, User, Category, etc.
│   ├── enums/           # OrderStatus, OrderType, UserRole, TableStatus
│   └── dtos/            # CartItem, CartSummary, etc.
├── application/         # Business logic services (22 services)
│   └── services/        # OrderService, CartService, AuthService, etc.
├── infrastructure/      # Data persistence (32 dual repositories)
│   ├── repositories/    # SQLite* + IndexedDB* implementations
│   ├── adapters/        # RepositoryFactory
│   └── services/        # IndexedDBService
├── core/                # Guards, interfaces, base classes
│   ├── guards/          # authGuard, adminGuard, staffGuard, etc.
│   └── interfaces/      # BaseRepository<T>
├── ui/                  # Presentation layer
│   ├── pages/           # 23+ page components
│   ├── components/      # Reusable UI components
│   ├── layouts/         # PosShellComponent, AdminShellComponent
│   └── routes/          # Route configuration
└── shared/              # Utilities, directives
    ├── utilities/       # PlatformService, ValidationUtils
    └── directives/      # Custom directives
```

### Dual Repository Pattern

All 16 entity types have **dual implementations**:

- **SQLite\*Repository** (32 total): Desktop/Tauri mode
- **IndexedDB\*Repository** (32 total): Web/PWA mode

**Entity Types:**

1. User (authentication, roles)
2. Account (multi-tenancy)
3. Order (DINE_IN, TAKEAWAY, DELIVERY)
4. OrderItem (individual line items)
5. OrderItemExtra (extras applied to items)
6. Product (menu items)
7. ProductExtra (available extras for products)
8. ProductIngredient (product composition)
9. Category (product categories)
10. Variant (product variations)
11. Extra (add-ons, modifiers)
12. Ingredient (product components)
13. Table (restaurant tables)
14. CodeTable (enum storage)
15. CodeTranslation (multilingual support)
16. Account (tenant isolation)

**Platform Selection:**

```typescript
// RepositoryFactory auto-selects based on runtime
getOrderRepository(): BaseRepository<Order> {
  return this.platformService.isTauri()
    ? this.sqliteOrderRepo
    : this.indexedDBOrderRepo;
}
```

### Key Services

**AuthService**

- bcrypt PIN/password hashing (10 salt rounds)
- Role-based access (ADMIN, CASHIER, KITCHEN, DRIVER)
- Session persistence in localStorage
- Staff selection flow

**OrderService**

- Multi-context order management
- Auto-status transitions based on item readiness
- Table status synchronization
- Order number generation (YYYYMMDDNNNN)

**CartService**

- Context-aware carts (`table_1`, `TAKEAWAY`, `DELIVERY`)
- Tax-inclusive pricing (18% Kosovo VAT)
- Real-time totals with Angular signals
- Item deduplication by product+variant+extras

**PrinterService**

- ESC/POS thermal printing (Tauri native)
- HTML print fallback (web mode)
- Dual printer support (receipt + kitchen)
- Bilingual receipts (EN/AL)

**BackupService**

- Full database export/import
- Optional AES encryption
- JSON format with versioning
- Cross-platform compatible

### Platform Detection

```typescript
// Auto-detects Tauri via window.__TAURI__ global
platformService.isTauri(); // true in desktop mode
platformService.isWeb(); // true in browser mode
```

### Reactive State with Signals

Angular 21 signals for reactive UI:

````typescript
// CartService example
private allCarts = signal<Record<string, CartItem[]>>({});
readonly cart = computed(() => this.allCarts()[this.activeContextKey()] || []);

// Component usage
summary = computed(() => this.cartService.getSummary());

## Styling System

### TailwindCSS v4

- Utility-first CSS framework
- Mobile-first responsive design
- Modern glassmorphism effects

### Glass Components

```html
<div class="glass-card">Card with glass effect</div>
<button class="glass-button">Glass button</button>
````

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
