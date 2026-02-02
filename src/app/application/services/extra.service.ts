import { Injectable } from '@angular/core';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { Extra } from '../../domain/entities/extra.interface';
import { IndexedDBExtraRepository } from '../../infrastructure/repositories/indexeddb-extra.repository';
import { SQLiteExtraRepository } from '../../infrastructure/repositories/sqlite-extra.repository';
import { PlatformService } from '../../shared/utilities/platform.service';

@Injectable({
  providedIn: 'root',
})
export class ExtraService {
  private repo: BaseRepository<Extra>;

  constructor(
    private platformService: PlatformService,
    private sqliteRepo: SQLiteExtraRepository,
    private indexedDBRepo: IndexedDBExtraRepository,
  ) {
    this.repo = this.platformService.isTauri() ? this.sqliteRepo : this.indexedDBRepo;
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
