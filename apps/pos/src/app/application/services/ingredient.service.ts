import { Inject, Injectable } from '@angular/core';
import { Ingredient } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { INGREDIENT_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private repo: BaseRepository<Ingredient>;

  constructor(
    @Inject(INGREDIENT_REPOSITORY)
    repo: BaseRepository<Ingredient>,
  ) {
    this.repo = repo;
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
