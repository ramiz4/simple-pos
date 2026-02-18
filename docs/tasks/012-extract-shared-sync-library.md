# Task: Extract Shared Sync Library

## Description

Sync/offline logic is currently split across both the POS Angular app and the NestJS API with no shared contracts between them. The POS app has its own sync engine, mode management, and metadata services, while the API has its own conflict resolution and entity sync adapter registry. Extracting the shared sync protocol, contracts, and pure logic into a dedicated library ensures both sides stay aligned and makes the sync layer independently testable.

## Status

- **Identified**: February 13, 2026
- **Status**: Completed
- **Priority**: Low (Future — implement when sync features are actively being extended)
- **Effort**: Medium
- **Completed**: February 18, 2026
- **Verification**: `pnpm nx test sync`, `pnpm nx test pos`, `pnpm nx test domain`

## Recommended Agent

- **Agent**: `software-architect`

## Current State

### POS-Side Sync Code

```
apps/pos/src/app/
├── application/services/
│   ├── sync-engine.service.ts          # Orchestrates sync operations
│   ├── sync-engine.service.spec.ts
│   ├── sync-mode.service.ts            # Online/offline mode management
│   └── sync-mode.service.spec.ts
├── infrastructure/
│   ├── http/
│   │   ├── cloud-sync-client.service.ts # HTTP sync calls to API
│   │   └── cloud-auth-client.service.ts # Auth for sync
│   └── services/
│       └── sync-metadata-migration.service.ts # Metadata schema evolution
```

### API-Side Sync Code

```
apps/api/src/app/sync/
├── sync.controller.ts                   # Sync API endpoints
├── sync.controller.spec.ts
├── sync.service.ts                      # Server-side sync logic
├── sync.service.spec.ts
├── sync.module.ts
├── conflict-resolution.service.ts       # Conflict resolution strategies
└── entity-sync-adapter.registry.ts      # Per-entity sync adapters
```

### Shared Types (already in libs)

```
libs/shared/types/src/lib/
├── sync-metadata.interface.ts           # SyncMetadata type
└── sync.interface.ts                    # Sync-related interfaces
```

### Problem

- **Conflict resolution logic** should be deterministic and identical on both sides — currently it's only in the API
- **Sync protocol** (push/pull, delta format, version vectors) is implicitly defined by the HTTP contract with no formal spec
- **Entity change format** is defined separately on each side
- **Adding new sync entities** requires coordinated changes in both apps with no shared contract enforcing consistency

## Proposed Solution

### New Library Structure

```
libs/
  sync/                                 # @simple-pos/sync
    src/
      lib/
        protocol/
          sync-protocol.interface.ts    # Push/pull request/response shapes
          sync-delta.interface.ts       # Delta/changeset format
          entity-change.interface.ts    # Per-entity change envelope
          sync-version.ts              # Version vector / timestamp logic
        conflict/
          conflict-resolution.ts        # Pure conflict resolution strategies
          conflict-resolution.spec.ts
          merge-strategy.interface.ts   # Strategy pattern for merge behavior
        validation/
          sync-validator.ts             # Validate sync payloads
          sync-validator.spec.ts
        constants/
          sync-constants.ts             # Max batch size, retry config, etc.
      index.ts
    project.json
    tsconfig.json
    tsconfig.lib.json
    tsconfig.spec.json
    vitest.config.mts
```

### Key Design Principles

1. **Framework-agnostic**: No Angular or NestJS imports — pure TypeScript
2. **Deterministic**: Same input → same output on both client and server
3. **Contract-first**: Interfaces define the protocol, implementations conform
4. **Testable**: 100% unit-testable with no I/O dependencies

### Step 1: Generate the Library

```bash
pnpm nx g @nx/js:lib sync --directory=libs/sync --importPath=@simple-pos/sync
```

### Step 2: Add Path Alias

```jsonc
// tsconfig.base.json
"paths": {
  "@simple-pos/sync": ["libs/sync/src/index.ts"],
  // ... existing
}
```

### Step 3: Define Sync Protocol Interfaces

```typescript
// libs/sync/src/lib/protocol/sync-protocol.interface.ts
import { SyncMetadata } from '@simple-pos/shared/types';

export interface SyncPushRequest {
  tenantId: string;
  deviceId: string;
  lastSyncTimestamp: string;
  changes: EntityChange[];
}

export interface SyncPullResponse {
  serverTimestamp: string;
  changes: EntityChange[];
  hasMore: boolean;
  conflicts: SyncConflict[];
}

export interface EntityChange {
  entityType: string;
  entityId: number | string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: string;
  version: number;
  metadata: SyncMetadata;
}

export interface SyncConflict {
  entityType: string;
  entityId: number | string;
  clientVersion: EntityChange;
  serverVersion: EntityChange;
  resolution: ConflictResolution;
}

export type ConflictResolution = 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL';
```

### Step 4: Extract Conflict Resolution Logic

Move the pure logic from `apps/api/src/app/sync/conflict-resolution.service.ts`:

```typescript
// libs/sync/src/lib/conflict/conflict-resolution.ts

export interface MergeStrategy {
  resolve(client: EntityChange, server: EntityChange): EntityChange;
}

export class LastWriteWinsStrategy implements MergeStrategy {
  resolve(client: EntityChange, server: EntityChange): EntityChange {
    return new Date(client.timestamp) > new Date(server.timestamp) ? client : server;
  }
}

export class ServerWinsStrategy implements MergeStrategy {
  resolve(_client: EntityChange, server: EntityChange): EntityChange {
    return server;
  }
}

export class FieldMergeStrategy implements MergeStrategy {
  resolve(client: EntityChange, server: EntityChange): EntityChange {
    // Merge non-conflicting fields, server wins on conflicts
    const merged = { ...server.data, ...client.data };
    return { ...server, data: merged };
  }
}

export function resolveConflict(
  client: EntityChange,
  server: EntityChange,
  strategy: MergeStrategy = new LastWriteWinsStrategy(),
): EntityChange {
  return strategy.resolve(client, server);
}
```

### Step 5: Update Both Apps to Import from Library

**API:**

```typescript
// apps/api/src/app/sync/conflict-resolution.service.ts
import { resolveConflict, LastWriteWinsStrategy, EntityChange } from '@simple-pos/sync';
// NestJS service wraps the pure function
```

**POS:**

```typescript
// apps/pos/src/app/application/services/sync-engine.service.ts
import { SyncPushRequest, SyncPullResponse, EntityChange } from '@simple-pos/sync';
// Angular service uses the shared types for HTTP calls
```

### Step 6: Move Existing Shared Types

Move `sync-metadata.interface.ts` and `sync.interface.ts` from `@simple-pos/shared/types` into `@simple-pos/sync` (or keep them in shared/types and have sync lib depend on them).

### Step 7: Tag the Library

```json
// libs/sync/project.json
{
  "tags": ["scope:shared", "type:domain"]
}
```

### Step 8: Validate

```bash
pnpm nx test sync
pnpm nx build api
pnpm nx build pos
pnpm test:all
```

## When to Implement

This task is best tackled when:

- Active development on sync features (new entity types, conflict resolution improvements)
- Preparing for multi-device sync testing
- Building the SaaS cloud sync infrastructure
- Encountering sync-related bugs caused by client/server contract mismatch

## Acceptance Criteria

- [x] `libs/sync` library created with `@simple-pos/sync` import path
- [x] Sync protocol interfaces defined (push/pull request/response shapes)
- [x] Conflict resolution logic extracted as pure functions
- [x] Both API and POS import shared sync contracts
- [x] Entity change format is the single source of truth
- [x] All sync-related tests pass
- [x] Library is framework-agnostic (no Angular/NestJS imports)
- [x] Nx tags and boundary rules updated

## Related Tasks

- Task 001: Nx project tags (must be in place to enforce sync lib boundaries)
- Task 005: Shared DTOs (sync payloads are a type of DTO)

## References

- [Offline-First Sync Patterns](https://rxdb.info/offline-first.html)
- [Conflict Resolution in Distributed Systems](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
- [Nx Library Types](https://nx.dev/concepts/more-concepts/library-types)
