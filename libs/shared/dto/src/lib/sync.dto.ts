import type {
  ConflictResolutionStrategy as SharedConflictResolutionStrategy,
  ResolveConflictRequest as SharedResolveConflictRequest,
  ResolveConflictResponse as SharedResolveConflictResponse,
  SyncConflict as SharedSyncConflict,
  SyncEntityName as SharedSyncEntityName,
  SyncPullResponse as SharedSyncPullResponse,
  SyncPushRequest as SharedSyncPushRequest,
  SyncPushResponse as SharedSyncPushResponse,
  SyncStatusResponse as SharedSyncStatusResponse,
} from '@simple-pos/shared/types';
export { CONFLICT_RESOLUTION_STRATEGIES } from '@simple-pos/shared/types';

export type ConflictResolutionStrategy = SharedConflictResolutionStrategy;
export type ResolveConflictRequest = SharedResolveConflictRequest;
export type ResolveConflictResponse = SharedResolveConflictResponse;
export type SyncConflict = SharedSyncConflict;
export type SyncEntityName = SharedSyncEntityName;
export type SyncPullResponse = SharedSyncPullResponse;
export type SyncPushRequest = SharedSyncPushRequest;
export type SyncPushResponse = SharedSyncPushResponse;
export type SyncStatusResponse = SharedSyncStatusResponse;
