import { TestBed } from '@angular/core/testing';
import { Account } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { SQLiteAccountRepository } from './sqlite-account.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteAccountRepository', () => {
  let repository: SQLiteAccountRepository;
  let mockDb: { select: Mock; execute: Mock };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock database instance
    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    // Mock Database.load to return our mock db
    vi.mocked(Database.load).mockResolvedValue(mockDb as unknown as Database);

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [SQLiteAccountRepository],
    });

    repository = TestBed.inject(SQLiteAccountRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create table on first access', async () => {
      mockDb.select.mockResolvedValue([{ id: 1, name: 'Test' }]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS account'),
      );
    });

    it('should reuse database connection on subsequent calls', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();
      await repository.findAll();

      expect(Database.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return account when found', async () => {
      const mockAccount: Account = {
        id: 1,
        name: 'Test Account',
        email: 'test@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      mockDb.select.mockResolvedValue([mockAccount]);

      const result = await repository.findById(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM account WHERE id = ?', [1]);
      expect(result).toEqual(mockAccount);
    });

    it('should return null when account not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockDb.select.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all accounts', async () => {
      const mockAccounts: Account[] = [
        {
          id: 1,
          name: 'Account 1',
          email: 'account1@example.com',
          active: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          name: 'Account 2',
          email: 'account2@example.com',
          active: false,
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ];
      mockDb.select.mockResolvedValue(mockAccounts);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM account');
      expect(result).toEqual(mockAccounts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no accounts exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByEmail', () => {
    it('should return account when found by email', async () => {
      const mockAccount: Account = {
        id: 1,
        name: 'Test Account',
        email: 'test@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      mockDb.select.mockResolvedValue([mockAccount]);

      const result = await repository.findByEmail('test@example.com');

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM account WHERE email = ?', [
        'test@example.com',
      ]);
      expect(result).toEqual(mockAccount);
    });

    it('should return null when account not found by email', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle special characters in email', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findByEmail('test+tag@example.com');

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM account WHERE email = ?', [
        'test+tag@example.com',
      ]);
    });
  });

  describe('create', () => {
    it('should create a new account with active status', async () => {
      const newAccount: Omit<Account, 'id'> = {
        name: 'New Account',
        email: 'new@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

      const result = await repository.create(newAccount);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO account (name, email, active, createdAt) VALUES (?, ?, ?, ?)',
        ['New Account', 'new@example.com', 1, '2024-01-01T00:00:00.000Z'],
      );
      expect(result).toEqual({ ...newAccount, id: 42 });
    });

    it('should create account with inactive status', async () => {
      const newAccount: Omit<Account, 'id'> = {
        name: 'Inactive Account',
        email: 'inactive@example.com',
        active: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 43 });

      const result = await repository.create(newAccount);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO account (name, email, active, createdAt) VALUES (?, ?, ?, ?)',
        ['Inactive Account', 'inactive@example.com', 0, '2024-01-01T00:00:00.000Z'],
      );
      expect(result.active).toBe(false);
    });

    it('should use Date.now() as fallback when lastInsertId is null', async () => {
      const newAccount: Omit<Account, 'id'> = {
        name: 'Test Account',
        email: 'test@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: null });

      const result = await repository.create(newAccount);

      expect(result.id).toBeGreaterThan(0);
      expect(typeof result.id).toBe('number');
    });

    it('should handle database constraint violations', async () => {
      const newAccount: Omit<Account, 'id'> = {
        name: 'Duplicate Email',
        email: 'duplicate@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      mockDb.execute.mockRejectedValue(new Error('UNIQUE constraint failed: account.email'));

      await expect(repository.create(newAccount)).rejects.toThrow('UNIQUE constraint failed');
    });
  });

  describe('update', () => {
    it('should update an existing account', async () => {
      const existingAccount: Account = {
        id: 1,
        name: 'Original Name',
        email: 'original@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      const updateData: Partial<Account> = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      // First call returns existing account, second call for execute
      mockDb.select.mockResolvedValueOnce([existingAccount]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, updateData);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM account WHERE id = ?', [1]);
      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE account SET name = ?, email = ?, active = ? WHERE id = ?',
        ['Updated Name', 'updated@example.com', 1, 1],
      );
      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe('updated@example.com');
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z'); // Preserved
    });

    it('should update active status to false', async () => {
      const existingAccount: Account = {
        id: 1,
        name: 'Test Account',
        email: 'test@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockDb.select.mockResolvedValue([existingAccount]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { active: false });

      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE account SET name = ?, email = ?, active = ? WHERE id = ?',
        ['Test Account', 'test@example.com', 0, 1],
      );
      expect(result.active).toBe(false);
    });

    it('should throw error when account not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(repository.update(999, { name: 'New Name' })).rejects.toThrow(
        'Account with id 999 not found',
      );
    });

    it('should handle partial updates correctly', async () => {
      const existingAccount: Account = {
        id: 1,
        name: 'Original Name',
        email: 'original@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockDb.select.mockResolvedValue([existingAccount]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe('original@example.com'); // Unchanged
      expect(result.active).toBe(true); // Unchanged
    });
  });

  describe('delete', () => {
    it('should delete an account by id', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.delete(1);

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM account WHERE id = ?', [1]);
    });

    it('should not throw error when deleting non-existent account', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.delete(999)).resolves.not.toThrow();
    });

    it('should handle foreign key constraints', async () => {
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.delete(1)).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('count', () => {
    it('should return total number of accounts', async () => {
      mockDb.select.mockResolvedValue([{ count: 5 }]);

      const result = await repository.count();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM account');
      expect(result).toBe(5);
    });

    it('should return 0 when no accounts exist', async () => {
      mockDb.select.mockResolvedValue([{ count: 0 }]);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should use parameterized queries for findById', async () => {
      mockDb.select.mockResolvedValue([]);
      await repository.findById(1);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual([1]);
    });

    it('should use parameterized queries for findByEmail', async () => {
      mockDb.select.mockResolvedValue([]);
      await repository.findByEmail("'; DROP TABLE account; --");

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual(["'; DROP TABLE account; --"]);
    });

    it('should use parameterized queries for create', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });
      await repository.create({
        name: "Test'; DROP TABLE account; --",
        email: 'test@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      // First call is table creation, second is INSERT
      const insertCall = mockDb.execute.mock.calls[1];
      expect(insertCall[0]).toContain('?');
      expect(insertCall[1]).toContain("Test'; DROP TABLE account; --");
    });
  });

  describe('Edge Cases', () => {
    it('should handle accounts with empty strings', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: '',
        email: 'test@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['', 'test@example.com', 1, '2024-01-01T00:00:00.000Z']),
      );
    });

    it('should handle accounts with very long names', async () => {
      const longName = 'A'.repeat(1000);
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: longName,
        email: 'test@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longName, 'test@example.com', 1, '2024-01-01T00:00:00.000Z']),
      );
    });

    it('should handle special characters in account name', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: 'Test & Co. "Special" <Account>',
        email: 'test@example.com',
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          'Test & Co. "Special" <Account>',
          'test@example.com',
          1,
          '2024-01-01T00:00:00.000Z',
        ]),
      );
    });
  });
});
