import { SyncEntityMetadata } from './sync-metadata.interface';

export interface Category extends SyncEntityMetadata {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}
