import { describe, expect, it, vi } from 'vitest';
import { CloudSyncClientService } from '../../infrastructure/http/cloud-sync-client.service';
import {
  IndexedDBAccountRepository,
  SQLiteAccountRepository,
} from '../../infrastructure/repositories/account';
import {
  IndexedDBCategoryRepository,
  SQLiteCategoryRepository,
} from '../../infrastructure/repositories/category';
import {
  IndexedDBCodeTableRepository,
  IndexedDBCodeTranslationRepository,
  SQLiteCodeTableRepository,
  SQLiteCodeTranslationRepository,
} from '../../infrastructure/repositories/code-table';
import {
  IndexedDBExtraRepository,
  SQLiteExtraRepository,
} from '../../infrastructure/repositories/extra';
import {
  IndexedDBIngredientRepository,
  SQLiteIngredientRepository,
} from '../../infrastructure/repositories/ingredient';
import {
  IndexedDBOrderItemExtraRepository,
  IndexedDBOrderItemRepository,
  IndexedDBOrderRepository,
  SQLiteOrderItemExtraRepository,
  SQLiteOrderItemRepository,
  SQLiteOrderRepository,
} from '../../infrastructure/repositories/order';
import {
  IndexedDBProductExtraRepository,
  IndexedDBProductIngredientRepository,
  IndexedDBProductRepository,
  SQLiteProductExtraRepository,
  SQLiteProductIngredientRepository,
  SQLiteProductRepository,
} from '../../infrastructure/repositories/product';
import {
  IndexedDBTableRepository,
  SQLiteTableRepository,
} from '../../infrastructure/repositories/table';
import {
  IndexedDBUserRepository,
  SQLiteUserRepository,
} from '../../infrastructure/repositories/user';
import {
  IndexedDBVariantRepository,
  SQLiteVariantRepository,
} from '../../infrastructure/repositories/variant';
import { PlatformService } from '../../infrastructure/services/platform.service';
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

    const platform = {
      isTauri: vi.fn().mockReturnValue(false),
    } as unknown as PlatformService;

    const repo = repoStub();
    const syncMetadataMigrationService = {
      ensure: vi.fn().mockResolvedValue(undefined),
    } as unknown as SyncMetadataMigrationService;

    const service = new SyncEngineService(
      cloudClient,
      syncMode,
      auth,
      platform,
      syncMetadataMigrationService,
      repo as unknown as SQLiteAccountRepository,
      repo as unknown as IndexedDBAccountRepository,
      repo as unknown as SQLiteUserRepository,
      repo as unknown as IndexedDBUserRepository,
      repo as unknown as SQLiteCodeTableRepository,
      repo as unknown as IndexedDBCodeTableRepository,
      repo as unknown as SQLiteCodeTranslationRepository,
      repo as unknown as IndexedDBCodeTranslationRepository,
      repo as unknown as SQLiteCategoryRepository,
      repo as unknown as IndexedDBCategoryRepository,
      repo as unknown as SQLiteExtraRepository,
      repo as unknown as IndexedDBExtraRepository,
      repo as unknown as SQLiteIngredientRepository,
      repo as unknown as IndexedDBIngredientRepository,
      repo as unknown as SQLiteTableRepository,
      repo as unknown as IndexedDBTableRepository,
      repo as unknown as SQLiteProductRepository,
      repo as unknown as IndexedDBProductRepository,
      repo as unknown as SQLiteVariantRepository,
      repo as unknown as IndexedDBVariantRepository,
      repo as unknown as SQLiteProductExtraRepository,
      repo as unknown as IndexedDBProductExtraRepository,
      repo as unknown as SQLiteProductIngredientRepository,
      repo as unknown as IndexedDBProductIngredientRepository,
      repo as unknown as SQLiteOrderRepository,
      repo as unknown as IndexedDBOrderRepository,
      repo as unknown as SQLiteOrderItemRepository,
      repo as unknown as IndexedDBOrderItemRepository,
      repo as unknown as SQLiteOrderItemExtraRepository,
      repo as unknown as IndexedDBOrderItemExtraRepository,
    );

    await service.syncNow();

    expect(service.syncing()).toBe(false);
    expect(service.lastError()).toBeNull();
  });
});
