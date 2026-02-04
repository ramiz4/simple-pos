# Roadmap: Hybrid SaaS & Cloud Sync Implementation

This document outlines the architectural plan for transitioning **Simple POS** from a local-only application to a Hybrid SaaS model.

## 1. Core Philosophy: "Local-First, Cloud-Synced"

The application must remain fully functional offline. The SaaS features (remote reporting, cross-device sync) will be built as an asynchronous layer on top of the existing local databases (SQLite/IndexedDB).

---

## 0. Phase 0: Multi-Tenant Foundation (COMPLETED)

The application core has been established to support multi-tenancy and robust user management.

- **User Uniqueness:**
  - Email addresses are globally unique across all accounts.
  - Staff usernames are unique ONLY within a specific account, allowing different shops to have users with the same name (e.g., "Cashier").
- **Owner Verification:** Implemented a secure flow for owner operations (e.g., creating other staff members) requiring the account owner's password.
- **Database Architecture:** Local database schemas are established to support the account-centric model.

---

## 2. Phase 1: Data Model Migration

Every table in the local database must be updated to support synchronization tracking.

### Schema Changes

Add the following fields to all entity tables (Products, Orders, Categories, etc.):

- `cloudId`: `UUID` (Primary key for the cloud, allows local creation without ID collisions).
- `updatedAt`: `TIMESTAMP` (ISO String of the last local change).
- `isDirty`: `BOOLEAN` (0/1). Set to `1` when local changes haven't been pushed to the cloud.
- `lastSyncedAt`: `TIMESTAMP` (ISO String of the last successful push/pull).

### Repository Updates

Modify the `BaseRepository` implementations to:

1.  Generate a `cloudId` on `create()`.
2.  Set `isDirty = 1` and update `updatedAt` on every `create()` and `update()`.

---

## 3. Phase 2: The Sync Engine

A background service will handle the bi-directional data flow.

### `CloudSyncService` logic:

1.  **Connectivity Monitor:** Detects when the internet is available.
2.  **The "Push" Loop:**
    - Find all records where `isDirty = 1`.
    - Group by entity type.
    - POST to `/api/v1/sync/push`.
    - On success, set `isDirty = 0` and update `lastSyncedAt`.
3.  **The "Pull" Loop:**
    - Request `/api/v1/sync/pull?since={max_lastSyncedAt}`.
    - Merge incoming records into the local database (ignoring local `isDirty` records to prevent overwriting pending changes).

---

## 4. Phase 3: SaaS Backend Architecture

A central API to store and serve data for multiple accounts.

### Tech Stack Recommendation:

- **Framework:** NestJS (Node.js) or Go.
- **Database:** PostgreSQL (with Row-Level Security) or MongoDB.
- **Auth:** JWT-based authentication (supporting Account-based multi-tenancy).

### Data Isolation:

Every record in the cloud MUST have an `accountId`.

```sql
SELECT * FROM products WHERE account_id = 'my-shop-uuid';
```

---

## 5. Phase 4: User Experience & Monetization

- **Account Management:** UI for users to sign up for a "Cloud Account".
- **Real-time Indicators:** A "Sync Status" icon in the header (Cloud icon: Green = Synced, Red = Offline, Pulsing = Syncing).
- **Subscription Levels:**
  - **Free:** Local only (current behavior).
  - **Pro:** Cloud Backup & Remote Reports.
  - **Enterprise:** Multi-store management and advanced analytics.

---

## 6. Implementation Checklist

- [ ] Research UUID generation for SQLite/IndexedDB.
- [ ] Create `SyncMetadata` interface.
- [ ] Implement `HttpRepository` (remote implementation of `BaseRepository`).
- [ ] Setup simple Express/PostgreSQL backend for initial sync testing.
- [ ] Add "Force Sync" button in Settings UI.
