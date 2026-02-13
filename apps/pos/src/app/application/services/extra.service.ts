import { Inject, Injectable } from '@angular/core';
import { BaseRepository, Extra } from '@simple-pos/shared/types';
import { EXTRA_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class ExtraService {
  private repo: BaseRepository<Extra>;

  constructor(
    @Inject(EXTRA_REPOSITORY)
    repo: BaseRepository<Extra>,
  ) {
    this.repo = repo;
  }

  async getAll(): Promise<Extra[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Extra | null> {
    return this.repo.findById(id);
  }

  async create(extra: Omit<Extra, 'id'>): Promise<Extra> {
    return this.repo.create(extra);
  }

  async update(id: number, extra: Partial<Extra>): Promise<Extra> {
    return this.repo.update(id, extra);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}
