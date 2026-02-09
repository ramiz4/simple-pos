import { TestBed } from '@angular/core/testing';
import { Ingredient } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SQLiteIngredientRepository } from './sqlite-ingredient.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteIngredientRepository', () => {
  let repository: SQLiteIngredientRepository;
  let mockDb: Record<string, vi.Mock>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    vi.mocked(Database.load).mockResolvedValue(mockDb as unknown as Database);

    TestBed.configureTestingModule({
      providers: [SQLiteIngredientRepository],
    });

    repository = TestBed.inject(SQLiteIngredientRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create ingredient table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS ingredient'),
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
    it('should return ingredient when found', async () => {
      const mockIngredient: Ingredient = {
        id: 1,
        name: 'Flour',
        stockQuantity: 50.5,
        unit: 'kg',
      };
      mockDb.select.mockResolvedValue([mockIngredient]);

      const result = await repository.findById(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM ingredient WHERE id = ?', [1]);
      expect(result).toEqual(mockIngredient);
    });

    it('should return null when ingredient not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all ingredients', async () => {
      const mockIngredients: Ingredient[] = [
        { id: 1, name: 'Flour', stockQuantity: 50.5, unit: 'kg' },
        { id: 2, name: 'Sugar', stockQuantity: 25.0, unit: 'kg' },
        { id: 3, name: 'Salt', stockQuantity: 10.0, unit: 'kg' },
      ];
      mockDb.select.mockResolvedValue(mockIngredients);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM ingredient');
      expect(result).toEqual(mockIngredients);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no ingredients exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new ingredient', async () => {
      const newIngredient: Omit<Ingredient, 'id'> = {
        name: 'Tomato',
        stockQuantity: 100.5,
        unit: 'kg',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

      const result = await repository.create(newIngredient);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO ingredient (name, stockQuantity, unit) VALUES (?, ?, ?)',
        ['Tomato', 100.5, 'kg'],
      );
      expect(result).toEqual({ ...newIngredient, id: 42 });
    });

    it('should create ingredient with zero stock', async () => {
      const newIngredient: Omit<Ingredient, 'id'> = {
        name: 'New Ingredient',
        stockQuantity: 0,
        unit: 'pieces',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 43 });

      const result = await repository.create(newIngredient);

      expect(result.stockQuantity).toBe(0);
    });

    it('should create ingredient with decimal stock quantity', async () => {
      const newIngredient: Omit<Ingredient, 'id'> = {
        name: 'Olive Oil',
        stockQuantity: 5.75,
        unit: 'liters',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 44 });

      const result = await repository.create(newIngredient);

      expect(result.stockQuantity).toBe(5.75);
    });

    it('should use Date.now() when lastInsertId is null', async () => {
      const newIngredient: Omit<Ingredient, 'id'> = {
        name: 'Test Ingredient',
        stockQuantity: 10,
        unit: 'kg',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: null });

      const result = await repository.create(newIngredient);

      expect(result.id).toBeGreaterThan(0);
      expect(typeof result.id).toBe('number');
    });

    it('should handle unique constraint violations', async () => {
      const newIngredient: Omit<Ingredient, 'id'> = {
        name: 'Duplicate Name',
        stockQuantity: 10,
        unit: 'kg',
      };
      mockDb.execute.mockRejectedValue(new Error('UNIQUE constraint failed: ingredient.name'));

      await expect(repository.create(newIngredient)).rejects.toThrow('UNIQUE constraint failed');
    });
  });

  describe('update', () => {
    it('should update an existing ingredient', async () => {
      const existingIngredient: Ingredient = {
        id: 1,
        name: 'Original Name',
        stockQuantity: 50,
        unit: 'kg',
      };
      const updateData: Partial<Ingredient> = {
        name: 'Updated Name',
        stockQuantity: 75.5,
      };

      mockDb.select.mockResolvedValue([existingIngredient]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, updateData);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE ingredient SET name = ?, stockQuantity = ?, unit = ? WHERE id = ?',
        ['Updated Name', 75.5, 'kg', 1],
      );
      expect(result.name).toBe('Updated Name');
      expect(result.stockQuantity).toBe(75.5);
    });

    it('should update stock quantity only', async () => {
      const existingIngredient: Ingredient = {
        id: 1,
        name: 'Flour',
        stockQuantity: 50,
        unit: 'kg',
      };

      mockDb.select.mockResolvedValue([existingIngredient]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { stockQuantity: 25 });

      expect(result.name).toBe('Flour'); // Unchanged
      expect(result.stockQuantity).toBe(25); // Updated
      expect(result.unit).toBe('kg'); // Unchanged
    });

    it('should update unit only', async () => {
      const existingIngredient: Ingredient = {
        id: 1,
        name: 'Flour',
        stockQuantity: 50,
        unit: 'kg',
      };

      mockDb.select.mockResolvedValue([existingIngredient]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { unit: 'grams' });

      expect(result.unit).toBe('grams');
      expect(result.stockQuantity).toBe(50); // Unchanged
    });

    it('should throw error when ingredient not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(repository.update(999, { name: 'New Name' })).rejects.toThrow(
        'Ingredient with id 999 not found',
      );
    });

    it('should handle partial updates correctly', async () => {
      const existingIngredient: Ingredient = {
        id: 1,
        name: 'Original Name',
        stockQuantity: 50,
        unit: 'kg',
      };

      mockDb.select.mockResolvedValue([existingIngredient]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { stockQuantity: 100 });

      expect(result.name).toBe('Original Name'); // Unchanged
      expect(result.stockQuantity).toBe(100); // Updated
    });
  });

  describe('delete', () => {
    it('should delete an ingredient by id', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.delete(1);

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM ingredient WHERE id = ?', [1]);
    });

    it('should not throw error when deleting non-existent ingredient', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.delete(999)).resolves.not.toThrow();
    });

    it('should handle foreign key constraints', async () => {
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.delete(1)).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('count', () => {
    it('should return total number of ingredients', async () => {
      mockDb.select.mockResolvedValue([{ count: 12 }]);

      const result = await repository.count();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM ingredient');
      expect(result).toBe(12);
    });

    it('should return 0 when no ingredients exist', async () => {
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
        name: "'; DROP TABLE ingredient; --",
        stockQuantity: 10,
        unit: 'kg',
      });

      // First call is table creation, second is INSERT
      const insertCall = mockDb.execute.mock.calls[1];
      expect(insertCall[0]).toContain('?');
      expect(insertCall[1]).toContain("'; DROP TABLE ingredient; --");
    });
  });

  describe('Edge Cases', () => {
    it('should handle ingredients with empty names', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: '',
        stockQuantity: 10,
        unit: 'kg',
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['', 10, 'kg']),
      );
    });

    it('should handle ingredients with very long names', async () => {
      const longName = 'A'.repeat(1000);
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: longName,
        stockQuantity: 10,
        unit: 'kg',
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longName]),
      );
    });

    it('should handle special characters in ingredient name', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: 'Ingredient & <Special> "Characters"',
        stockQuantity: 10,
        unit: 'kg',
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['Ingredient & <Special> "Characters"']),
      );
    });

    it('should handle negative stock quantities', async () => {
      const existingIngredient: Ingredient = {
        id: 1,
        name: 'Flour',
        stockQuantity: 50,
        unit: 'kg',
      };

      mockDb.select.mockResolvedValue([existingIngredient]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { stockQuantity: -5 });

      expect(result.stockQuantity).toBe(-5);
    });

    it('should handle very large stock quantities', async () => {
      const newIngredient: Omit<Ingredient, 'id'> = {
        name: 'Bulk Item',
        stockQuantity: 999999.99,
        unit: 'kg',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newIngredient);

      expect(result.stockQuantity).toBe(999999.99);
    });

    it('should handle high precision decimal values', async () => {
      const newIngredient: Omit<Ingredient, 'id'> = {
        name: 'Precise Ingredient',
        stockQuantity: 123.456789,
        unit: 'kg',
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newIngredient);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([123.456789]),
      );
    });

    it('should handle different unit types', async () => {
      const units = ['kg', 'g', 'liters', 'ml', 'pieces', 'oz', 'lbs'];

      for (const unit of units) {
        mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

        await repository.create({
          name: `Ingredient ${unit}`,
          stockQuantity: 10,
          unit: unit,
        });

        expect(mockDb.execute).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([unit]),
        );
      }
    });

    it('should handle empty unit strings', async () => {
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create({
        name: 'No Unit',
        stockQuantity: 10,
        unit: '',
      });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['', 10, '']),
      );
    });
  });
});
