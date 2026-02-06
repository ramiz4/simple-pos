import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Account } from '../../domain/entities/account.interface';
import { IndexedDBAccountRepository } from '../../infrastructure/repositories/indexeddb-account.repository';
import { SQLiteAccountRepository } from '../../infrastructure/repositories/sqlite-account.repository';
import { PlatformService } from '../../shared/utilities/platform.service';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let mockPlatformService: any;
  let mockSqliteAccountRepo: any;
  let mockIndexedDBAccountRepo: any;

  const mockAccount: Account = {
    id: 1,
    name: 'Test Account',
    email: 'test@example.com',
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const mockAccount2: Account = {
    id: 2,
    name: 'Second Account',
    email: 'second@example.com',
    active: true,
    createdAt: '2024-01-02T00:00:00.000Z',
  };

  beforeEach(() => {
    // Mock PlatformService
    mockPlatformService = {
      isTauri: vi.fn().mockReturnValue(false),
      isWeb: vi.fn().mockReturnValue(true),
    };

    // Mock SQLite Account Repository
    mockSqliteAccountRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };

    // Mock IndexedDB Account Repository
    mockIndexedDBAccountRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        AccountService,
        { provide: PlatformService, useValue: mockPlatformService },
        { provide: SQLiteAccountRepository, useValue: mockSqliteAccountRepo },
        { provide: IndexedDBAccountRepository, useValue: mockIndexedDBAccountRepo },
      ],
    });

    service = TestBed.inject(AccountService);
  });

  describe('Platform Selection', () => {
    it('should use IndexedDB repository on web platform', async () => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBAccountRepo.findById.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1);

      expect(mockIndexedDBAccountRepo.findById).toHaveBeenCalledWith(1);
      expect(mockSqliteAccountRepo.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockAccount);
    });

    it('should use SQLite repository on Tauri platform', async () => {
      mockPlatformService.isTauri.mockReturnValue(true);
      mockSqliteAccountRepo.findById.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1);

      expect(mockSqliteAccountRepo.findById).toHaveBeenCalledWith(1);
      expect(mockIndexedDBAccountRepo.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockAccount);
    });
  });

  describe('createAccount', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should create a new account successfully', async () => {
      const name = 'New Account';
      const email = 'new@example.com';
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(null);
      mockIndexedDBAccountRepo.create.mockResolvedValue({
        ...mockAccount,
        name,
        email,
      });

      const result = await service.createAccount(name, email);

      expect(mockIndexedDBAccountRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(mockIndexedDBAccountRepo.create).toHaveBeenCalledWith({
        name,
        email,
        active: true,
        createdAt: expect.any(String),
      });
      expect(result).toEqual({
        ...mockAccount,
        name,
        email,
      });
    });

    it('should throw error if account with email already exists', async () => {
      const name = 'New Account';
      const email = 'existing@example.com';
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(mockAccount);

      await expect(service.createAccount(name, email)).rejects.toThrow(
        'An account is already registered with this email address',
      );

      expect(mockIndexedDBAccountRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(mockIndexedDBAccountRepo.create).not.toHaveBeenCalled();
    });

    it('should create account with correct timestamp format', async () => {
      const name = 'Timestamped Account';
      const email = 'timestamp@example.com';
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(null);
      mockIndexedDBAccountRepo.create.mockImplementation((data) => {
        return Promise.resolve({ ...data, id: 1 } as Account);
      });

      const beforeCreate = new Date();
      await service.createAccount(name, email);
      const afterCreate = new Date();

      expect(mockIndexedDBAccountRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name,
          email,
          active: true,
        }),
      );

      const createCall = mockIndexedDBAccountRepo.create.mock.calls[0][0];
      const createdAt = new Date(createCall.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should set active to true by default', async () => {
      const name = 'Active Account';
      const email = 'active@example.com';
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(null);
      mockIndexedDBAccountRepo.create.mockResolvedValue(mockAccount);

      await service.createAccount(name, email);

      expect(mockIndexedDBAccountRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
        }),
      );
    });

    it('should propagate repository errors', async () => {
      const name = 'Error Account';
      const email = 'error@example.com';
      const error = new Error('Database connection failed');
      mockIndexedDBAccountRepo.findByEmail.mockRejectedValue(error);

      await expect(service.createAccount(name, email)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('getAccountById', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should retrieve account by id successfully', async () => {
      mockIndexedDBAccountRepo.findById.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1);

      expect(mockIndexedDBAccountRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAccount);
    });

    it('should return null if account not found', async () => {
      mockIndexedDBAccountRepo.findById.mockResolvedValue(null);

      const result = await service.getAccountById(999);

      expect(mockIndexedDBAccountRepo.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should handle different account ids', async () => {
      mockIndexedDBAccountRepo.findById.mockImplementation((id) => {
        if (id === 1) return Promise.resolve(mockAccount);
        if (id === 2) return Promise.resolve(mockAccount2);
        return Promise.resolve(null);
      });

      const result1 = await service.getAccountById(1);
      const result2 = await service.getAccountById(2);

      expect(result1).toEqual(mockAccount);
      expect(result2).toEqual(mockAccount2);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Database query failed');
      mockIndexedDBAccountRepo.findById.mockRejectedValue(error);

      await expect(service.getAccountById(1)).rejects.toThrow('Database query failed');
    });
  });

  describe('getAccountByEmail', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should retrieve account by email successfully', async () => {
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(mockAccount);

      const result = await service.getAccountByEmail('test@example.com');

      expect(mockIndexedDBAccountRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockAccount);
    });

    it('should return null if account not found by email', async () => {
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(null);

      const result = await service.getAccountByEmail('nonexistent@example.com');

      expect(mockIndexedDBAccountRepo.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should handle email case sensitivity as per repository', async () => {
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(mockAccount);

      const result = await service.getAccountByEmail('Test@Example.Com');

      expect(mockIndexedDBAccountRepo.findByEmail).toHaveBeenCalledWith('Test@Example.Com');
      expect(result).toEqual(mockAccount);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Email index lookup failed');
      mockIndexedDBAccountRepo.findByEmail.mockRejectedValue(error);

      await expect(service.getAccountByEmail('test@example.com')).rejects.toThrow(
        'Email index lookup failed',
      );
    });
  });

  describe('getAllAccounts', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should retrieve all accounts successfully', async () => {
      const accounts = [mockAccount, mockAccount2];
      mockIndexedDBAccountRepo.findAll.mockResolvedValue(accounts);

      const result = await service.getAllAccounts();

      expect(mockIndexedDBAccountRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(accounts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no accounts exist', async () => {
      mockIndexedDBAccountRepo.findAll.mockResolvedValue([]);

      const result = await service.getAllAccounts();

      expect(mockIndexedDBAccountRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return accounts in order provided by repository', async () => {
      const accounts = [mockAccount2, mockAccount]; // reversed order
      mockIndexedDBAccountRepo.findAll.mockResolvedValue(accounts);

      const result = await service.getAllAccounts();

      expect(result[0]).toEqual(mockAccount2);
      expect(result[1]).toEqual(mockAccount);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Failed to fetch all accounts');
      mockIndexedDBAccountRepo.findAll.mockRejectedValue(error);

      await expect(service.getAllAccounts()).rejects.toThrow('Failed to fetch all accounts');
    });
  });

  describe('updateAccount', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should update account successfully', async () => {
      const updates = { name: 'Updated Account' };
      const updatedAccount = { ...mockAccount, ...updates };
      mockIndexedDBAccountRepo.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(1, updates);

      expect(mockIndexedDBAccountRepo.update).toHaveBeenCalledWith(1, updates);
      expect(result).toEqual(updatedAccount);
    });

    it('should update multiple fields at once', async () => {
      const updates = {
        name: 'New Name',
        email: 'newemail@example.com',
        active: false,
      };
      const updatedAccount = { ...mockAccount, ...updates };
      mockIndexedDBAccountRepo.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(1, updates);

      expect(mockIndexedDBAccountRepo.update).toHaveBeenCalledWith(1, updates);
      expect(result.name).toBe('New Name');
      expect(result.email).toBe('newemail@example.com');
      expect(result.active).toBe(false);
    });

    it('should update only the active status', async () => {
      const updates = { active: false };
      const updatedAccount = { ...mockAccount, active: false };
      mockIndexedDBAccountRepo.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(1, updates);

      expect(mockIndexedDBAccountRepo.update).toHaveBeenCalledWith(1, updates);
      expect(result.active).toBe(false);
    });

    it('should handle partial updates', async () => {
      const updates = { email: 'updated@example.com' };
      const updatedAccount = { ...mockAccount, ...updates };
      mockIndexedDBAccountRepo.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(1, updates);

      expect(mockIndexedDBAccountRepo.update).toHaveBeenCalledWith(1, updates);
      expect(result.email).toBe('updated@example.com');
      expect(result.name).toBe(mockAccount.name); // unchanged
    });

    it('should propagate repository errors for non-existent account', async () => {
      const updates = { name: 'Updated' };
      const error = new Error('Account with id 999 not found');
      mockIndexedDBAccountRepo.update.mockRejectedValue(error);

      await expect(service.updateAccount(999, updates)).rejects.toThrow(
        'Account with id 999 not found',
      );
    });

    it('should propagate general repository errors', async () => {
      const updates = { name: 'Updated' };
      const error = new Error('Database write failed');
      mockIndexedDBAccountRepo.update.mockRejectedValue(error);

      await expect(service.updateAccount(1, updates)).rejects.toThrow('Database write failed');
    });
  });

  describe('deleteAccount', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should delete account successfully', async () => {
      mockIndexedDBAccountRepo.delete.mockResolvedValue(undefined);

      await service.deleteAccount(1);

      expect(mockIndexedDBAccountRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should not throw error when deleting valid account', async () => {
      mockIndexedDBAccountRepo.delete.mockResolvedValue(undefined);

      await expect(service.deleteAccount(1)).resolves.not.toThrow();
    });

    it('should handle deletion of different account ids', async () => {
      mockIndexedDBAccountRepo.delete.mockResolvedValue(undefined);

      await service.deleteAccount(1);
      await service.deleteAccount(2);
      await service.deleteAccount(999);

      expect(mockIndexedDBAccountRepo.delete).toHaveBeenCalledTimes(3);
      expect(mockIndexedDBAccountRepo.delete).toHaveBeenCalledWith(1);
      expect(mockIndexedDBAccountRepo.delete).toHaveBeenCalledWith(2);
      expect(mockIndexedDBAccountRepo.delete).toHaveBeenCalledWith(999);
    });

    it('should propagate repository errors for non-existent account', async () => {
      const error = new Error('Account not found');
      mockIndexedDBAccountRepo.delete.mockRejectedValue(error);

      await expect(service.deleteAccount(999)).rejects.toThrow('Account not found');
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database delete operation failed');
      mockIndexedDBAccountRepo.delete.mockRejectedValue(error);

      await expect(service.deleteAccount(1)).rejects.toThrow('Database delete operation failed');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should handle creation with empty name', async () => {
      const name = '';
      const email = 'test@example.com';
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(null);
      mockIndexedDBAccountRepo.create.mockResolvedValue({
        ...mockAccount,
        name,
        email,
      });

      const result = await service.createAccount(name, email);

      expect(result.name).toBe('');
    });

    it('should handle very long account names', async () => {
      const longName = 'A'.repeat(1000);
      const email = 'long@example.com';
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(null);
      mockIndexedDBAccountRepo.create.mockResolvedValue({
        ...mockAccount,
        name: longName,
        email,
      });

      const result = await service.createAccount(longName, email);

      expect(result.name).toBe(longName);
    });

    it('should handle special characters in email', async () => {
      const email = 'test+special@sub.example.com';
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(mockAccount);

      const result = await service.getAccountByEmail(email);

      expect(mockIndexedDBAccountRepo.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should handle concurrent operations on different accounts', async () => {
      mockIndexedDBAccountRepo.findById.mockImplementation((id) => {
        return Promise.resolve(id === 1 ? mockAccount : mockAccount2);
      });

      const [result1, result2] = await Promise.all([
        service.getAccountById(1),
        service.getAccountById(2),
      ]);

      expect(result1).toEqual(mockAccount);
      expect(result2).toEqual(mockAccount2);
    });

    it('should handle rapid successive calls', async () => {
      mockIndexedDBAccountRepo.findById.mockResolvedValue(mockAccount);

      const promises = Array.from({ length: 10 }, () => service.getAccountById(1));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toEqual(mockAccount);
      });
      expect(mockIndexedDBAccountRepo.findById).toHaveBeenCalledTimes(10);
    });

    it('should handle null or undefined in updates gracefully', async () => {
      const updates = { name: undefined };
      const updatedAccount = { ...mockAccount };
      mockIndexedDBAccountRepo.update.mockResolvedValue(updatedAccount);

      await service.updateAccount(1, updates);

      expect(mockIndexedDBAccountRepo.update).toHaveBeenCalledWith(1, updates);
    });
  });

  describe('Repository Switching on Platform Change', () => {
    it('should switch from IndexedDB to SQLite when platform changes', async () => {
      // First call on web platform
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBAccountRepo.findById.mockResolvedValue(mockAccount);
      const result1 = await service.getAccountById(1);
      expect(mockIndexedDBAccountRepo.findById).toHaveBeenCalledWith(1);
      expect(result1).toEqual(mockAccount);

      // Reset mocks
      mockIndexedDBAccountRepo.findById.mockClear();
      mockSqliteAccountRepo.findById.mockClear();

      // Second call on Tauri platform
      mockPlatformService.isTauri.mockReturnValue(true);
      mockSqliteAccountRepo.findById.mockResolvedValue(mockAccount2);
      const result2 = await service.getAccountById(2);
      expect(mockSqliteAccountRepo.findById).toHaveBeenCalledWith(2);
      expect(mockIndexedDBAccountRepo.findById).not.toHaveBeenCalled();
      expect(result2).toEqual(mockAccount2);
    });

    it('should use correct repository for create on different platforms', async () => {
      // Web platform
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBAccountRepo.findByEmail.mockResolvedValue(null);
      mockIndexedDBAccountRepo.create.mockResolvedValue(mockAccount);
      await service.createAccount('Test', 'test@example.com');
      expect(mockIndexedDBAccountRepo.create).toHaveBeenCalled();

      // Reset and switch to Tauri
      mockIndexedDBAccountRepo.create.mockClear();
      mockPlatformService.isTauri.mockReturnValue(true);
      mockSqliteAccountRepo.findByEmail.mockResolvedValue(null);
      mockSqliteAccountRepo.create.mockResolvedValue(mockAccount2);
      await service.createAccount('Test2', 'test2@example.com');
      expect(mockSqliteAccountRepo.create).toHaveBeenCalled();
      expect(mockIndexedDBAccountRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should preserve account data structure on retrieval', async () => {
      mockIndexedDBAccountRepo.findById.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('createdAt');
    });

    it('should maintain account active status', async () => {
      const activeAccount = { ...mockAccount, active: true };
      const inactiveAccount = { ...mockAccount, id: 2, active: false };

      mockIndexedDBAccountRepo.findById.mockImplementation((id) => {
        return Promise.resolve(id === 1 ? activeAccount : inactiveAccount);
      });

      const active = await service.getAccountById(1);
      const inactive = await service.getAccountById(2);

      expect(active?.active).toBe(true);
      expect(inactive?.active).toBe(false);
    });

    it('should preserve ISO date format in createdAt', async () => {
      const isoDate = '2024-01-15T10:30:00.000Z';
      const account = { ...mockAccount, createdAt: isoDate };
      mockIndexedDBAccountRepo.findById.mockResolvedValue(account);

      const result = await service.getAccountById(1);

      expect(result?.createdAt).toBe(isoDate);
      // Verify it's a valid ISO string
      expect(() => new Date(result!.createdAt)).not.toThrow();
    });
  });
});
