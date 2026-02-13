import { Inject, Injectable } from '@angular/core';
import { Table } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { TABLE_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private repo: BaseRepository<Table>;

  constructor(
    @Inject(TABLE_REPOSITORY)
    repo: BaseRepository<Table>,
  ) {
    this.repo = repo;
  }

  async getAll(): Promise<Table[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Table | null> {
    return this.repo.findById(id);
  }

  async create(table: Omit<Table, 'id'>): Promise<Table> {
    return this.repo.create(table);
  }

  async update(id: number, table: Partial<Table>): Promise<Table> {
    return this.repo.update(id, table);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }

  async updateTableStatus(id: number, statusId: number): Promise<Table> {
    return this.repo.update(id, { statusId });
  }
}
