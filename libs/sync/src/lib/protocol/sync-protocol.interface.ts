import { SyncEntityMetadata } from '@simple-pos/shared/types';

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
  metadata: SyncEntityMetadata;
}

export interface SyncConflict {
  entityType: string;
  entityId: number | string;
  clientVersion: EntityChange;
  serverVersion: EntityChange;
  resolution: ConflictResolution;
}

export type ConflictResolution = 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL';
