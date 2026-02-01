# Simple Bistro POS - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER (UI)                          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  TestPersistenceComponent (Angular Standalone)                   │   │
│  │  - Glassmorphism UI with TailwindCSS                            │   │
│  │  - Reactive state with Signals                                  │   │
│  │  - CRUD interface                                               │   │
│  └────────────────────────┬────────────────────────────────────────┘   │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER (Services)                        │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  TestService                                                     │   │
│  │  - Business logic                                               │   │
│  │  - State management (Signals)                                   │   │
│  │  - Error handling                                               │   │
│  └────────────────────────┬────────────────────────────────────────┘   │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER (Adapters)                       │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  RepositoryFactory                                             │     │
│  │  - Platform detection                                          │     │
│  │  - Dynamic repository selection                                │     │
│  └───────────────────┬───────────────────────┬────────────────────┘     │
│                      │                       │                          │
│          ┌───────────▼──────────┐ ┌─────────▼──────────┐               │
│          │  SQLiteTestRepository│ │IndexedDBTestRepository│             │
│          │  (Tauri Desktop)     │ │  (Web/PWA)          │               │
│          │  - @tauri-apps/      │ │  - Native IndexedDB │               │
│          │    plugin-sql        │ │  - Promise-based    │               │
│          └───────────┬──────────┘ └─────────┬──────────┘               │
└─────────────────────┼──────────────────────┼───────────────────────────┘
                      │                      │
                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER (Entities)                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  TestEntity                                                      │   │
│  │  {                                                               │   │
│  │    id: number                                                    │   │
│  │    name: string                                                  │   │
│  │    value: string | null                                          │   │
│  │    createdAt: string                                             │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CORE LAYER (Interfaces)                           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  BaseRepository<T>                                               │   │
│  │  - findById(id)                                                  │   │
│  │  - findAll()                                                     │   │
│  │  - create(entity)                                                │   │
│  │  - update(id, entity)                                            │   │
│  │  - delete(id)                                                    │   │
│  │  - count()                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE LAYER (Data)                           │
│                                                                          │
│  ┌──────────────────────┐              ┌────────────────────────┐      │
│  │  SQLite Database     │              │  Browser IndexedDB     │      │
│  │  (bistro.db)         │              │  (BistroPosDB)         │      │
│  │                      │              │                        │      │
│  │  - Tauri Desktop     │              │  - Web/PWA             │      │
│  │  - Native file       │              │  - Browser storage     │      │
│  │  - Migrations        │              │  - Object stores       │      │
│  └──────────────────────┘              └────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                           PLATFORM DETECTION
═══════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────┐
│      PlatformService               │
│                                    │
│  if (window.__TAURI__) {          │
│    → Use SQLiteRepository         │
│  } else {                          │
│    → Use IndexedDBRepository      │
│  }                                 │
└────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                           DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════

User Action: "Create new test entity"
    │
    ▼
[TestPersistenceComponent]
    │ calls: testService.createTestEntity()
    ▼
[TestService]
    │ calls: repository.create(entity)
    ▼
[RepositoryFactory]
    │ determines platform
    │
    ├─► [SQLiteTestRepository]      (if Tauri)
    │       │ INSERT INTO test_entity
    │       ▼
    │   [SQLite Database]
    │
    └─► [IndexedDBTestRepository]   (if Web)
            │ objectStore.add()
            ▼
        [Browser IndexedDB]


═══════════════════════════════════════════════════════════════════════════
                           TECHNOLOGY STACK
═══════════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                              │
│  • Angular 21.1.2 (Standalone Components)                            │
│  • TypeScript 5.9.2 (Strict Mode)                                    │
│  • TailwindCSS 3.x (Glassmorphism)                                   │
│  • Angular Signals (Reactive State)                                  │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│  DESKTOP RUNTIME                                                       │
│  • Tauri 2.9.6                                                        │
│  • Rust 1.93.0                                                        │
│  • @tauri-apps/plugin-sql 2.3.1                                      │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│  PERSISTENCE                                                           │
│  • SQLite (Desktop via Tauri)                                         │
│  • IndexedDB (Web/PWA via native API)                                │
└───────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                           FOLDER STRUCTURE
═══════════════════════════════════════════════════════════════════════════

simple-bistro-pos/
├── src/
│   ├── app/
│   │   ├── core/                    [Interfaces & Base Classes]
│   │   │   ├── interfaces/
│   │   │   │   └── base-repository.interface.ts
│   │   │   └── base/
│   │   │
│   │   ├── domain/                  [Business Entities & Enums]
│   │   │   ├── entities/
│   │   │   │   └── test-entity.interface.ts
│   │   │   └── enums/
│   │   │
│   │   ├── application/             [Services & Use Cases]
│   │   │   ├── services/
│   │   │   │   └── test.service.ts
│   │   │   └── use-cases/
│   │   │
│   │   ├── infrastructure/          [Data Access & Adapters]
│   │   │   ├── repositories/
│   │   │   │   ├── sqlite-test.repository.ts
│   │   │   │   └── indexeddb-test.repository.ts
│   │   │   └── adapters/
│   │   │       └── repository.factory.ts
│   │   │
│   │   ├── ui/                      [Components & Pages]
│   │   │   ├── components/
│   │   │   │   └── test-persistence/
│   │   │   │       └── test-persistence.component.ts
│   │   │   └── pages/
│   │   │
│   │   └── shared/                  [Utilities & Helpers]
│   │       ├── utilities/
│   │       │   └── platform.service.ts
│   │       └── helpers/
│   │
│   └── styles.css                   [TailwindCSS + Glassmorphism]
│
├── src-tauri/
│   ├── src/
│   │   └── main.rs                  [Tauri Entry Point]
│   ├── migrations/
│   │   └── 001_initial.sql          [Database Schema]
│   ├── Cargo.toml                   [Rust Dependencies]
│   └── tauri.conf.json              [Tauri Configuration]
│
└── Documentation/
    ├── ARCHITECTURE.md
    ├── SETUP.md
    ├── PHASE_0_COMPLETE.md
    └── PROJECT_INITIALIZED.md


═══════════════════════════════════════════════════════════════════════════
                     KEY ARCHITECTURAL PRINCIPLES
═══════════════════════════════════════════════════════════════════════════

1. DEPENDENCY INVERSION
   UI → Services → Repositories (Interface) ← Implementations

2. SINGLE RESPONSIBILITY
   Each layer has one clear purpose

3. PLATFORM AGNOSTIC
   Business logic independent of storage mechanism

4. TESTABILITY
   All layers can be tested in isolation

5. MAINTAINABILITY
   Clear structure, easy to extend

6. TYPE SAFETY
   TypeScript strict mode throughout
```
