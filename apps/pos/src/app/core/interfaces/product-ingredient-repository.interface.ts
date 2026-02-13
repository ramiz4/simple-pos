import { ProductIngredient } from '@simple-pos/shared/types';
import { BaseRepository } from './base-repository.interface';

export interface ProductIngredientRepository extends BaseRepository<ProductIngredient> {
  findByProduct(productId: number): Promise<ProductIngredient[]>;
  deleteByProductAndIngredient(productId: number, ingredientId: number): Promise<void>;
}
