# Simple POS - Architecture Documentation

## Overview

**Simple POS v1.16.0** is a production-ready, cross-platform Point-of-Sale system built with **Clean Architecture** principles and **Nx Monorepo** structure. The application runs as both a native desktop application (via Tauri) and a Progressive Web App, sharing 100% of the codebase while adapting to platform-specific capabilities.

> **Phase 0.5 (Nx Monorepo)**: The project has been successfully migrated to an Nx monorepo structure with shared libraries for improved code organization and maintainability. See [Nx Monorepo Migration Plan](./nx-monorepo-migration-plan.md) for details.

## Technology Stack

### Frontend

- **Framework**: Angular 21.1.2 (standalone components)
- **State Management**: Angular Signals (reactive primitives)
- **Styling**: TailwindCSS 4.1.18 with custom utilities
- **HTTP Client**: Angular HttpClient
- **Forms**: Angular Reactive Forms
- **Routing**: Angular Router with lazy loading

### Desktop Runtime

- **Framework**: Tauri 2.9.6 (Rust-based)
- **Database**: SQLite via `@tauri-apps/plugin-sql`
- **Updater**: `@tauri-apps/plugin-updater`
- **Process**: `@tauri-apps/plugin-process`
- **Logging**: `@tauri-apps/plugin-log`

### Web Runtime

- **Service Worker**: `@angular/service-worker` for PWA
- **Database**: IndexedDB (native browser API)
- **Storage**: LocalStorage for session persistence

### Development Tools

- **Monorepo**: Nx 22.4.5 (workspace management)
- **Package Manager**: pnpm 10+ (enforced)
- **Build System**: Nx + @angular/build (Angular CLI-based executors)
- **Testing**: Vitest 4.0.8 with jsdom
- **Linting**: ESLint 9 + Prettier with organize-imports plugin
- **Git Hooks**: Husky + lint-staged
- **Versioning**: Semantic Release with conventional commits

## Project Structure (Nx Monorepo)

```
simple-pos/                            # 📦 Nx Monorepo Root
├── apps/
│   ├── pos/                           # 🖥️ Angular POS Frontend
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── application/       # 🧠 Business Logic Layer
│   │   │       │   └── services/      # 22 application services
│   │   │       │       ├── auth.service.ts
│   │   │       │       ├── order.service.ts
│   │   │       │       ├── cart.service.ts
│   │   │       │       ├── printer.service.ts
│   │   │       │       ├── backup.service.ts
│   │   │       │       └── ... (17 more)
│   │   │       │
│   │   │       ├── infrastructure/    # 💾 Data & External Services
│   │   │       │   ├── repositories/  # 32 repository implementations
│   │   │       │   │   ├── sqlite-*.repository.ts      (16 files)
│   │   │       │   │   └── indexeddb-*.repository.ts   (16 files)
│   │   │       │   ├── adapters/
│   │   │       │   │   └── repository.factory.ts
│   │   │       │   └── services/
│   │   │       │       └── indexeddb.service.ts
│   │   │       │
│   │   │       ├── core/              # 🔐 Core Utilities
│   │   │       │   ├── guards/        # Route guards
│   │   │       │   │   ├── auth.guard.ts
│   │   │       │   │   ├── admin.guard.ts
│   │   │       │   │   ├── staff.guard.ts
│   │   │       │   │   ├── setup.guard.ts
│   │   │       │   │   └── desktop-landing.guard.ts
│   │   │       │   └── interfaces/
│   │   │       │       └── base-repository.interface.ts
│   │   │       │
│   │   │       ├── ui/                # 🎨 Presentation Layer
│   │   │       │   ├── pages/         # 23+ page components
│   │   │       │   │   ├── landing/
│   │   │       │   │   ├── initial-setup/
│   │   │       │   │   ├── login/
│   │   │       │   │   ├── register/
│   │   │       │   │   ├── staff-selection/
│   │   │       │   │   ├── dashboard/
│   │   │       │   │   ├── active-orders/
│   │   │       │   │   ├── kitchen/
│   │   │       │   │   ├── reports/
│   │   │       │   │   ├── pos/       # POS workflow
│   │   │       │   │   │   ├── order-type-selection
│   │   │       │   │   │   ├── table-selection
│   │   │       │   │   │   ├── product-selection
│   │   │       │   │   │   ├── cart-view
│   │   │       │   │   │   └── payment
│   │   │       │   │   └── admin/     # 12 admin pages
│   │   │       │   ├── components/    # Reusable components
│   │   │       │   ├── layouts/
│   │   │       │   └── routes/
│   │   │       │
│   │   │       └── shared/            # 🛠️ App-specific Utilities
│   │   │           ├── utilities/
│   │   │           │   ├── platform.service.ts
│   │   │           │   └── input-sanitizer.service.ts
│   │   │           └── directives/
│   │   │
│   │   ├── project.json               # Nx project configuration
│   │   ├── vitest.config.ts           # Test configuration
│   │   └── public/                    # Static assets
│   │
│   ├── api/                           # 🚀 NestJS Backend API
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.controller.ts
│   │   │   │   ├── app.module.ts
│   │   │   │   └── app.service.ts
│   │   │   └── main.ts
│   │   ├── project.json
│   │   ├── tsconfig.json
│   │   └── webpack.config.js
│   │
│   └── native/                        # 🦀 Tauri Desktop Host
│       ├── src-tauri/
│       │   ├── src/
│       │   │   └── main.rs
│       │   ├── migrations/            # SQLite migrations
│       │   ├── Cargo.toml
│       │   └── tauri.conf.json
│       └── project.json
│
├── libs/                              # 📚 Shared Libraries
│   ├── domain/                        # 🎯 @simple-pos/domain
│   │   ├── src/
│   │   │   └── lib/                   # Pure business logic
│   │   │       ├── calculations.ts    # Tax & pricing calculations
│   │   │       └── calculations.spec.ts
│   │   ├── project.json
│   │   └── vitest.config.mts
│   │
│   └── shared/
│       ├── types/                     # 📦 @simple-pos/shared/types
│       │   ├── src/
│       │   │   └── lib/
│       │   │       ├── entities/      # 16 entity interfaces
│       │   │       │   ├── order.interface.ts
│       │   │       │   ├── product.interface.ts
│       │   │       │   ├── user.interface.ts
│       │   │       │   └── ... (13 more)
│       │   │       ├── enums/         # Business enums
│       │   │       │   ├── order-status.enum.ts
│       │   │       │   ├── order-type.enum.ts
│       │   │       │   ├── user-role.enum.ts
│       │   │       │   └── table-status.enum.ts
│       │   │       └── dtos/          # Data Transfer Objects
│       │   ├── project.json
│       │   └── vitest.config.mts
│       │
│       └── utils/                     # 🔧 @simple-pos/shared/utils
│           ├── src/
│           │   └── lib/
│           │       ├── date.utils.ts
│           │       └── validation.utils.ts
│           ├── project.json
│           └── vitest.config.mts
│
├── docs/                              # 📚 Documentation
│   ├── architecture.md
│   ├── prd.md
│   ├── nx-monorepo-migration-plan.md
│   └── saas-onprem-transformation.md
│
├── nx.json                            # Nx workspace configuration
├── tsconfig.json                      # TypeScript path mappings
├── package.json                       # Workspace dependencies
└── vitest.workspace.ts                # Vitest workspace config
```

## Nx Monorepo Architecture

### Workspace Organization

The project uses **Nx 22.4.5** for monorepo management, providing:

- **Clear separation of concerns**: Apps vs. Libraries
- **Dependency graph visualization**: `nx graph` shows project relationships
- **Efficient builds**: Only rebuild what changed
- **Shared code**: Reusable libraries across applications
- **Path aliases**: Clean imports via TypeScript path mappings

### Shared Libraries

Three shared libraries provide framework-agnostic code:

1. **@simple-pos/shared/types** - Entity interfaces, enums, DTOs

   ```typescript
   import { Product, OrderStatusEnum } from '@simple-pos/shared/types';
   ```

2. **@simple-pos/domain** - Pure business logic (pricing calculations, business rules)

   ```typescript
   import { calculateTaxInclusive, calculateGrandTotal } from '@simple-pos/domain';
   ```

3. **@simple-pos/shared/utils** - Common utilities
   ```typescript
   import { formatDate } from '@simple-pos/shared/utils';
   ```

### Path Mappings (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@simple-pos/shared/types": ["libs/shared/types/src/index.ts"],
      "@simple-pos/shared/utils": ["libs/shared/utils/src/index.ts"],
      "@simple-pos/domain": ["libs/domain/src/index.ts"]
    }
  }
}
```

### Benefits

- ✅ **No relative imports**: `@simple-pos/shared/types` instead of `../../domain/entities`
- ✅ **Refactoring-safe**: Move files without breaking imports
- ✅ **Framework-agnostic**: Domain logic has zero Angular dependencies
- ✅ **Testable**: Libraries can be tested independently
- ✅ **Scalable**: Ready for future SaaS backend integration

## Clean Architecture Principles

### 1. Dependency Rule

Dependencies point **inward** only. Outer layers depend on inner layers, never the reverse.

```
UI → Application → Domain
Infrastructure → Application → Domain
```

### 2. Layer Responsibilities

**Domain Layer** (Innermost)

- Pure TypeScript interfaces and enums
- No framework dependencies
- No external library imports
- Contains: Entities, Enums, DTOs

**Application Layer**

- Business logic and orchestration
- Platform-agnostic services
- Depends only on Domain layer
- Contains: Services, Use Cases

**Infrastructure Layer**

- Database access (SQLite, IndexedDB)
- External APIs and integrations
- Platform-specific implementations
- Depends on Application and Domain

**Presentation Layer (UI)**

- Angular components
- Route guards
- Layouts and pages
- Depends on all inner layers

### 3. Interfaces as Contracts

The `BaseRepository<T>` interface ensures both SQLite and IndexedDB implementations provide identical APIs:

```typescript
export interface BaseRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: number, entity: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
  count(): Promise<number>;
}
```

## Dual Repository Pattern

### Architecture

Every entity has **two repository implementations**:

1. **SQLite Repository** (Tauri/Desktop)
   - Direct SQL queries via `@tauri-apps/plugin-sql`
   - ACID transactions
   - Relational integrity with foreign keys
   - Migration-based schema management

2. **IndexedDB Repository** (Web/PWA)
   - Object store operations
   - Indexed queries for performance
   - Schema versioning with `onupgradeneeded`
   - Browser-native persistence

### Platform Selection

The `RepositoryFactory` dynamically selects the correct implementation:

```typescript
@Injectable({ providedIn: 'root' })
export class RepositoryFactory {
  constructor(
    private platformService: PlatformService,
    private sqliteOrderRepo: SQLiteOrderRepository,
    private indexedDBOrderRepo: IndexedDBOrderRepository,
  ) {}

  getOrderRepository(): BaseRepository<Order> {
    return this.platformService.isTauri() ? this.sqliteOrderRepo : this.indexedDBOrderRepo;
  }
}
```

### Platform Detection

```typescript
@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly _isTauri: boolean;

  constructor() {
    // Tauri v2 exposes window.__TAURI__ global
    this._isTauri =
      typeof window !== 'undefined' &&
      typeof (window as any).__TAURI__ === 'object' &&
      (window as any).__TAURI__ !== null;
  }

  isTauri(): boolean {
    return this._isTauri;
  }
  isWeb(): boolean {
    return !this._isTauri;
  }
}
```

## Entity Relationship Schema

### Core Entities (16 Total)

```
┌─────────────┐
│   Account   │ ← Multi-tenancy support
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐
│    User     │ ← Authentication & roles
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐       ┌──────────────┐
│    Order    │ ◄──── │    Table     │ ← Restaurant tables
└──────┬──────┘  0:1  └──────────────┘
       │
       │ 1:N
       │
┌──────▼──────────┐
│   OrderItem     │
└──────┬──────────┘
       │
       │ 1:N
       │
┌──────▼──────────────┐
│ OrderItemExtra      │
└─────────────────────┘

┌──────────────┐       ┌──────────────┐
│   Product    │ ◄──── │  Category    │
└──────┬───────┘  N:1  └──────────────┘
       │
       ├─── 1:N ───▶ ┌──────────────┐
       │             │   Variant    │ ← Size/type variations
       │             └──────────────┘
       │
       ├─── N:N ───▶ ┌──────────────┐
       │             │    Extra     │ ← Add-ons (via ProductExtra)
       │             └──────────────┘
       │
       └─── N:N ───▶ ┌──────────────┐
                     │  Ingredient  │ ← Recipe (via ProductIngredient)
                     └──────────────┘

┌──────────────┐
│  CodeTable   │ ← Enum persistence
└──────┬───────┘
       │ 1:N
       │
┌──────▼──────────────┐
│ CodeTranslation     │ ← Multi-language support
└─────────────────────┘
```

## Key Services Architecture

### AuthService

**Responsibilities:**

- User authentication (PIN/email+password)
- bcrypt password hashing (10 salt rounds)
- Session management with localStorage
- Role-based authorization

**Key Methods:**

```typescript
login(username: string, pin: string): Promise<UserSession>
loginWithEmail(email: string, password: string): Promise<UserSession>
register(accountEmail: string, ...): Promise<{user, account}>
hasRole(role: UserRoleEnum): boolean
logout(): void
```

### OrderService

**Responsibilities:**

- Order lifecycle management
- Status transitions (OPEN → PREPARING → READY → SERVED → COMPLETED)
- Table status synchronization
- Order number generation

**Key Methods:**

```typescript
createOrder(data: CreateOrderData): Promise<Order>
getOpenOrderByTable(tableId: number): Promise<Order | null>
addItemsToOrder(orderId: number, items: CartItem[]): Promise<Order>
updateOrderStatus(id: number, statusId: number): Promise<Order>
checkAndUpdateOrderStatusByItems(orderId: number): Promise<void>
```

### CartService

**Responsibilities:**

- Multi-context cart management
- Tax calculation (18% Kosovo VAT, tax-inclusive)
- Item deduplication
- Tip management

**Architecture:**

```typescript
// Separate carts per context (table or order type)
private allCarts = signal<Record<string, CartItem[]>>({});
// Key format: 'table_1', 'table_2', 'TAKEAWAY', 'DELIVERY'

// Active context determines which cart is visible
private activeContextKey = signal<string>('default');

// Computed values for reactive UI
readonly cart = computed(() => this.allCarts()[this.activeContextKey()] || []);
readonly tip = computed(() => this.allTips()[this.activeContextKey()] || 0);
```

### PrinterService

**Responsibilities:**

- ESC/POS thermal printing (desktop)
- HTML print fallback (web)
- Receipt and kitchen ticket formatting
- Bilingual support (EN/AL)

**Printer Configuration:**

```typescript
interface PrinterConfig {
  receipt: {
    connection: string; // 'tcp:192.168.1.100:9100'
    width: number; // 42 characters
  };
  kitchen: {
    connection: string;
    width: number; // 32 characters
  };
}
```

### BackupService

**Responsibilities:**

- Full database export
- Encrypted backups (optional)
- Cross-platform restore
- Data validation

**Backup Format:**

```typescript
interface BackupData {
  version: string; // '1.0.0'
  createdAt: string;
  encrypted: boolean;
  data: {
    codeTables: any[];
    users: any[];
    orders: any[];
    // ... all 16 entity types
  };
}
```

## Routing Architecture

### Route Structure

```
/ (Landing)
├── /initial-setup [setupGuard]
├── /register
├── /login
├── /staff-select [authGuard]
├── /unauthorized
│
├── / [staffGuard] → PosShellComponent
│   ├── /dashboard
│   ├── /active-orders
│   ├── /kitchen
│   ├── /reports
│   └── /pos
│       ├── / (order-type-selection)
│       ├── /table-selection
│       ├── /product-selection
│       ├── /cart
│       └── /payment
│
└── /admin [adminGuard] → AdminShellComponent
    ├── / (dashboard)
    ├── /tables
    ├── /categories
    ├── /products
    ├── /variants
    ├── /extras
    ├── /ingredients
    ├── /users
    ├── /printer
    ├── /backup
    ├── /backup-settings
    └── /error-log
```

### Guards

**authGuard**: Checks if user is logged in
**staffGuard**: Checks if staff member is selected
**adminGuard**: Checks for ADMIN role
**setupGuard**: Redirects if setup is already complete
**desktopLandingGuard**: Shows landing only on desktop

## State Management with Signals

### Angular Signals Architecture

**Signals** (Angular 21) provide fine-grained reactivity:

```typescript
// Define reactive state
private allCarts = signal<Record<string, CartItem[]>>({});

// Derived/computed state
readonly cart = computed(() => {
  return this.allCarts()[this.activeContextKey()] || [];
});

// Update state
this.allCarts.set({ ...updatedCarts });

// Component auto-updates when signal changes
```

**Benefits:**

- No manual subscription management
- Automatic change detection
- Type-safe reactive primitives
- Better performance than RxJS for UI state

## Database Schema Management

### SQLite (Tauri)

Migrations in `src-tauri/migrations/`:

```sql
-- 20231201_000001_initial.sql
CREATE TABLE IF NOT EXISTS "order" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  type_id INTEGER NOT NULL,
  status_id INTEGER NOT NULL,
  table_id INTEGER,
  subtotal REAL NOT NULL,
  tax REAL NOT NULL,
  tip REAL NOT NULL,
  total REAL NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  user_id INTEGER NOT NULL,
  cancelled_reason TEXT,
  customer_name TEXT,
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (table_id) REFERENCES "table"(id),
  FOREIGN KEY (type_id) REFERENCES code_table(id),
  FOREIGN KEY (status_id) REFERENCES code_table(id)
);
```

### IndexedDB (Web)

Schema versioning in `IndexedDBService`:

```typescript
async getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SimpleDatabase', 2);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (oldVersion < 1) {
        // Create object stores
        const orderStore = db.createObjectStore('order', { keyPath: 'id' });
        orderStore.createIndex('orderNumber', 'orderNumber', { unique: true });
        orderStore.createIndex('statusId', 'statusId', { unique: false });
        // ...
      }

      if (oldVersion < 2) {
        // Migration: add new indexes
        const transaction = event.target.transaction;
        const orderItemStore = transaction.objectStore('order_item');
        orderItemStore.createIndex('statusId', 'statusId', { unique: false });
      }
    };
  });
}
```

## Security Architecture

### Authentication Flow

```
1. User enters credentials (username+PIN or email+password)
   ↓
2. AuthService validates and hashes with bcrypt
   ↓
3. UserSession created with role information
   ↓
4. Session persisted to localStorage
   ↓
5. Route guards use session for authorization
```

### Authorization

**Role Hierarchy:**

```
ADMIN    → Full access (all routes, all operations)
CASHIER  → POS operations, view orders
KITCHEN  → Kitchen display, mark items ready
DRIVER   → View delivery orders
```

### Security Measures

- bcrypt hashing (10 salt rounds) for all passwords/PINs
- Input sanitization service
- SQL injection prevention via parameterized queries
- Role-based route guards
- Default PIN enforcement ("0000" must be changed)
- Session timeout on browser close

## Performance Optimizations

### Lazy Loading

All major routes are lazy-loaded:

```typescript
{
  path: 'admin',
  loadChildren: () => import('./ui/routes/admin.routes')
    .then(m => m.ADMIN_ROUTES),
}
```

### Angular Signals

Replace RxJS subscriptions with computed signals for better performance:

```typescript
// Before (RxJS)
this.cart$
  .pipe(map((items) => items.reduce((sum, i) => sum + i.total, 0)))
  .subscribe((total) => (this.total = total));

// After (Signals)
total = computed(() => this.cart().reduce((sum, i) => sum + i.total, 0));
```

### IndexedDB Indexes

Strategic indexes for common queries:

```typescript
orderStore.createIndex('statusId', 'statusId'); // Filter by status
orderStore.createIndex('createdAt', 'createdAt'); // Sort by date
orderStore.createIndex('tableId', 'tableId'); // Filter by table
```

## Testing Strategy

### Unit Tests (Vitest)

```typescript
describe('CartService', () => {
  it('should calculate tax correctly', () => {
    const summary = cartService.getSummary();
    expect(summary.tax).toBe((summary.subtotal * 0.18) / 1.18);
  });
});
```

### E2E Testing Approach

- Test POS workflow: Select table → Add products → Checkout
- Test kitchen flow: View orders → Mark items ready
- Test admin operations: CRUD for all entities

## Deployment

### Desktop (Tauri)

```bash
pnpm run tauri:build
```

Outputs:

- Windows: `.exe` installer
- macOS: `.dmg` and `.app` bundle
- Linux: `.deb`, `.AppImage`

### Web (PWA)

```bash
pnpm run build
```

Outputs to `dist/`, ready for:

- Static hosting (Netlify, Vercel)
- Docker container
- Traditional web server (nginx, Apache)

## Future Architecture Considerations

### Hybrid SaaS Model

See `docs/hybrid-saas-roadmap.md` for planned evolution to:

- Cloud backup sync
- Multi-location support
- Central reporting dashboard
- Offline-first with eventual consistency

### Microservices Migration

Potential future split:

- **Order Service**: Order processing
- **Kitchen Service**: Kitchen display
- **Reporting Service**: Analytics
- **Auth Service**: Centralized authentication

### Current Status: Monolith (v1.11.0)

The current architecture is a well-structured monolith, appropriate for:

- Single-location restaurants
- Offline operation requirements
- Simple deployment model
- Full data ownership
