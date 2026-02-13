import { Inject, Injectable } from '@angular/core';
import { ProductIngredient } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { PRODUCT_INGREDIENT_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class ProductIngredientService {
  private repo: BaseRepository<ProductIngredient> & {
    findByProduct: (productId: number) => Promise<ProductIngredient[]>;
    deleteByProductAndIngredient: (productId: number, ingredientId: number) => Promise<void>;
  };

  constructor(
    @Inject(PRODUCT_INGREDIENT_REPOSITORY)
    repo: BaseRepository<ProductIngredient>,
  ) {
    this.repo = repo as BaseRepository<ProductIngredient> & {
      findByProduct: (productId: number) => Promise<ProductIngredient[]>;
      deleteByProductAndIngredient: (productId: number, ingredientId: number) => Promise<void>;
    };
  }

  async getByProduct(productId: number): Promise<ProductIngredient[]> {
    return this.repo.findByProduct(productId);
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
