import { Injectable } from '@angular/core';
import { TestEntity } from '@simple-pos/shared/types';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { PlatformService } from '../../shared/utilities/platform.service';
import { IndexedDBTestRepository } from '../repositories/indexeddb-test.repository';
import { SQLiteTestRepository } from '../repositories/sqlite-test.repository';

/**
 * Repository factory that provides the appropriate repository implementation
 * based on the current platform (Tauri desktop or web/PWA)
 */
@Injectable({
  providedIn: 'root',
})
export class RepositoryFactory {
  constructor(
    private platformService: PlatformService,
    private sqliteRepository: SQLiteTestRepository,
    private indexedDBRepository: IndexedDBTestRepository,
  ) {}

  /**
   * Get the appropriate TestEntity repository for the current platform
   */
  getTestRepository(): BaseRepository<TestEntity> {
    return this.platformService.isTauri() ? this.sqliteRepository : this.indexedDBRepository;
  }
}
