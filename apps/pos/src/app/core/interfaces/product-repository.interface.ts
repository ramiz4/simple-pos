import { BaseRepository, Product } from '@simple-pos/shared/types';

export interface ProductRepository extends BaseRepository<Product> {
  findByCategory(categoryId: number): Promise<Product[]>;
}
