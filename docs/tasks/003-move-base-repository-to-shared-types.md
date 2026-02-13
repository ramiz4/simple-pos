# Task: Move BaseRepository Interface to `libs/shared/types`

## Description

The `BaseRepository<T>` interface currently lives inside the POS application layer at `apps/pos/src/app/core/interfaces/base-repository.interface.ts`. This is a **domain-level contract** that defines the standard CRUD operations for all repository implementations. Since it is framework-agnostic and could be referenced by domain logic, shared utilities, or even the API project, it belongs in the shared types library.

## Status

- **Identified**: February 13, 2026
- **Status**: Open
- **Priority**: High
- **Effort**: Low

## Recommended Agent

- **Agent**: `repository-specialist`

## Current State

### File Location

```
apps/pos/src/app/core/interfaces/base-repository.interface.ts
```

### File Content

```typescript
export interface BaseRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: number, entity: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
  count(): Promise<number>;
}
```

### Why It's Problematic

1. **Not accessible outside `apps/pos`** — if the API needs a similar pattern, it would duplicate the interface
2. **Violates Clean Architecture** — domain contracts should live at the shared/domain layer, not inside an application
3. **Limits reusability** — `libs/domain` cannot reference this interface since libs shouldn't import from apps
4. **Inconsistent with project conventions** — all shared interfaces are in `libs/shared/types`

## Proposed Solution

### Step 1: Create the Interface in `libs/shared/types`

Create `libs/shared/types/src/lib/base-repository.interface.ts`:

```typescript
/**
 * Base repository interface defining standard CRUD operations.
 * All repository implementations (SQLite, IndexedDB, etc.) must implement this interface.
 *
 * @template T - The entity type this repository manages.
 */
export interface BaseRepository<T> {
  /** Find an entity by its ID */
  findById(id: number): Promise<T | null>;

  /** Find all entities */
  findAll(): Promise<T[]>;

  /** Create a new entity */
  create(entity: Omit<T, 'id'>): Promise<T>;

  /** Update an existing entity */
  update(id: number, entity: Partial<T>): Promise<T>;

  /** Delete an entity by its ID */
  delete(id: number): Promise<void>;

  /** Count total entities */
  count(): Promise<number>;
}
```

### Step 2: Export from Library Index

Update `libs/shared/types/src/index.ts`:

```typescript
// ... existing exports
export * from './lib/base-repository.interface';
```

### Step 3: Update All Imports in `apps/pos`

Find and replace all occurrences:

```typescript
// Before:
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { BaseRepository } from '../../../core/interfaces/base-repository.interface';
// etc.

// After:
import { BaseRepository } from '@simple-pos/shared/types';
```

**Files to update** (all files in `apps/pos/src/app/infrastructure/` that reference the interface):

- `adapters/repository.factory.ts`
- All `repositories/sqlite-*.repository.ts`
- All `repositories/indexeddb-*.repository.ts`
- Any services that reference it

### Step 4: Delete the Old File

Remove `apps/pos/src/app/core/interfaces/base-repository.interface.ts`.

If `core/interfaces/` becomes empty, remove the directory too.

### Step 5: Validate

```bash
pnpm pos:build
pnpm pos:test
pnpm nx lint pos
pnpm nx lint shared-types
```

## Acceptance Criteria

- [ ] `BaseRepository<T>` is defined in `libs/shared/types/src/lib/base-repository.interface.ts`
- [ ] It is exported via `@simple-pos/shared/types`
- [ ] All imports in `apps/pos` are updated to use `@simple-pos/shared/types`
- [ ] The old file `apps/pos/src/app/core/interfaces/base-repository.interface.ts` is deleted
- [ ] Build, tests, and lint all pass
- [ ] No circular dependency introduced

## References

- [Nx Library Exports](https://nx.dev/concepts/more-concepts/library-types)
- Clean Architecture: domain contracts belong at the domain/shared layer
