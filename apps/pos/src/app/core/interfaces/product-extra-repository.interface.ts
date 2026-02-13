import { BaseRepository, ProductExtra } from '@simple-pos/shared/types';

export interface ProductExtraRepository extends BaseRepository<ProductExtra> {
  findByProduct(productId: number): Promise<ProductExtra[]>;
  deleteByProductAndExtra(productId: number, extraId: number): Promise<void>;
}
