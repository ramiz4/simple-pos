# Technical Architecture & Implementation Details

# Simple POS System

---

# 1. Architecture Overview

Frontend: Angular (latest stable)
Desktop Runtime: Tauri
Database: SQLite (Desktop) / IndexedDB (Web)
Styling: TailwindCSS
Architecture Pattern: Clean Architecture + Repository Pattern

Offline-first by design.

---

# 2. High-Level Architecture

## Layers

1. Presentation Layer (Angular UI)
2. Application Layer (Services / Use Cases)
3. Domain Layer (Entities + Enums)
4. Infrastructure Layer (Repositories, DB, Printer)

---

# 3. CodeTable System

## CodeTable Schema

### CodeTable

- id (PK)
- codeType (e.g., ORDER_STATUS)
- code (e.g., OPEN)
- sortOrder
- isActive

### CodeTranslation

- id
- codeTableId (FK)
- language (en, sq)
- label

---

# 4. Domain Enums

## TableStatusEnum

- FREE
- OCCUPIED
- RESERVED

## OrderTypeEnum

- DINE_IN
- TAKEAWAY
- DELIVERY

## OrderStatusEnum

- OPEN
- PAID
- PREPARING
- READY
- OUT_FOR_DELIVERY
- COMPLETED
- CANCELLED

## UserRoleEnum

- ADMIN
- CASHIER
- KITCHEN
- DRIVER

All enums persisted via CodeTable.

---

# 5. Database Entities

## User

- id
- name
- roleId (FK CodeTable)
- pinHash
- active

## Table

- id
- name
- number
- seats
- statusId (FK CodeTable)

## Product

- id
- name
- categoryId
- price
- stock
- isAvailable

## Variant

- id
- productId
- name
- priceModifier

## Extra

- id
- name
- price

## Ingredient

- id
- name
- stockQuantity

## Order

- id
- typeId (FK CodeTable)
- statusId (FK CodeTable)
- tableId (nullable)
- total
- createdAt
- userId

## OrderItem

- id
- orderId
- productId
- quantity

---

# 6. State Management

- Angular Signals
- Repository-based data access
- App bootstrap loads CodeTable cache
- Reactive UI updates

---

# 7. Printing Architecture

- ESC/POS abstraction service
- Separate receipt template
- Separate kitchen ticket template
- Tauri native plugin access

---

# 8. Offline Strategy

- SQLite for desktop
- IndexedDB for PWA
- Repository abstraction for portability
- Local backup export
- Optional encrypted backup

---

# 9. Security

- PIN hashed using bcrypt or argon2
- Role-based route guards
- Data validation at service layer
- Foreign key enforcement in DB

---

# 10. UI System

TailwindCSS only.

Glassmorphism base pattern:

- backdrop-blur-xl
- bg-white/30
- border border-white/20
- rounded-3xl
- shadow-xl

Mobile-first responsive design.

---

# 11. Deployment

## Web

- Static hosting
- PWA enabled

## Desktop

- Tauri build
- SQLite embedded
- Native printer access

---

# 12. Future Scalability

Prepared for:

- Cloud sync
- Multi-device sync
- Card payment integration
- Fiscal integration
- Multi-branch support
