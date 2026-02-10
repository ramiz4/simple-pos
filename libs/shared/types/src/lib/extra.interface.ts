import { SyncEntityMetadata } from './sync-metadata.interface';

export interface Extra extends SyncEntityMetadata {
  id: number;
  name: string;
  price: number;
}
