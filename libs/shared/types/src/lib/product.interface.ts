import { SyncEntityMetadata } from './sync-metadata.interface';

export interface Product extends SyncEntityMetadata {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  stock: number;
  isAvailable: boolean;
}
