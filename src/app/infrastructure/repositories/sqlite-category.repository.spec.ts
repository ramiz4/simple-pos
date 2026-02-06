import { TestBed } from '@angular/core/testing';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Category } from '../../domain/entities/category.interface';
import { SQLiteCategoryRepository } from './sqlite-category.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteCategoryRepository', () => {
  let repository: SQLiteCategoryRepository;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    vi.mocked(Database.load).mockResolvedValue(mockDb as any);

    TestBed.configureTestingModule({
      providers: [SQLiteCategoryRepository],
    });

    repository = TestBed.inject(SQLiteCategoryRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create category table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS category'),
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
    it('should return category when found', async () => {
      const mockCategory: Category = {
        id: 1,
        name: 'Pizza',
        sortOrder: 1,
        isActive: true,
      };
      mockDb.select.mockResolvedValue([mockCategory]);

      const result = await repository.findById(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM category WHERE id = ?', [1]);
      expect(result).toEqual(mockCategory);
    });

    it('should return null when category not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all categories ordered by sortOrder', async () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'Pizza', sortOrder: 1, isActive: true },
        { id: 2, name: 'Pasta', sortOrder: 2, isActive: true },
        { id: 3, name: 'Salad', sortOrder: 3, isActive: false },
      ];
      mockDb.select.mockResolvedValue(mockCategories);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM category ORDER BY sortOrder');
      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no categories exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const newCategory: Omit<Category, 'id'> = {
        name: 'Beverages',
        sortOrder: 5,
        isActive: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

      const result = await repository.create(newCategory);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO category (name, sortOrder, isActive) VALUES (?, ?, ?)',
        ['Beverages', 5, 1],
      );
      expect(result).toEqual({ ...newCategory, id: 42 });
    });

    it('should create inactive category', async () => {
      const newCategory: Omit<Category, 'id'> = {
        name: 'Archived Category',
        sortOrder: 10,
        isActive: false,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 43 });

      const result = await repository.create(newCategory);

      expect(mockDb.execute).toHaveBeenCalledWith(expect.any(String), ['Archived Category', 10, 0]);
      expect(result.isActive).toBe(false);
    });

    it('should create category with zero sortOrder', async () => {
      const newCategory: Omit<Category, 'id'> = {
        name: 'First Category',
        sortOrder: 0,
        isActive: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 44 });

      const result = await repository.create(newCategory);

      expect(result.sortOrder).toBe(0);
    });

    it('should use Date.now() when lastInsertId is null', async () => {
      const newCategory: Omit<Category, 'id'> = {
        name: 'Test Category',
        sortOrder: 1,
        isActive: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: null });

      const result = await repository.create(newCategory);

      expect(result.id).toBeGreaterThan(0);
      expect(typeof result.id).toBe('number');
    });

    it('should handle unique constraint violations', async () => {
      const newCategory: Omit<Category, 'id'> = {
        name: 'Duplicate Name',
        sortOrder: 1,
        isActive: true,
      };
      mockDb.execute.mockRejectedValue(new Error('UNIQUE constraint failed: category.name'));

      await expect(repository.create(newCategory)).rejects.toThrow('UNIQUE constraint failed');
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      const existingCategory: Category = {
        id: 1,
        name: 'Original Name',
        sortOrder: 5,
        isActive: true,
      };
      const updateData: Partial<Category> = {
        name: 'Updated Name',
        sortOrder: 10,
      };

      mockDb.select.mockResolvedValue([existingCategory]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, updateData);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE category SET name = ?, sortOrder = ?, isActive = ? WHERE id = ?',
        ['Updated Name', 10, 1, 1],
      );
      expect(result.name).toBe('Updated Name');
      expect(result.sortOrder).toBe(10);
    });

    it('should update isActive status', async () => {
      const existingCategory: Category = {
        id: 1,
        name: 'Test Category',
        sortOrder: 5,
        isActive: true,
      };

      mockDb.select.mockResolvedValue([existingCategory]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { isActive: false });

      expect(mockDb.execute).toHaveBeenCalledWith(expect.any(String), ['Test Category', 5, 0, 1]);
      expect(result.isActive).toBe(false);
    });

    it('should update only sortOrder', async () => {
      const existingCategory: Category = {
        id: 1,
        name: 'Test Category',
        sortOrder: 5,
        isActive: true,
      };

      mockDb.select.mockResolvedValue([existingCategory]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { sortOrder: 1 });

      expect(result.name).toBe('Test Category'); // Unchanged
      expect(result.sortOrder).toBe(1); // Updated
      expect(result.isActive).toBe(true); // Unchanged
    });

    it('should throw error when category not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(repository.update(999, { name: 'New Name' })).rejects.toThrow(
        'Category with id 999 not found',
      );
    });

    it('should handle partial updates correctly', async () => {
      const existingCategory: Category = {
        id: 1,
        name: 'Original Name',
        sortOrder: 5,
        isActive: true,
      };

      mockDb.select.mockResolvedValue([existingCategory]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.sortOrder).toBe(5); // Unchanged
    });
  });

  describe('delete', () => {
    it('should delete a category by id', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.delete(1);

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM category WHERE id = ?', [1]);
    });

    it('should not throw error when deleting non-existent category', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.delete(999)).resolves.not.toThrow();
    });

    it('should handle foreign key constraints', async () => {
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.delete(1)).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('count', () => {
    it('should return total number of categories', async () => {
      mockDb.select.mockResolvedValue([{ count: 8 }]);

      const result = await repository.count();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM category');
      expect(result).toBe(8);
    });

    it('should return 0 when no categories exist', async () => {
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
        name: "'; DROP TABLE category; --",
        sortOrder: 1,
        isActive: true,
      });

      // First call is table creation, second is INSERT
      const insertCall = mockDb.execute.mock.calls[1];
      expect(insertCall[0]).toContain('?');
      expect(insertCall[1]).toContain("'; DROP TABLE category; --");
    });
  });

  describe('Edge Cases', () => {
    it('should handle categories with empty names', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: '',
        sortOrder: 1,
        isActive: true,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['', 1, 1]),
      );
    });

    it('should handle categories with very long names', async () => {
      const longName = 'A'.repeat(1000);
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: longName,
        sortOrder: 1,
        isActive: true,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longName]),
      );
    });

    it('should handle special characters in category name', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: 'Category & <Special> "Characters"',
        sortOrder: 1,
        isActive: true,
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['Category & <Special> "Characters"']),
      );
    });

    it('should handle negative sortOrder', async () => {
      const newCategory: Omit<Category, 'id'> = {
        name: 'Negative Order',
        sortOrder: -5,
        isActive: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newCategory);

      expect(result.sortOrder).toBe(-5);
    });

    it('should handle very large sortOrder values', async () => {
      const newCategory: Omit<Category, 'id'> = {
        name: 'Large Order',
        sortOrder: 999999,
        isActive: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newCategory);

      expect(result.sortOrder).toBe(999999);
    });
  });

  describe('Sorting', () => {
    it('should return categories in correct sort order', async () => {
      const mockCategories: Category[] = [
        { id: 3, name: 'First', sortOrder: 1, isActive: true },
        { id: 1, name: 'Second', sortOrder: 2, isActive: true },
        { id: 2, name: 'Third', sortOrder: 3, isActive: true },
      ];
      mockDb.select.mockResolvedValue(mockCategories);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith(expect.stringContaining('ORDER BY sortOrder'));
      expect(result[0].sortOrder).toBeLessThanOrEqual(result[1].sortOrder);
    });
  });
});
