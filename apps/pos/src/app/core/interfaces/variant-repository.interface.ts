import { Variant } from '@simple-pos/shared/types';
import { BaseRepository } from './base-repository.interface';

export interface VariantRepository extends BaseRepository<Variant> {
  findByProduct(productId: number): Promise<Variant[]>;
}
