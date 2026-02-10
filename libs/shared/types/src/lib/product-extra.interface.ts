import { SyncEntityMetadata } from './sync-metadata.interface';

export interface ProductExtra extends SyncEntityMetadata {
  id: number;
  productId: number;
  extraId: number;
}
