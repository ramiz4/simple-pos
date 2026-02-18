import {
  ConflictResolutionStrategy,
  SyncConflict as SharedSyncConflict,
  SyncPullResponse as SharedSyncPullResponse,
  SyncPushRequest as SharedSyncPushRequest,
  SyncChangeSet,
} from '@simple-pos/shared/types';

/**
 * Re-export sync protocol types from @simple-pos/shared/types to keep
 * a single source of truth for the sync contract.
 */
export type SyncPushRequest = SharedSyncPushRequest;

export type SyncPullResponse = SharedSyncPullResponse;

/** Local alias used by this library; structurally defined in shared/types. */
export type EntityChange = SyncChangeSet;

export type SyncConflict = SharedSyncConflict;

export type ConflictResolution = ConflictResolutionStrategy;
