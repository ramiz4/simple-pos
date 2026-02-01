import { Injectable } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteTableRepository } from '../../infrastructure/repositories/sqlite-table.repository';
import { IndexedDBTableRepository } from '../../infrastructure/repositories/indexeddb-table.repository';
import { Table } from '../../domain/entities/table.interface';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private repo: BaseRepository<Table>;

  constructor(
    private platformService: PlatformService,
    private sqliteRepo: SQLiteTableRepository,
    private indexedDBRepo: IndexedDBTableRepository
  ) {
    this.repo = this.platformService.isTauri() ? this.sqliteRepo : this.indexedDBRepo;
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
