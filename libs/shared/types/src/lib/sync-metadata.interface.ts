export interface SyncEntityMetadata {
  cloudId?: string;
  version?: number;
  isDirty?: boolean;
  isDeleted?: boolean;
  syncedAt?: string;
  lastModifiedAt?: string;
  deletedAt?: string;
  tenantId?: string;
}
