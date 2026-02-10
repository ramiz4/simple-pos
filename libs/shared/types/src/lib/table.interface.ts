import { SyncEntityMetadata } from './sync-metadata.interface';

export interface Table extends SyncEntityMetadata {
  id: number;
  name: string;
  number: number;
  seats: number;
  statusId: number;
}
