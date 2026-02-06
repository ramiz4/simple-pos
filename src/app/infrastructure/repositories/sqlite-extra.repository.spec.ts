import { TestBed } from '@angular/core/testing';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Extra } from '../../domain/entities/extra.interface';
import { SQLiteExtraRepository } from './sqlite-extra.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteExtraRepository', () => {
  let repository: SQLiteExtraRepository;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    vi.mocked(Database.load).mockResolvedValue(mockDb as any);

    TestBed.configureTestingModule({
      providers: [SQLiteExtraRepository],
    });

    repository = TestBed.inject(SQLiteExtraRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create extra table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS extra'),
      );
    });

    it('should create table with unique name constraint', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('name TEXT NOT NULL UNIQUE'),
      );
    });
  });

  describe('findById', () => {
    it('should return extra when found', async () => {
      const mockExtra: Extra = {
        id: 1,
        name: 'Extra Cheese',
        price: 2.5,
      };
      mockDb.select.mockResolvedValue([mockExtra]);

      const result = await repository.findById(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM extra WHERE id = ?', [1]);
      expect(result).toEqual(mockExtra);
    });

    it('should return null when extra not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all extras', async () => {
      const mockExtras: Extra[] = [
        { id: 1, name: 'Extra Cheese', price: 2.5 },
        { id: 2, name: 'Bacon', price: 3.0 },
        { id: 3, name: 'Mushrooms', price: 1.5 },
      ];
      mockDb.select.mockResolvedValue(mockExtras);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM extra');
      expect(result).toEqual(mockExtras);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no extras exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new extra', async () => {
      const newExtra: Omit<Extra, 'id'> = {
        name: 'Extra Sauce',
        price: 1.0,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

      const result = await repository.create(newExtra);

      expect(mockDb.execute).toHaveBeenCalledWith('INSERT INTO extra (name, price) VALUES (?, ?)', [
        'Extra Sauce',
        1.0,
      ]);
      expect(result).toEqual({ ...newExtra, id: 42 });
    });

    it('should create extra with zero price', async () => {
      const newExtra: Omit<Extra, 'id'> = {
        name: 'Free Extra',
        price: 0,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 43 });

      const result = await repository.create(newExtra);

      expect(result.price).toBe(0);
    });

    it('should create extra with decimal price', async () => {
      const newExtra: Omit<Extra, 'id'> = {
        name: 'Premium Topping',
        price: 4.99,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 44 });

      const result = await repository.create(newExtra);

      expect(result.price).toBe(4.99);
    });

    it('should use Date.now() when lastInsertId is null', async () => {
      const newExtra: Omit<Extra, 'id'> = {
        name: 'Test Extra',
        price: 2.0,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: null });

      const result = await repository.create(newExtra);

      expect(result.id).toBeGreaterThan(0);
      expect(typeof result.id).toBe('number');
    });

    it('should handle unique constraint violations', async () => {
      const newExtra: Omit<Extra, 'id'> = {
        name: 'Duplicate Name',
        price: 2.0,
      };
      mockDb.execute.mockRejectedValue(new Error('UNIQUE constraint failed: extra.name'));

      await expect(repository.create(newExtra)).rejects.toThrow('UNIQUE constraint failed');
    });
  });

  describe('update', () => {
    it('should update an existing extra', async () => {
      const existingExtra: Extra = {
        id: 1,
        name: 'Original Name',
        price: 2.0,
      };
      const updateData: Partial<Extra> = {
        name: 'Updated Name',
        price: 3.5,
      };

      mockDb.select.mockResolvedValue([existingExtra]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, updateData);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE extra SET name = ?, price = ? WHERE id = ?',
        ['Updated Name', 3.5, 1],
      );
      expect(result.name).toBe('Updated Name');
      expect(result.price).toBe(3.5);
    });

    it('should update price only', async () => {
      const existingExtra: Extra = {
        id: 1,
        name: 'Extra Cheese',
        price: 2.0,
      };

      mockDb.select.mockResolvedValue([existingExtra]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { price: 2.5 });

      expect(result.name).toBe('Extra Cheese'); // Unchanged
      expect(result.price).toBe(2.5); // Updated
    });

    it('should update name only', async () => {
      const existingExtra: Extra = {
        id: 1,
        name: 'Old Name',
        price: 2.0,
      };

      mockDb.select.mockResolvedValue([existingExtra]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { name: 'New Name' });

      expect(result.name).toBe('New Name'); // Updated
      expect(result.price).toBe(2.0); // Unchanged
    });

    it('should throw error when extra not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(repository.update(999, { name: 'New Name' })).rejects.toThrow(
        'Extra with id 999 not found',
      );
    });

    it('should handle partial updates correctly', async () => {
      const existingExtra: Extra = {
        id: 1,
        name: 'Original Name',
        price: 2.0,
      };

      mockDb.select.mockResolvedValue([existingExtra]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { price: 5.0 });

      expect(result.name).toBe('Original Name'); // Unchanged
      expect(result.price).toBe(5.0); // Updated
    });
  });

  describe('delete', () => {
    it('should delete an extra by id', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.delete(1);

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM extra WHERE id = ?', [1]);
    });

    it('should not throw error when deleting non-existent extra', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.delete(999)).resolves.not.toThrow();
    });

    it('should handle foreign key constraints', async () => {
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.delete(1)).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('count', () => {
    it('should return total number of extras', async () => {
      mockDb.select.mockResolvedValue([{ count: 7 }]);

      const result = await repository.count();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM extra');
      expect(result).toBe(7);
    });

    it('should return 0 when no extras exist', async () => {
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

    it('should use parameterized queries for create', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });
      await repository.create({
        name: "'; DROP TABLE extra; --",
        price: 1.0,
      });

      // First call is table creation, second is INSERT
      const insertCall = mockDb.execute.mock.calls[1];
      expect(insertCall[0]).toContain('?');
      expect(insertCall[1]).toContain("'; DROP TABLE extra; --");
    });
  });

  describe('Edge Cases', () => {
    it('should handle extras with empty names', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: '',
        price: 1.0,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['', 1.0]),
      );
    });

    it('should handle extras with very long names', async () => {
      const longName = 'A'.repeat(1000);
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: longName,
        price: 1.0,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longName]),
      );
    });

    it('should handle special characters in extra name', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: 'Extra & <Special> "Characters"',
        price: 1.0,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['Extra & <Special> "Characters"']),
      );
    });

    it('should handle negative prices', async () => {
      const existingExtra: Extra = {
        id: 1,
        name: 'Discount',
        price: 1.0,
      };

      mockDb.select.mockResolvedValue([existingExtra]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { price: -0.5 });

      expect(result.price).toBe(-0.5);
    });

    it('should handle very large prices', async () => {
      const newExtra: Omit<Extra, 'id'> = {
        name: 'Premium Item',
        price: 999.99,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newExtra);

      expect(result.price).toBe(999.99);
    });

    it('should handle high precision decimal prices', async () => {
      const newExtra: Omit<Extra, 'id'> = {
        name: 'Precise Price',
        price: 12.345678,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newExtra);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([12.345678]),
      );
    });
  });
});
