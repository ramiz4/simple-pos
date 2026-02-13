import { describe, expect, it, vi } from 'vitest';
import { CloudSyncClientService } from '../../infrastructure/http/cloud-sync-client.service';
import { IndexedDBAccountRepository } from '../../infrastructure/repositories/indexeddb-account.repository';
import { IndexedDBCategoryRepository } from '../../infrastructure/repositories/indexeddb-category.repository';
import { IndexedDBCodeTableRepository } from '../../infrastructure/repositories/indexeddb-code-table.repository';
import { IndexedDBCodeTranslationRepository } from '../../infrastructure/repositories/indexeddb-code-translation.repository';
import { IndexedDBExtraRepository } from '../../infrastructure/repositories/indexeddb-extra.repository';
import { IndexedDBIngredientRepository } from '../../infrastructure/repositories/indexeddb-ingredient.repository';
import { IndexedDBOrderItemExtraRepository } from '../../infrastructure/repositories/indexeddb-order-item-extra.repository';
import { IndexedDBOrderItemRepository } from '../../infrastructure/repositories/indexeddb-order-item.repository';
import { IndexedDBOrderRepository } from '../../infrastructure/repositories/indexeddb-order.repository';
import { IndexedDBProductExtraRepository } from '../../infrastructure/repositories/indexeddb-product-extra.repository';
import { IndexedDBProductIngredientRepository } from '../../infrastructure/repositories/indexeddb-product-ingredient.repository';
import { IndexedDBProductRepository } from '../../infrastructure/repositories/indexeddb-product.repository';
import { IndexedDBTableRepository } from '../../infrastructure/repositories/indexeddb-table.repository';
import { IndexedDBUserRepository } from '../../infrastructure/repositories/indexeddb-user.repository';
import { IndexedDBVariantRepository } from '../../infrastructure/repositories/indexeddb-variant.repository';
import { SQLiteAccountRepository } from '../../infrastructure/repositories/sqlite-account.repository';
import { SQLiteCategoryRepository } from '../../infrastructure/repositories/sqlite-category.repository';
import { SQLiteCodeTableRepository } from '../../infrastructure/repositories/sqlite-code-table.repository';
import { SQLiteCodeTranslationRepository } from '../../infrastructure/repositories/sqlite-code-translation.repository';
import { SQLiteExtraRepository } from '../../infrastructure/repositories/sqlite-extra.repository';
import { SQLiteIngredientRepository } from '../../infrastructure/repositories/sqlite-ingredient.repository';
import { SQLiteOrderItemExtraRepository } from '../../infrastructure/repositories/sqlite-order-item-extra.repository';
import { SQLiteOrderItemRepository } from '../../infrastructure/repositories/sqlite-order-item.repository';
import { SQLiteOrderRepository } from '../../infrastructure/repositories/sqlite-order.repository';
import { SQLiteProductExtraRepository } from '../../infrastructure/repositories/sqlite-product-extra.repository';
import { SQLiteProductIngredientRepository } from '../../infrastructure/repositories/sqlite-product-ingredient.repository';
import { SQLiteProductRepository } from '../../infrastructure/repositories/sqlite-product.repository';
import { SQLiteTableRepository } from '../../infrastructure/repositories/sqlite-table.repository';
import { SQLiteUserRepository } from '../../infrastructure/repositories/sqlite-user.repository';
import { SQLiteVariantRepository } from '../../infrastructure/repositories/sqlite-variant.repository';
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
