import { TestBed } from '@angular/core/testing';
import { Account } from '@simple-pos/shared/types';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ACCOUNT_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let mockAccountRepo: {
    findById: Mock;
    findAll: Mock;
    findByEmail: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
  };

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
    // Mock Account Repository
    mockAccountRepo = {
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
      providers: [AccountService, { provide: ACCOUNT_REPOSITORY, useValue: mockAccountRepo }],
    });

    service = TestBed.inject(AccountService);
  });

  describe('Platform Selection', () => {
    it('should use the injected repository', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1);

      expect(mockAccountRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('createAccount', () => {
    it('should create a new account successfully', async () => {
      const name = 'New Account';
      const email = 'new@example.com';
      mockAccountRepo.findByEmail.mockResolvedValue(null);
      mockAccountRepo.create.mockResolvedValue({
        ...mockAccount,
        name,
        email,
      });

      const result = await service.createAccount(name, email);

      expect(mockAccountRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(mockAccountRepo.create).toHaveBeenCalledWith({
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
      mockAccountRepo.findByEmail.mockResolvedValue(mockAccount);

      await expect(service.createAccount(name, email)).rejects.toThrow(
        'An account is already registered with this email address',
      );

      expect(mockAccountRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(mockAccountRepo.create).not.toHaveBeenCalled();
    });

    it('should create account with correct timestamp format', async () => {
      const name = 'Timestamped Account';
      const email = 'timestamp@example.com';
      mockAccountRepo.findByEmail.mockResolvedValue(null);
      mockAccountRepo.create.mockImplementation((data) => {
        return Promise.resolve({ ...data, id: 1 } as Account);
      });

      const beforeCreate = new Date();
      await service.createAccount(name, email);
      const afterCreate = new Date();

      expect(mockAccountRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name,
          email,
          active: true,
        }),
      );

      const createCall = mockAccountRepo.create.mock.calls[0][0];
      const createdAt = new Date(createCall.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should set active to true by default', async () => {
      const name = 'Active Account';
      const email = 'active@example.com';
      mockAccountRepo.findByEmail.mockResolvedValue(null);
      mockAccountRepo.create.mockResolvedValue(mockAccount);

      await service.createAccount(name, email);

      expect(mockAccountRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
        }),
      );
    });

    it('should propagate repository errors', async () => {
      const name = 'Error Account';
      const email = 'error@example.com';
      const error = new Error('Database connection failed');
      mockAccountRepo.findByEmail.mockRejectedValue(error);

      await expect(service.createAccount(name, email)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('getAccountById', () => {
    it('should retrieve account by id successfully', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);

      const result = await service.getAccountById(1);

      expect(mockAccountRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAccount);
    });

    it('should return null if account not found', async () => {
      mockAccountRepo.findById.mockResolvedValue(null);

      const result = await service.getAccountById(999);

      expect(mockAccountRepo.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should handle different account ids', async () => {
      mockAccountRepo.findById.mockImplementation((id) => {
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
      mockAccountRepo.findById.mockRejectedValue(error);

      await expect(service.getAccountById(1)).rejects.toThrow('Database query failed');
    });
  });

  describe('getAccountByEmail', () => {
    it('should retrieve account by email successfully', async () => {
      mockAccountRepo.findByEmail.mockResolvedValue(mockAccount);

      const result = await service.getAccountByEmail('test@example.com');

      expect(mockAccountRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockAccount);
    });

    it('should return null if account not found by email', async () => {
      mockAccountRepo.findByEmail.mockResolvedValue(null);

      const result = await service.getAccountByEmail('nonexistent@example.com');

      expect(mockAccountRepo.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should handle email case sensitivity as per repository', async () => {
      mockAccountRepo.findByEmail.mockResolvedValue(mockAccount);

      const result = await service.getAccountByEmail('Test@Example.Com');

      expect(mockAccountRepo.findByEmail).toHaveBeenCalledWith('Test@Example.Com');
      expect(result).toEqual(mockAccount);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Email index lookup failed');
      mockAccountRepo.findByEmail.mockRejectedValue(error);

      await expect(service.getAccountByEmail('test@example.com')).rejects.toThrow(
        'Email index lookup failed',
      );
    });
  });

  describe('getAllAccounts', () => {
    it('should retrieve all accounts successfully', async () => {
      const accounts = [mockAccount, mockAccount2];
      mockAccountRepo.findAll.mockResolvedValue(accounts);

      const result = await service.getAllAccounts();

      expect(mockAccountRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(accounts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no accounts exist', async () => {
      mockAccountRepo.findAll.mockResolvedValue([]);

      const result = await service.getAllAccounts();

      expect(mockAccountRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return accounts in order provided by repository', async () => {
      const accounts = [mockAccount2, mockAccount]; // reversed order
      mockAccountRepo.findAll.mockResolvedValue(accounts);

      const result = await service.getAllAccounts();

      expect(result[0]).toEqual(mockAccount2);
      expect(result[1]).toEqual(mockAccount);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Failed to fetch all accounts');
      mockAccountRepo.findAll.mockRejectedValue(error);

      await expect(service.getAllAccounts()).rejects.toThrow('Failed to fetch all accounts');
    });
  });

  describe('updateAccount', () => {
    it('should update account successfully', async () => {
      const updates = { name: 'Updated Account' };
      const updatedAccount = { ...mockAccount, ...updates };
      mockAccountRepo.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(1, updates);

      expect(mockAccountRepo.update).toHaveBeenCalledWith(1, updates);
      expect(result).toEqual(updatedAccount);
    });

    it('should update multiple fields at once', async () => {
      const updates = {
        name: 'New Name',
        email: 'newemail@example.com',
        active: false,
      };
      const updatedAccount = { ...mockAccount, ...updates };
      mockAccountRepo.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(1, updates);

      expect(mockAccountRepo.update).toHaveBeenCalledWith(1, updates);
      expect(result.name).toBe('New Name');
      expect(result.email).toBe('newemail@example.com');
      expect(result.active).toBe(false);
    });

    it('should update only the active status', async () => {
      const updates = { active: false };
      const updatedAccount = { ...mockAccount, active: false };
      mockAccountRepo.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(1, updates);

      expect(mockAccountRepo.update).toHaveBeenCalledWith(1, updates);
      expect(result.active).toBe(false);
    });

    it('should handle partial updates', async () => {
      const updates = { email: 'updated@example.com' };
      const updatedAccount = { ...mockAccount, ...updates };
      mockAccountRepo.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount(1, updates);

      expect(mockAccountRepo.update).toHaveBeenCalledWith(1, updates);
      expect(result.email).toBe('updated@example.com');
      expect(result.name).toBe(mockAccount.name); // unchanged
    });

    it('should propagate repository errors for non-existent account', async () => {
      const updates = { name: 'Updated' };
      const error = new Error('Account with id 999 not found');
      mockAccountRepo.update.mockRejectedValue(error);

      await expect(service.updateAccount(999, updates)).rejects.toThrow(
        'Account with id 999 not found',
      );
    });

    it('should propagate general repository errors', async () => {
      const updates = { name: 'Updated' };
      const error = new Error('Database write failed');
      mockAccountRepo.update.mockRejectedValue(error);

      await expect(service.updateAccount(1, updates)).rejects.toThrow('Database write failed');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      mockAccountRepo.delete.mockResolvedValue(undefined);

      await service.deleteAccount(1);

      expect(mockAccountRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should not throw error when deleting valid account', async () => {
      mockAccountRepo.delete.mockResolvedValue(undefined);

      await expect(service.deleteAccount(1)).resolves.not.toThrow();
    });

    it('should handle deletion of different account ids', async () => {
      mockAccountRepo.delete.mockResolvedValue(undefined);

      await service.deleteAccount(1);
      await service.deleteAccount(2);
      await service.deleteAccount(999);

      expect(mockAccountRepo.delete).toHaveBeenCalledTimes(3);
      expect(mockAccountRepo.delete).toHaveBeenCalledWith(1);
      expect(mockAccountRepo.delete).toHaveBeenCalledWith(2);
      expect(mockAccountRepo.delete).toHaveBeenCalledWith(999);
    });

    it('should propagate repository errors for non-existent account', async () => {
      const error = new Error('Account not found');
      mockAccountRepo.delete.mockRejectedValue(error);

      await expect(service.deleteAccount(999)).rejects.toThrow('Account not found');
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database delete operation failed');
      mockAccountRepo.delete.mockRejectedValue(error);

      await expect(service.deleteAccount(1)).rejects.toThrow('Database delete operation failed');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle creation with empty name', async () => {
      const name = '';
      const email = 'test@example.com';
      mockAccountRepo.findByEmail.mockResolvedValue(null);
      mockAccountRepo.create.mockResolvedValue({
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
      mockAccountRepo.findByEmail.mockResolvedValue(null);
      mockAccountRepo.create.mockResolvedValue({
        ...mockAccount,
        name: longName,
        email,
      });

      const result = await service.createAccount(longName, email);

      expect(result.name).toBe(longName);
    });

    it('should handle special characters in email', async () => {
      const email = 'test+special@sub.example.com';
      mockAccountRepo.findByEmail.mockResolvedValue(mockAccount);

      const result = await service.getAccountByEmail(email);

      expect(mockAccountRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockAccount);
    });

    it('should handle concurrent operations on different accounts', async () => {
      mockAccountRepo.findById.mockImplementation((id) => {
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
      mockAccountRepo.findById.mockResolvedValue(mockAccount);

      const promises = Array.from({ length: 10 }, () => service.getAccountById(1));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toEqual(mockAccount);
      });
      expect(mockAccountRepo.findById).toHaveBeenCalledTimes(10);
    });

    it('should handle null or undefined in updates gracefully', async () => {
      const updates = { name: undefined };
      const updatedAccount = { ...mockAccount };
      mockAccountRepo.update.mockResolvedValue(updatedAccount);

      await service.updateAccount(1, updates);

      expect(mockAccountRepo.update).toHaveBeenCalledWith(1, updates);
    });
  });

  describe('Repository Usage', () => {
    it('should use the injected repository for sequential calls', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      const result1 = await service.getAccountById(1);
      expect(mockAccountRepo.findById).toHaveBeenCalledWith(1);
      expect(result1).toEqual(mockAccount);

      // Reset mocks
      mockAccountRepo.findById.mockClear();

      mockAccountRepo.findById.mockResolvedValue(mockAccount2);
      const result2 = await service.getAccountById(2);
      expect(mockAccountRepo.findById).toHaveBeenCalledWith(2);
      expect(result2).toEqual(mockAccount2);
    });

    it('should use the injected repository for create operations', async () => {
      mockAccountRepo.findByEmail.mockResolvedValue(null);
      mockAccountRepo.create.mockResolvedValue(mockAccount);
      await service.createAccount('Test', 'test@example.com');
      expect(mockAccountRepo.create).toHaveBeenCalled();

      mockAccountRepo.create.mockClear();
      mockAccountRepo.findByEmail.mockResolvedValue(null);
      mockAccountRepo.create.mockResolvedValue(mockAccount2);
      await service.createAccount('Test2', 'test2@example.com');
      expect(mockAccountRepo.create).toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    it('should preserve account data structure on retrieval', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);

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

      mockAccountRepo.findById.mockImplementation((id) => {
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
      mockAccountRepo.findById.mockResolvedValue(account);

      const result = await service.getAccountById(1);

      expect(result?.createdAt).toBe(isoDate);
      // Verify it's a valid ISO string
      expect(() => new Date(result?.createdAt ?? '')).not.toThrow();
    });
  });
});
