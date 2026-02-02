import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { ProductExtra } from '../../domain/entities/product-extra.interface';
import { IndexedDBProductExtraRepository } from '../../infrastructure/repositories/indexeddb-product-extra.repository';
import { SQLiteProductExtraRepository } from '../../infrastructure/repositories/sqlite-product-extra.repository';
import { PlatformService } from '../../shared/utilities/platform.service';

@Injectable({
  providedIn: 'root',
})
export class ProductExtraService {
  private repo: BaseRepository<ProductExtra> & {
    findByProduct: (productId: number) => Promise<ProductExtra[]>;
    deleteByProductAndExtra: (productId: number, extraId: number) => Promise<void>;
  };

  constructor(
    private platformService: PlatformService,
    private sqliteRepo: SQLiteProductExtraRepository,
    private indexedDBRepo: IndexedDBProductExtraRepository,
  ) {
    this.repo = this.platformService.isTauri() ? this.sqliteRepo : this.indexedDBRepo;
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
