import { Inject, Injectable } from '@angular/core';
import { ProductExtra } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { PRODUCT_EXTRA_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class ProductExtraService {
  private repo: BaseRepository<ProductExtra> & {
    findByProduct: (productId: number) => Promise<ProductExtra[]>;
    deleteByProductAndExtra: (productId: number, extraId: number) => Promise<void>;
  };

  constructor(
    @Inject(PRODUCT_EXTRA_REPOSITORY)
    repo: BaseRepository<ProductExtra>,
  ) {
    this.repo = repo as BaseRepository<ProductExtra> & {
      findByProduct: (productId: number) => Promise<ProductExtra[]>;
      deleteByProductAndExtra: (productId: number, extraId: number) => Promise<void>;
    };
  }

  async getByProduct(productId: number): Promise<ProductExtra[]> {
    return this.repo.findByProduct(productId);
  }

  async addExtraToProduct(productId: number, extraId: number): Promise<ProductExtra> {
    return this.repo.create({ productId, extraId });
  }

  async removeExtraFromProduct(productId: number, extraId: number): Promise<void> {
    return this.repo.deleteByProductAndExtra(productId, extraId);
  }
}
