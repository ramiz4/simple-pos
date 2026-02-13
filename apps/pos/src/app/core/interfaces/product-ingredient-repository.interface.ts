import { BaseRepository, ProductIngredient } from '@simple-pos/shared/types';

export interface ProductIngredientRepository extends BaseRepository<ProductIngredient> {
  findByProduct(productId: number): Promise<ProductIngredient[]>;
  deleteByProductAndIngredient(productId: number, ingredientId: number): Promise<void>;
}
