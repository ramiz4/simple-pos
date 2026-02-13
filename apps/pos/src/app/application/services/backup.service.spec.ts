import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  CATEGORY_REPOSITORY,
  CODE_TABLE_REPOSITORY,
  CODE_TRANSLATION_REPOSITORY,
  EXTRA_REPOSITORY,
  INGREDIENT_REPOSITORY,
  ORDER_ITEM_EXTRA_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_EXTRA_REPOSITORY,
  PRODUCT_INGREDIENT_REPOSITORY,
  PRODUCT_REPOSITORY,
  TABLE_REPOSITORY,
  USER_REPOSITORY,
  VARIANT_REPOSITORY,
} from '../../infrastructure/tokens/repository.tokens';
import { BackupService, type BackupDataInner } from './backup.service';

describe('BackupService', () => {
  let service: BackupService;
  let mockCodeTableRepo: {
    findAll: Mock;
    create: Mock;
  };

  beforeEach(() => {
    const repoMock = {
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(undefined),
    };

    // Mock Web Crypto API
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (arr: Uint8Array) => arr,
        subtle: {
          importKey: vi.fn().mockResolvedValue({} as CryptoKey),
          deriveKey: vi.fn().mockResolvedValue({} as CryptoKey),
          // Encrypt returns ArrayBuffer
          encrypt: vi.fn().mockResolvedValue(new TextEncoder().encode('encrypted-content').buffer),
          // Decrypt returns ArrayBuffer
          decrypt: vi.fn().mockImplementation(() => {
            const mockData = {
              codeTables: [{ id: 1, codeType: 'test', code: 'test', sortOrder: 1, isActive: true }],
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
        { provide: CODE_TABLE_REPOSITORY, useValue: repoMock },
        { provide: CODE_TRANSLATION_REPOSITORY, useValue: repoMock },
        { provide: USER_REPOSITORY, useValue: repoMock },
        { provide: TABLE_REPOSITORY, useValue: repoMock },
        { provide: CATEGORY_REPOSITORY, useValue: repoMock },
        { provide: PRODUCT_REPOSITORY, useValue: repoMock },
        { provide: VARIANT_REPOSITORY, useValue: repoMock },
        { provide: EXTRA_REPOSITORY, useValue: repoMock },
        { provide: INGREDIENT_REPOSITORY, useValue: repoMock },
        { provide: PRODUCT_EXTRA_REPOSITORY, useValue: repoMock },
        { provide: PRODUCT_INGREDIENT_REPOSITORY, useValue: repoMock },
        { provide: ORDER_REPOSITORY, useValue: repoMock },
        { provide: ORDER_ITEM_REPOSITORY, useValue: repoMock },
        { provide: ORDER_ITEM_EXTRA_REPOSITORY, useValue: repoMock },
      ],
    });

    service = TestBed.inject(BackupService);
    // Grab a handle to one of the repos for verification
    mockCodeTableRepo = TestBed.inject(
      CODE_TABLE_REPOSITORY,
    ) as unknown as typeof mockCodeTableRepo;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a valid unencrypted backup', async () => {
    // Mock data return
    mockCodeTableRepo.findAll.mockResolvedValue([
      { id: 1, codeType: 'test', code: 'test', sortOrder: 1, isActive: true },
    ]);

    const backup = await service.createBackup({ encrypt: false });

    expect(backup.version).toBeDefined();
    expect(backup.encrypted).toBe(false);
    expect((backup.data as BackupDataInner).codeTables.length).toBe(1);
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
    expect(mockCodeTableRepo.create).toHaveBeenCalled();
  });

  it('should fail restore with incorrect password', async () => {
    const password = 'secure-password';
    const wrongPassword = 'wrong-password';

    // Mock failure for this specific test
    const cryptoMock = globalThis.crypto.subtle as unknown as { decrypt: Mock };
    cryptoMock.decrypt.mockRejectedValueOnce(new Error('Decryption failed'));

    const originalBackup = await service.createBackup({ encrypt: true, password });

    const result = await service.restoreBackup(originalBackup, wrongPassword);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to restore backup');
  });
});
