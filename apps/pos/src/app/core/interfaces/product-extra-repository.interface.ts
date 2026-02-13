import { ProductExtra } from '@simple-pos/shared/types';
import { BaseRepository } from './base-repository.interface';

export interface ProductExtraRepository extends BaseRepository<ProductExtra> {
  findByProduct(productId: number): Promise<ProductExtra[]>;
  deleteByProductAndExtra(productId: number, extraId: number): Promise<void>;
}
