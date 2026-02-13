import { Inject, Injectable } from '@angular/core';
import { BaseRepository, Category } from '@simple-pos/shared/types';
import { CATEGORY_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private repo: BaseRepository<Category>;

  constructor(
    @Inject(CATEGORY_REPOSITORY)
    repo: BaseRepository<Category>,
  ) {
    this.repo = repo;
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
