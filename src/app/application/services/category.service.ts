import { Injectable } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteCategoryRepository } from '../../infrastructure/repositories/sqlite-category.repository';
import { IndexedDBCategoryRepository } from '../../infrastructure/repositories/indexeddb-category.repository';
import { Category } from '../../domain/entities/category.interface';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private repo: BaseRepository<Category>;

  constructor(
    private platformService: PlatformService,
    private sqliteRepo: SQLiteCategoryRepository,
    private indexedDBRepo: IndexedDBCategoryRepository
  ) {
    this.repo = this.platformService.isTauri() ? this.sqliteRepo : this.indexedDBRepo;
  }

  async getAll(): Promise<Category[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Category | null> {
    return this.repo.findById(id);
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    return this.repo.create(category);
  }

  async update(id: number, category: Partial<Category>): Promise<Category> {
    return this.repo.update(id, category);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}
