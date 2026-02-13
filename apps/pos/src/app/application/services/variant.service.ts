import { Inject, Injectable } from '@angular/core';
import { Variant } from '@simple-pos/shared/types';
import { VariantRepository } from '../../core/interfaces/variant-repository.interface';
import { VARIANT_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class VariantService {
  private repo: VariantRepository;

  constructor(
    @Inject(VARIANT_REPOSITORY)
    repo: VariantRepository,
  ) {
    this.repo = repo;
  }

  async getAll(): Promise<Variant[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Variant | null> {
    return this.repo.findById(id);
  }

  async getByProduct(productId: number): Promise<Variant[]> {
    return this.repo.findByProduct(productId);
  }

  async create(variant: Omit<Variant, 'id'>): Promise<Variant> {
    return this.repo.create(variant);
  }

  async update(id: number, variant: Partial<Variant>): Promise<Variant> {
    return this.repo.update(id, variant);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}
