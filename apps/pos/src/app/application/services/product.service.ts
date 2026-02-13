import { Inject, Injectable } from '@angular/core';
import { Product } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { PRODUCT_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private repo: BaseRepository<Product> & {
    findByCategory: (categoryId: number) => Promise<Product[]>;
  };

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    repo: BaseRepository<Product>,
  ) {
    this.repo = repo as BaseRepository<Product> & {
      findByCategory: (categoryId: number) => Promise<Product[]>;
    };
  }

  async getAll(): Promise<Product[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Product | null> {
    return this.repo.findById(id);
  }

  async getByCategory(categoryId: number): Promise<Product[]> {
    return this.repo.findByCategory(categoryId);
  }

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    return this.repo.create(product);
  }

  async update(id: number, product: Partial<Product>): Promise<Product> {
    return this.repo.update(id, product);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }

  async toggleAvailability(id: number): Promise<Product> {
    const product = await this.getById(id);
    if (!product) throw new Error(`Product with id ${id} not found`);
    return this.update(id, { isAvailable: !product.isAvailable });
  }
}
