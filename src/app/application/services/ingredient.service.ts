import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Ingredient } from '../../domain/entities/ingredient.interface';
import { IndexedDBIngredientRepository } from '../../infrastructure/repositories/indexeddb-ingredient.repository';
import { SQLiteIngredientRepository } from '../../infrastructure/repositories/sqlite-ingredient.repository';
import { PlatformService } from '../../shared/utilities/platform.service';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private repo: BaseRepository<Ingredient>;

  constructor(
    private platformService: PlatformService,
    private sqliteRepo: SQLiteIngredientRepository,
    private indexedDBRepo: IndexedDBIngredientRepository,
  ) {
    this.repo = this.platformService.isTauri() ? this.sqliteRepo : this.indexedDBRepo;
  }

  async getAll(): Promise<Ingredient[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Ingredient | null> {
    return this.repo.findById(id);
  }

  async create(ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient> {
    return this.repo.create(ingredient);
  }

  async update(id: number, ingredient: Partial<Ingredient>): Promise<Ingredient> {
    return this.repo.update(id, ingredient);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}
