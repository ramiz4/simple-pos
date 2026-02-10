import { SyncEntityMetadata } from './sync-metadata.interface';

export interface Account extends SyncEntityMetadata {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}
