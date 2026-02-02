import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndexedDBCodeTableRepository } from '../../infrastructure/repositories/indexeddb-code-table.repository';
import { SQLiteCodeTableRepository } from '../../infrastructure/repositories/sqlite-code-table.repository';
import { PlatformService } from '../../shared/utilities/platform.service';
import { BackupService } from './backup.service';

// Mock other repositories as needed...
// For brevity, we'll mock the repositories used in the service

describe('BackupService', () => {
  let service: BackupService;
  let platformService: any;
  let sqliteRepo: any;
  let indexedDBRepo: any;

  beforeEach(() => {
    const platformMock = {
      isTauri: vi.fn().mockReturnValue(false),
      isWeb: vi.fn().mockReturnValue(true),
    };

    const repoMock = {
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(undefined),
    };

    // Mock Web Crypto API
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (arr: any) => arr,
        subtle: {
          importKey: vi.fn().mockResolvedValue({} as any),
          deriveKey: vi.fn().mockResolvedValue({} as any),
          // Encrypt returns ArrayBuffer
          encrypt: vi.fn().mockResolvedValue(new TextEncoder().encode('encrypted-content').buffer),
          // Decrypt returns ArrayBuffer
          decrypt: vi.fn().mockImplementation(() => {
            const mockData = {
              codeTables: [{ id: 1, name: 'Restored CodeTable' }],
              codeTranslations: [],
              users: [],
              tables: [],
              categories: [],
              products: [],
              variants: [],
              extras: [],
              ingredients: [],
              productExtras: [],
              productIngredients: [],
              orders: [],
              orderItems: [],
              orderItemExtras: [],
            };
            return Promise.resolve(new TextEncoder().encode(JSON.stringify(mockData)).buffer);
          }),
        },
      },
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        BackupService,
        { provide: PlatformService, useValue: platformMock },
        // Providing mocks for all required repositories
        { provide: SQLiteCodeTableRepository, useValue: repoMock },
        { provide: IndexedDBCodeTableRepository, useValue: repoMock },
        { provide: SQLiteCodeTranslationRepository, useValue: repoMock },
        { provide: IndexedDBCodeTranslationRepository, useValue: repoMock },
        { provide: SQLiteUserRepository, useValue: repoMock },
        { provide: IndexedDBUserRepository, useValue: repoMock },
        { provide: SQLiteTableRepository, useValue: repoMock },
        { provide: IndexedDBTableRepository, useValue: repoMock },
        { provide: SQLiteCategoryRepository, useValue: repoMock },
        { provide: IndexedDBCategoryRepository, useValue: repoMock },
        { provide: SQLiteProductRepository, useValue: repoMock },
        { provide: IndexedDBProductRepository, useValue: repoMock },
        { provide: SQLiteVariantRepository, useValue: repoMock },
        { provide: IndexedDBVariantRepository, useValue: repoMock },
        { provide: SQLiteExtraRepository, useValue: repoMock },
        { provide: IndexedDBExtraRepository, useValue: repoMock },
        { provide: SQLiteIngredientRepository, useValue: repoMock },
        { provide: IndexedDBIngredientRepository, useValue: repoMock },
        { provide: SQLiteProductExtraRepository, useValue: repoMock },
        { provide: IndexedDBProductExtraRepository, useValue: repoMock },
        { provide: SQLiteProductIngredientRepository, useValue: repoMock },
        { provide: IndexedDBProductIngredientRepository, useValue: repoMock },
        { provide: SQLiteOrderRepository, useValue: repoMock },
        { provide: IndexedDBOrderRepository, useValue: repoMock },
        { provide: SQLiteOrderItemRepository, useValue: repoMock },
        { provide: IndexedDBOrderItemRepository, useValue: repoMock },
        { provide: SQLiteOrderItemExtraRepository, useValue: repoMock },
        { provide: IndexedDBOrderItemExtraRepository, useValue: repoMock },
      ],
    });

    service = TestBed.inject(BackupService);
    platformService = TestBed.inject(PlatformService);
    // Grab a handle to one of the repos for verification
    indexedDBRepo = TestBed.inject(IndexedDBCodeTableRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a valid unencrypted backup', async () => {
    // Mock data return
    indexedDBRepo.findAll.mockResolvedValue([{ id: 1, name: 'Test' }]);

    const backup = await service.createBackup({ encrypt: false });

    expect(backup.version).toBeDefined();
    expect(backup.encrypted).toBe(false);
    expect(backup.data.codeTables.length).toBe(1);
    expect(service.validateBackup(backup).valid).toBe(true);
  });

  it('should encrypt backup when password provided', async () => {
    const password = 'secure-password';
    const backup = await service.createBackup({ encrypt: true, password });

    expect(backup.encrypted).toBe(true);
    expect(typeof backup.data).toBe('string');
  });

  it('should decrypt and restore backup', async () => {
    const password = 'secure-password';

    // Create backup first
    const originalBackup = await service.createBackup({ encrypt: true, password });

    // Attempt restore
    const result = await service.restoreBackup(originalBackup, password);

    expect(result.success).toBe(true);
    expect(indexedDBRepo.create).toHaveBeenCalled();
  });

  it('should fail restore with incorrect password', async () => {
    const password = 'secure-password';
    const wrongPassword = 'wrong-password';

    // Mock failure for this specific test
    const cryptoMock = (globalThis as any).crypto.subtle;
    cryptoMock.decrypt.mockRejectedValueOnce(new Error('Decryption failed'));

    const originalBackup = await service.createBackup({ encrypt: true, password });

    const result = await service.restoreBackup(originalBackup, wrongPassword);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to restore backup');
  });
});

// Import the missing classes to satisfy TestBed
import { IndexedDBCategoryRepository } from '../../infrastructure/repositories/indexeddb-category.repository';
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
import { SQLiteCategoryRepository } from '../../infrastructure/repositories/sqlite-category.repository';
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
