# AI MVP Execution Plan
# Simple Bistro POS – Autonomous Development Roadmap
# Angular + Tauri + Offline-First

---

# 1. Purpose

This document defines the autonomous execution roadmap for an AI Agent responsible for developing the full MVP of the Simple Bistro POS system.

The AI Agent must:

- Follow Clean Architecture
- Enforce enum + CodeTable standard
- Maintain offline-first design
- Produce production-ready, structured code
- Generate tests where reasonable
- Avoid shortcuts that violate architecture rules

This roadmap defines execution order, deliverables, validation criteria, and completion gates.

---

# 2. Global Development Rules

The AI Agent MUST:

1. Never use raw string literals for categorical fields.
2. Always persist enums via CodeTable.
3. Enforce strict TypeScript mode.
4. Separate domain, application, infrastructure, and UI layers.
5. Use repository abstraction for all database access.
6. Keep UI Tailwind-first (no unnecessary custom CSS).
7. Maintain mobile-first responsiveness.
8. Ensure offline functionality at every stage.
9. Use transactional integrity for order creation.
10. Keep code readable and production-structured.

---

# 3. Architecture Lock (Phase 0)

## Objective
Establish unchangeable architectural foundation.

## Tasks

- Initialize Angular project (latest stable)
- Enable standalone components
- Enable strict TypeScript
- Install TailwindCSS
- Initialize Tauri
- Configure SQLite plugin
- Create layered folder structure:

/core
/domain
/application
/infrastructure
/ui
/shared

- Implement BaseRepository interface
- Implement SQLiteRepository
- Implement IndexedDbRepository
- Validate test entity persistence

## Completion Gate

- App runs in browser
- App runs in Tauri
- SQLite persists entity
- Repository abstraction functional

No feature work begins before this phase is complete.

---

# 4. Phase 1 – Core Domain & CodeTable System

## Objective
Implement foundational domain and enum persistence.

## Tasks

### 4.1 Implement CodeTable System

Entities:

- CodeTable
- CodeTranslation

CodeTypes required:

- TABLE_STATUS
- ORDER_TYPE
- ORDER_STATUS
- USER_ROLE

Seed data:

- All enums defined in PRD
- English + Albanian translations

### 4.2 Domain Enums

Implement:

- TableStatusEnum
- OrderTypeEnum
- OrderStatusEnum
- UserRoleEnum

Mapping layer:

Enum <-> CodeTable lookup

### 4.3 User System

- User entity
- PIN hashing (argon2 or bcrypt)
- Login flow
- Role-based access control
- Session persistence

### 4.4 Route Guards

- Protect admin routes
- Protect kitchen routes
- Role validation middleware

### Completion Gate

- Login works
- Role restriction works
- CodeTable fully integrated
- Translations functional
- No string unions used anywhere

---

# 5. Phase 2 – Admin Configuration Layer

## Objective
Enable full system configuration before POS flow.

## 5.1 Table Management

- CRUD tables
- Status stored via CodeTable FK
- Touch-optimized grid UI
- Status auto-update logic

## 5.2 Product Management

- Categories
- Products
- Variants
- Extras
- Ingredients
- Stock tracking
- Availability toggle

## 5.3 Inventory Logic

- Deduct stock on order commit
- Optional prevention when stock insufficient

## Completion Gate

- Admin can fully configure restaurant
- Stock logic works
- All entities persisted correctly
- Offline tested

---

# 6. Phase 3 – Core POS Flow

## Objective
Implement complete order lifecycle.

## 6.1 Order Creation

Flow:

1. Select order type
2. If DINE_IN → mandatory table selection
3. Add products
4. Select variants/extras
5. Confirm cash payment
6. Persist order transactionally

## 6.2 Order Status Flow

OPEN → PAID → PREPARING → READY → COMPLETED  
CANCELLED allowed from OPEN  

All statuses persisted via CodeTable.

## 6.3 Table Automation

- Dine-In order → table = OCCUPIED
- Order complete/cancel → table = FREE

## 6.4 Kitchen View

- Show PREPARING orders
- Allow status update

## Completion Gate

- Full order lifecycle works
- Table state automated
- No inconsistent state
- Offline fully functional

---

# 7. Phase 4 – Printing & Reporting

## 7.1 ESC/POS Printing

- Printer abstraction service
- Receipt template
- Kitchen ticket template
- Hardware tested via Tauri

## 7.2 Reporting

Generate:

- Daily revenue
- Revenue by order type
- Order count
- Z-report
- CSV export

## 7.3 Backup System

- Local export file
- Import mechanism
- Optional encryption

## Completion Gate

- Printing works on hardware
- Reports accurate
- Backup validated
- Data integrity verified

---

# 8. Quality Assurance Requirements

AI Agent must ensure:

- No circular dependencies
- No direct DB access from UI layer
- Foreign key enforcement
- Transaction wrapping for order creation
- Strict typing across codebase
- Minimal memory footprint
- Cold start < 2 seconds

---

# 9. Performance Constraints

- UI 60 FPS
- Print < 2 seconds
- Memory < 200MB
- Zero runtime errors
- No blocking synchronous heavy operations

---

# 10. Validation Checklist (Final MVP Gate)

The MVP is complete when:

- Order creation < 10 seconds
- Table logic correct
- Printing works on real ESC/POS printer
- Reporting accurate
- Fully offline functional
- No critical bugs
- Stable Tauri desktop build
- Clean architecture maintained

---

# 11. Post-MVP Preparation (Optional)

After MVP:

- Add Dark Mode
- Dashboard
- Cloud sync preparation
- CI/CD pipeline
- Packaging & installer creation

---

# 12. Autonomous Execution Policy

The AI Agent must:

- Progress phase-by-phase
- Never skip architectural validation
- Refactor immediately if architecture violated
- Keep commits logically separated
- Maintain production-grade structure at all times

The system must remain clean, extensible, and cloud-ready.

---

# End of AI MVP Execution Plan
