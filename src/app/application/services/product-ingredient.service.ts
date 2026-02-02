import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { ProductIngredient } from '../../domain/entities/product-ingredient.interface';
import { IndexedDBProductIngredientRepository } from '../../infrastructure/repositories/indexeddb-product-ingredient.repository';
import { SQLiteProductIngredientRepository } from '../../infrastructure/repositories/sqlite-product-ingredient.repository';
import { PlatformService } from '../../shared/utilities/platform.service';

@Injectable({
  providedIn: 'root',
})
export class ProductIngredientService {
  private repo: BaseRepository<ProductIngredient> & {
    findByProduct: (productId: number) => Promise<ProductIngredient[]>;
    deleteByProductAndIngredient: (productId: number, ingredientId: number) => Promise<void>;
  };

  constructor(
    private platformService: PlatformService,
    private sqliteRepo: SQLiteProductIngredientRepository,
    private indexedDBRepo: IndexedDBProductIngredientRepository,
  ) {
    this.repo = this.platformService.isTauri() ? this.sqliteRepo : this.indexedDBRepo;
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
