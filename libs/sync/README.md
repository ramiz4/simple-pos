# @simple-pos/sync

Framework-agnostic sync protocol library shared between the POS Angular app and the NestJS API. Provides the single source of truth for conflict resolution strategies, payload validation, protocol type aliases, and sync constants.

## Main Exports

| Module        | Key Exports                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `conflict/`   | `LastWriteWinsStrategy`, `ServerWinsStrategy`, `ClientWinsStrategy`, `FieldMergeStrategy`, `resolveConflict()`                                                     |
| `validation/` | `validateEntityChange()`, `validateSyncPushRequest()`, `ValidationResult`                                                                                          |
| `protocol/`   | `EntityChange`, `SyncPushRequest`, `SyncPullResponse`, `SyncConflict`, `ConflictResolution`, `SyncDelta`, `latestTimestamp()`, `isNewerVersion()`, `nextVersion()` |
| `constants/`  | `MAX_BATCH_SIZE`, `DEFAULT_PULL_LIMIT`, `MAX_PULL_LIMIT`, `SYNC_INTERVAL_MS`, `MAX_RETRY_ATTEMPTS`, `RETRY_BASE_DELAY_MS`                                          |

## Usage

```typescript
import {
  resolveConflict,
  ServerWinsStrategy,
  validateSyncPushRequest,
  SYNC_INTERVAL_MS,
} from '@simple-pos/sync';

// Validate an incoming push request
const result = validateSyncPushRequest(request);
if (!result.valid) {
  throw new Error(result.errors.join(', '));
}

// Resolve a conflict using a strategy
const winner = resolveConflict(clientChange, serverChange, new ServerWinsStrategy());
```

## Running unit tests

Run `nx test sync` to execute the unit tests via [Vitest](https://vitest.dev/).
