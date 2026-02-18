import { Inject, Injectable } from '@angular/core';
import { ProductIngredient } from '@simple-pos/shared/types';
import { ProductIngredientRepository } from '../../core/interfaces/product-ingredient-repository.interface';
import { PRODUCT_INGREDIENT_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class ProductIngredientService {
  private repo: ProductIngredientRepository;

  constructor(
    @Inject(PRODUCT_INGREDIENT_REPOSITORY)
    repo: ProductIngredientRepository,
  ) {
    this.repo = repo;
  }

  async getByProduct(productId: number): Promise<ProductIngredient[]> {
    return this.repo.findByProduct(productId);
  }

  async getAll(): Promise<ProductIngredient[]> {
    return this.repo.findAll();
  }

  async addIngredientToProduct(
    productId: number,
    ingredientId: number,
    quantity: number,
  ): Promise<ProductIngredient> {
    return this.repo.create({ productId, ingredientId, quantity });
  }

  async updateIngredientQuantity(id: number, quantity: number): Promise<ProductIngredient> {
    return this.repo.update(id, { quantity });
  }

  async removeIngredientFromProduct(productId: number, ingredientId: number): Promise<void> {
    return this.repo.deleteByProductAndIngredient(productId, ingredientId);
  }
}
