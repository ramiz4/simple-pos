import { BaseRepository, Variant } from '@simple-pos/shared/types';

export interface VariantRepository extends BaseRepository<Variant> {
  findByProduct(productId: number): Promise<Variant[]>;
}
