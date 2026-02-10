import { SyncEntityMetadata } from './sync-metadata.interface';

export interface Variant extends SyncEntityMetadata {
  id: number;
  productId: number;
  name: string;
  priceModifier: number;
}
