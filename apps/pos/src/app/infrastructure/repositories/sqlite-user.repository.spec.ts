import { TestBed } from '@angular/core/testing';
import { User } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SQLiteUserRepository } from './sqlite-user.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteUserRepository', () => {
  let repository: SQLiteUserRepository;
  let mockDb: Record<string, vi.Mock>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    vi.mocked(Database.load).mockResolvedValue(mockDb as unknown as Database);

    TestBed.configureTestingModule({
      providers: [SQLiteUserRepository],
    });

    repository = TestBed.inject(SQLiteUserRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create user table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS user'),
      );
    });

    it('should create table with unique constraint on accountId and name', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UNIQUE(accountId, name)'),
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 1,
        pinHash: 'hashed_pin',
        passwordHash: 'hashed_password',
        active: true,
        accountId: 1,
        isOwner: true,
      };
      mockDb.select.mockResolvedValue([mockUser]);

      const result = await repository.findById(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM user WHERE id = ?', [1]);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          name: 'Owner User',
          email: 'owner@example.com',
          roleId: 1,
          pinHash: 'hashed_pin_1',
          passwordHash: 'hashed_password_1',
          active: true,
          accountId: 1,
          isOwner: true,
        },
        {
          id: 2,
          name: 'Staff User',
          email: undefined,
          roleId: 2,
          pinHash: 'hashed_pin_2',
          passwordHash: undefined,
          active: true,
          accountId: 1,
          isOwner: false,
        },
      ];
      mockDb.select.mockResolvedValue(mockUsers);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM user');
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no users exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByName', () => {
    it('should return active user by name', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 1,
        pinHash: 'hashed_pin',
        passwordHash: 'hashed_password',
        active: true,
        accountId: 1,
        isOwner: false,
      };
      mockDb.select.mockResolvedValue([mockUser]);

      const result = await repository.findByName('John Doe');

      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM user WHERE name = ? AND active = 1',
        ['John Doe'],
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByName('Nonexistent User');

      expect(result).toBeNull();
    });

    it('should not return inactive users', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findByName('Inactive User');

      expect(mockDb.select).toHaveBeenCalledWith(expect.stringContaining('active = 1'), [
        'Inactive User',
      ]);
    });
  });

  describe('findByNameAndAccount', () => {
    it('should return active user by name and accountId', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 1,
        pinHash: 'hashed_pin',
        passwordHash: 'hashed_password',
        active: true,
        accountId: 1,
        isOwner: false,
      };
      mockDb.select.mockResolvedValue([mockUser]);

      const result = await repository.findByNameAndAccount('John Doe', 1);

      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM user WHERE name = ? AND accountId = ? AND active = 1',
        ['John Doe', 1],
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found in account', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByNameAndAccount('John Doe', 999);

      expect(result).toBeNull();
    });

    it('should not return users from different accounts', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findByNameAndAccount('John Doe', 2);

      expect(mockDb.select).toHaveBeenCalledWith(expect.stringContaining('accountId = ?'), [
        'John Doe',
        2,
      ]);
    });
  });

  describe('findByAccountId', () => {
    it('should return all users for specific account', async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          name: 'User 1',
          roleId: 1,
          pinHash: 'hash1',
          active: true,
          accountId: 1,
          isOwner: true,
        },
        {
          id: 2,
          name: 'User 2',
          roleId: 2,
          pinHash: 'hash2',
          active: true,
          accountId: 1,
          isOwner: false,
        },
      ];
      mockDb.select.mockResolvedValue(mockUsers);

      const result = await repository.findByAccountId(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM user WHERE accountId = ?', [1]);
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when account has no users', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByAccountId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 1,
        pinHash: 'hashed_pin',
        passwordHash: 'hashed_password',
        active: true,
        accountId: 1,
        isOwner: true,
      };
      mockDb.select.mockResolvedValue([mockUser]);

      const result = await repository.findByEmail('john@example.com');

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM user WHERE email = ?', [
        'john@example.com',
      ]);
      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create owner user with password', async () => {
      const newUser: Omit<User, 'id'> = {
        name: 'Owner User',
        email: 'owner@example.com',
        roleId: 1,
        pinHash: 'hashed_pin',
        passwordHash: 'hashed_password',
        active: true,
        accountId: 1,
        isOwner: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

      const result = await repository.create(newUser);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO user (name, email, roleId, pinHash, passwordHash, active, accountId, isOwner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['Owner User', 'owner@example.com', 1, 'hashed_pin', 'hashed_password', 1, 1, 1],
      );
      expect(result).toEqual({ ...newUser, id: 42 });
    });

    it('should create staff user without email or password', async () => {
      const newUser: Omit<User, 'id'> = {
        name: 'Staff User',
        email: undefined,
        roleId: 2,
        pinHash: 'hashed_pin',
        passwordHash: undefined,
        active: true,
        accountId: 1,
        isOwner: false,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 43 });

      const result = await repository.create(newUser);

      expect(mockDb.execute).toHaveBeenCalledWith(expect.any(String), [
        'Staff User',
        null,
        2,
        'hashed_pin',
        null,
        1,
        1,
        0,
      ]);
      expect(result.email).toBeUndefined();
      expect(result.passwordHash).toBeUndefined();
      expect(result.isOwner).toBe(false);
    });

    it('should create inactive user', async () => {
      const newUser: Omit<User, 'id'> = {
        name: 'Inactive User',
        roleId: 2,
        pinHash: 'hashed_pin',
        active: false,
        accountId: 1,
        isOwner: false,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 44 });

      const result = await repository.create(newUser);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([0]), // active = false -> 0
      );
      expect(result.active).toBe(false);
    });

    it('should use Date.now() when lastInsertId is null', async () => {
      const newUser: Omit<User, 'id'> = {
        name: 'Test User',
        roleId: 2,
        pinHash: 'hashed_pin',
        active: true,
        accountId: 1,
        isOwner: false,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: null });

      const result = await repository.create(newUser);

      expect(result.id).toBeGreaterThan(0);
      expect(typeof result.id).toBe('number');
    });

    it('should handle unique constraint violations', async () => {
      const newUser: Omit<User, 'id'> = {
        name: 'Duplicate Name',
        roleId: 2,
        pinHash: 'hashed_pin',
        active: true,
        accountId: 1,
        isOwner: false,
      };
      mockDb.execute.mockRejectedValue(new Error('UNIQUE constraint failed'));

      await expect(repository.create(newUser)).rejects.toThrow('UNIQUE constraint failed');
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const existingUser: User = {
        id: 1,
        name: 'Original Name',
        email: 'original@example.com',
        roleId: 2,
        pinHash: 'old_pin_hash',
        passwordHash: 'old_password_hash',
        active: true,
        accountId: 1,
        isOwner: false,
      };
      const updateData: Partial<User> = {
        name: 'Updated Name',
        email: 'updated@example.com',
        pinHash: 'new_pin_hash',
      };

      mockDb.select.mockResolvedValue([existingUser]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, updateData);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE user SET name = ?, email = ?, roleId = ?, pinHash = ?, passwordHash = ?, active = ?, accountId = ?, isOwner = ? WHERE id = ?',
        ['Updated Name', 'updated@example.com', 2, 'new_pin_hash', 'old_password_hash', 1, 1, 0, 1],
      );
      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe('updated@example.com');
      expect(result.pinHash).toBe('new_pin_hash');
    });

    it('should update user to inactive', async () => {
      const existingUser: User = {
        id: 1,
        name: 'Test User',
        roleId: 2,
        pinHash: 'pin_hash',
        active: true,
        accountId: 1,
        isOwner: false,
      };

      mockDb.select.mockResolvedValue([existingUser]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { active: false });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([0]), // active = false -> 0
      );
      expect(result.active).toBe(false);
    });

    it('should update isOwner status', async () => {
      const existingUser: User = {
        id: 1,
        name: 'Test User',
        roleId: 2,
        pinHash: 'pin_hash',
        active: true,
        accountId: 1,
        isOwner: false,
      };

      mockDb.select.mockResolvedValue([existingUser]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { isOwner: true });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1]), // isOwner = true -> 1
      );
      expect(result.isOwner).toBe(true);
    });

    it('should handle null email updates', async () => {
      const existingUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        roleId: 2,
        pinHash: 'pin_hash',
        active: true,
        accountId: 1,
        isOwner: false,
      };

      mockDb.select.mockResolvedValue([existingUser]);
      mockDb.execute.mockResolvedValue({});

      await repository.update(1, { email: undefined });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null]), // email undefined -> null in DB
      );
    });

    it('should throw error when user not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(repository.update(999, { name: 'New Name' })).rejects.toThrow(
        'User with id 999 not found',
      );
    });

    it('should handle partial updates correctly', async () => {
      const existingUser: User = {
        id: 1,
        name: 'Original Name',
        email: 'original@example.com',
        roleId: 2,
        pinHash: 'pin_hash',
        active: true,
        accountId: 1,
        isOwner: false,
      };

      mockDb.select.mockResolvedValue([existingUser]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { roleId: 3 });

      expect(result.name).toBe('Original Name'); // Unchanged
      expect(result.roleId).toBe(3); // Updated
      expect(result.email).toBe('original@example.com'); // Unchanged
    });
  });

  describe('delete', () => {
    it('should delete a user by id', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.delete(1);

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM user WHERE id = ?', [1]);
    });

    it('should not throw error when deleting non-existent user', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.delete(999)).resolves.not.toThrow();
    });

    it('should handle foreign key constraints', async () => {
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.delete(1)).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('count', () => {
    it('should return total number of users', async () => {
      mockDb.select.mockResolvedValue([{ count: 10 }]);

      const result = await repository.count();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM user');
      expect(result).toBe(10);
    });

    it('should return 0 when no users exist', async () => {
      mockDb.select.mockResolvedValue([{ count: 0 }]);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should use parameterized queries for findByName', async () => {
      mockDb.select.mockResolvedValue([]);
      await repository.findByName("'; DROP TABLE user; --");

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual(["'; DROP TABLE user; --"]);
    });

    it('should use parameterized queries for findByEmail', async () => {
      mockDb.select.mockResolvedValue([]);
      await repository.findByEmail("test@example.com'; DELETE FROM user; --");

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toContain("test@example.com'; DELETE FROM user; --");
    });
  });

  describe('Edge Cases', () => {
    it('should handle users with empty names', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: '',
        roleId: 2,
        pinHash: 'pin_hash',
        active: true,
        accountId: 1,
        isOwner: false,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['', null, 2, 'pin_hash', null, 1, 1, 0]),
      );
    });

    it('should handle users with very long names', async () => {
      const longName = 'A'.repeat(1000);
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: longName,
        roleId: 2,
        pinHash: 'pin_hash',
        active: true,
        accountId: 1,
        isOwner: false,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longName]),
      );
    });

    it('should handle special characters in user names', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: "O'Connor & Smith <Admin>",
        roleId: 2,
        pinHash: 'pin_hash',
        active: true,
        accountId: 1,
        isOwner: false,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["O'Connor & Smith <Admin>"]),
      );
    });

    it('should handle special characters in email', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: 'Test User',
        email: 'test+tag@example.co.uk',
        roleId: 2,
        pinHash: 'pin_hash',
        active: true,
        accountId: 1,
        isOwner: false,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['test+tag@example.co.uk']),
      );
    });

    it('should handle long hashed values', async () => {
      const longHash = 'A'.repeat(500);
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: 'Test User',
        roleId: 2,
        pinHash: longHash,
        passwordHash: longHash,
        active: true,
        accountId: 1,
        isOwner: true,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longHash, longHash]),
      );
    });
  });

  describe('Schema Migration Notes', () => {
    it('should create table with email UNIQUE constraint', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('email TEXT UNIQUE'));
    });

    it('should create table with composite unique constraint on accountId and name', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UNIQUE(accountId, name)'),
      );
    });

    it('should create table with foreign keys', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      const call = mockDb.execute.mock.calls[0][0];
      expect(call).toContain('FOREIGN KEY (roleId) REFERENCES code_table (id)');
      expect(call).toContain('FOREIGN KEY (accountId) REFERENCES account (id)');
    });
  });
});
