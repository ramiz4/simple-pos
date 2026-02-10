import { SyncEntityMetadata } from './sync-metadata.interface';

export interface Ingredient extends SyncEntityMetadata {
  id: number;
  name: string;
  stockQuantity: number;
  unit: string;
}
