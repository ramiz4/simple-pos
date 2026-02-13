import { describe, expect, it } from 'vitest';
import type {
  ConflictResolutionStrategy,
  ResolveConflictRequest,
  ResolveConflictResponse,
  SyncConflict,
  SyncEntityName,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  SyncStatusResponse,
} from './sync.dto';
import { CONFLICT_RESOLUTION_STRATEGIES } from './sync.dto';

describe('shared dto sync exports', () => {
  it('should expose conflict resolution strategies for API and POS', () => {
    expect(CONFLICT_RESOLUTION_STRATEGIES).toContain('MANUAL');
    expect(CONFLICT_RESOLUTION_STRATEGIES).toContain('SERVER_WINS');
    expect(CONFLICT_RESOLUTION_STRATEGIES).toContain('CLIENT_WINS');
  });

  it('should expose sync contract types for compile-time usage', () => {
    const strategy: ConflictResolutionStrategy = 'MANUAL';
    const entity: SyncEntityName = 'product';
    const pushRequest: SyncPushRequest = {
      tenantId: 'tenant-1',
      deviceId: 'device-1',
      changes: [
        {
          entity,
          operation: 'CREATE',
          data: { name: 'Coffee' },
          version: 1,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const conflict: SyncConflict = {
      id: 'conflict-1',
      entity,
      cloudId: 'cloud-1',
      strategy,
      serverVersion: 2,
      clientVersion: 1,
      serverData: {},
      clientData: {},
      resolved: false,
    };
    const pushResponse: SyncPushResponse = {
      success: true,
      conflicts: [conflict],
      accepted: [{ entity, cloudId: 'cloud-1', syncedAt: new Date().toISOString() }],
      rejected: [],
      syncedAt: new Date().toISOString(),
    };
    const pullResponse: SyncPullResponse = {
      changes: pushRequest.changes,
      deletions: [],
      syncedAt: new Date().toISOString(),
      hasMore: false,
    };
    const resolveConflictRequest: ResolveConflictRequest = {
      conflictId: 'conflict-1',
      strategy,
    };
    const resolveConflictResponse: ResolveConflictResponse = {
      success: true,
      conflictId: resolveConflictRequest.conflictId,
      syncedAt: new Date().toISOString(),
    };
    const statusResponse: SyncStatusResponse = {
      online: true,
      mode: 'cloud',
      serverTime: new Date().toISOString(),
    };

    expect(pushResponse.success).toBe(true);
    expect(pullResponse.hasMore).toBe(false);
    expect(resolveConflictResponse.success).toBe(true);
    expect(statusResponse.mode).toBe('cloud');
  });
});
