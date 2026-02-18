import { describe, expect, it, vi } from 'vitest';
import { CloudSyncClientService } from '../../infrastructure/http/cloud-sync-client.service';
import { SQLiteAccountRepository } from '../../infrastructure/repositories/account';
import { SQLiteCategoryRepository } from '../../infrastructure/repositories/category';
import {
  SQLiteCodeTableRepository,
  SQLiteCodeTranslationRepository,
} from '../../infrastructure/repositories/code-table';
import { SQLiteExtraRepository } from '../../infrastructure/repositories/extra';
import { SQLiteIngredientRepository } from '../../infrastructure/repositories/ingredient';
import {
  SQLiteOrderItemExtraRepository,
  SQLiteOrderItemRepository,
  SQLiteOrderRepository,
} from '../../infrastructure/repositories/order';
import {
  SQLiteProductExtraRepository,
  SQLiteProductIngredientRepository,
  SQLiteProductRepository,
} from '../../infrastructure/repositories/product';
import { SQLiteTableRepository } from '../../infrastructure/repositories/table';
import { SQLiteUserRepository } from '../../infrastructure/repositories/user';
import { SQLiteVariantRepository } from '../../infrastructure/repositories/variant';
import { SyncMetadataMigrationService } from '../../infrastructure/services/sync-metadata-migration.service';
import { AuthService } from './auth.service';
import { SyncEngineService } from './sync-engine.service';
import { SyncModeService } from './sync-mode.service';

function repoStub() {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('SyncEngineService', () => {
  it('should skip sync when mode is local', async () => {
    const cloudClient = {
      push: vi.fn(),
      pull: vi.fn(),
      listConflicts: vi.fn(),
      resolveConflict: vi.fn(),
    } as unknown as CloudSyncClientService;

    const syncMode = {
      mode: vi.fn().mockReturnValue('local'),
      start: vi.fn().mockResolvedValue(undefined),
    } as unknown as SyncModeService;

    const auth = {
      getCloudTenantId: vi.fn().mockReturnValue(null),
      hasCloudSession: vi.fn().mockReturnValue(false),
    } as unknown as AuthService;

    const repo = repoStub();
    const syncMetadataMigrationService = {
      ensure: vi.fn().mockResolvedValue(undefined),
    } as unknown as SyncMetadataMigrationService;

    const service = new SyncEngineService(
      cloudClient,
      syncMode,
      auth,
      syncMetadataMigrationService,
      repo as unknown as SQLiteAccountRepository,
      repo as unknown as SQLiteUserRepository,
      repo as unknown as SQLiteCodeTableRepository,
      repo as unknown as SQLiteCodeTranslationRepository,
      repo as unknown as SQLiteCategoryRepository,
      repo as unknown as SQLiteExtraRepository,
      repo as unknown as SQLiteIngredientRepository,
      repo as unknown as SQLiteTableRepository,
      repo as unknown as SQLiteProductRepository,
      repo as unknown as SQLiteVariantRepository,
      repo as unknown as SQLiteProductExtraRepository,
      repo as unknown as SQLiteProductIngredientRepository,
      repo as unknown as SQLiteOrderRepository,
      repo as unknown as SQLiteOrderItemRepository,
      repo as unknown as SQLiteOrderItemExtraRepository,
    );

    await service.syncNow();

    expect(service.syncing()).toBe(false);
    expect(service.lastError()).toBeNull();
  });
});
