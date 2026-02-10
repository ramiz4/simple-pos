import { SyncEntityMetadata } from './sync-metadata.interface';

export interface ProductIngredient extends SyncEntityMetadata {
  id: number;
  productId: number;
  ingredientId: number;
  quantity: number;
}
