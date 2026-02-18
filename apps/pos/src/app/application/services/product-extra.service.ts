import { Inject, Injectable } from '@angular/core';
import { ProductExtra } from '@simple-pos/shared/types';
import { ProductExtraRepository } from '../../core/interfaces/product-extra-repository.interface';
import { PRODUCT_EXTRA_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class ProductExtraService {
  private repo: ProductExtraRepository;

  constructor(
    @Inject(PRODUCT_EXTRA_REPOSITORY)
    repo: ProductExtraRepository,
  ) {
    this.repo = repo;
  }

  async getByProduct(productId: number): Promise<ProductExtra[]> {
    return this.repo.findByProduct(productId);
  }

  async getAll(): Promise<ProductExtra[]> {
    return this.repo.findAll();
  }

  async addExtraToProduct(productId: number, extraId: number): Promise<ProductExtra> {
    return this.repo.create({ productId, extraId });
  }

  async removeExtraFromProduct(productId: number, extraId: number): Promise<void> {
    return this.repo.deleteByProductAndExtra(productId, extraId);
  }
}
