import { Product } from '@simple-pos/shared/types';
import { BaseRepository } from './base-repository.interface';

export interface ProductRepository extends BaseRepository<Product> {
  findByCategory(categoryId: number): Promise<Product[]>;
}
