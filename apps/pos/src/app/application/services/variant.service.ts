import { Injectable } from '@angular/core';
import { Variant } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { IndexedDBVariantRepository } from '../../infrastructure/repositories/indexeddb-variant.repository';
import { SQLiteVariantRepository } from '../../infrastructure/repositories/sqlite-variant.repository';
import { PlatformService } from '../../shared/utilities/platform.service';

@Injectable({
  providedIn: 'root',
})
export class VariantService {
  private repo: BaseRepository<Variant> & {
    findByProduct: (productId: number) => Promise<Variant[]>;
  };

  constructor(
    private platformService: PlatformService,
    private sqliteRepo: SQLiteVariantRepository,
    private indexedDBRepo: IndexedDBVariantRepository,
  ) {
    this.repo = this.platformService.isTauri() ? this.sqliteRepo : this.indexedDBRepo;
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
