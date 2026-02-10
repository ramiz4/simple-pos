import { SyncEntityMetadata } from './sync-metadata.interface';

export const SYNC_ENTITIES = [
  'account',
  'user',
  'code_table',
  'code_translation',
  'category',
  'extra',
  'ingredient',
  'table',
  'product',
  'variant',
  'product_extra',
  'product_ingredient',
  'order',
  'order_item',
  'order_item_extra',
] as const;

export type SyncEntityName = (typeof SYNC_ENTITIES)[number];

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export const CONFLICT_RESOLUTION_STRATEGIES = [
  'SERVER_WINS',
  'CLIENT_WINS',
  'LAST_WRITE_WINS',
  'MANUAL',
  'MERGE',
] as const;

export type ConflictResolutionStrategy = (typeof CONFLICT_RESOLUTION_STRATEGIES)[number];

export interface SyncChangeSet {
  entity: SyncEntityName;
  operation: SyncOperation;
  localId?: string | number;
  cloudId?: string;
  data: Record<string, unknown> & SyncEntityMetadata;
  version: number;
  timestamp: string;
}

export interface SyncPushRequest {
  tenantId: string;
  deviceId: string;
  lastSyncedAt?: string;
  changes: SyncChangeSet[];
}

export interface SyncPushAccepted {
  entity: SyncEntityName;
  localId?: string | number;
  cloudId: string;
  syncedAt: string;
}

export interface SyncPushRejected {
  entity: SyncEntityName;
  localId?: string | number;
  cloudId?: string;
  reason: string;
}

export interface SyncConflict {
  id: string;
  entity: SyncEntityName;
  cloudId: string;
  localId?: string | number;
  strategy: ConflictResolutionStrategy;
  serverVersion: number;
  clientVersion: number;
  serverData: Record<string, unknown>;
  clientData: Record<string, unknown>;
  serverTimestamp?: string;
  clientTimestamp?: string;
  resolved: boolean;
}

export interface SyncPushResponse {
  success: boolean;
  conflicts: SyncConflict[];
  accepted: SyncPushAccepted[];
  rejected: SyncPushRejected[];
  syncedAt: string;
}

export interface SyncPullRequest {
  tenantId: string;
  deviceId: string;
  lastSyncedAt?: string;
  entities?: SyncEntityName[];
  cursor?: string;
  limit?: number;
}

export interface SyncPullDeletion {
  entity: SyncEntityName;
  cloudId: string;
  deletedAt?: string;
}

export interface SyncPullResponse {
  changes: SyncChangeSet[];
  deletions: SyncPullDeletion[];
  syncedAt: string;
  hasMore: boolean;
  nextCursor?: string;
}

export interface ResolveConflictRequest {
  conflictId: string;
  strategy: ConflictResolutionStrategy;
  mergedData?: Record<string, unknown>;
}

export interface ResolveConflictResponse {
  success: boolean;
  conflictId: string;
  syncedAt: string;
}

export interface SyncStatusResponse {
  online: boolean;
  mode: 'local' | 'cloud' | 'hybrid';
  serverTime: string;
}
