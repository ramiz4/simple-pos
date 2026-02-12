import { TestBed } from '@angular/core/testing';
import { Product } from '@simple-pos/shared/types';
import Database from '@tauri-apps/plugin-sql';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { SQLiteProductRepository } from './sqlite-product.repository';

// Mock the Database module
vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

describe('SQLiteProductRepository', () => {
  let repository: SQLiteProductRepository;
  let mockDb: { select: Mock; execute: Mock };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      select: vi.fn(),
      execute: vi.fn(),
    };

    vi.mocked(Database.load).mockResolvedValue(mockDb as unknown as Database);

    TestBed.configureTestingModule({
      providers: [SQLiteProductRepository],
    });

    repository = TestBed.inject(SQLiteProductRepository);
  });

  describe('Database Initialization', () => {
    it('should initialize database and create product table', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();

      expect(Database.load).toHaveBeenCalledWith('sqlite:simple-pos.db');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS product'),
      );
    });

    it('should reuse database connection', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findAll();
      await repository.findAll();

      expect(Database.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const mockProduct: Product = {
        id: 1,
        name: 'Pizza Margherita',
        categoryId: 1,
        price: 12.99,
        stock: 50,
        isAvailable: true,
      };
      mockDb.select.mockResolvedValue([mockProduct]);

      const result = await repository.findById(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM product WHERE id = ?', [1]);
      expect(result).toEqual(mockProduct);
    });

    it('should return null when product not found', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockDb.select.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Pizza Margherita',
          categoryId: 1,
          price: 12.99,
          stock: 50,
          isAvailable: true,
        },
        {
          id: 2,
          name: 'Pasta Carbonara',
          categoryId: 2,
          price: 14.99,
          stock: 30,
          isAvailable: true,
        },
      ];
      mockDb.select.mockResolvedValue(mockProducts);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM product');
      expect(result).toEqual(mockProducts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no products exist', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByCategory', () => {
    it('should return products for specific category', async () => {
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Pizza Margherita',
          categoryId: 1,
          price: 12.99,
          stock: 50,
          isAvailable: true,
        },
        {
          id: 2,
          name: 'Pizza Pepperoni',
          categoryId: 1,
          price: 13.99,
          stock: 40,
          isAvailable: true,
        },
      ];
      mockDb.select.mockResolvedValue(mockProducts);

      const result = await repository.findByCategory(1);

      expect(mockDb.select).toHaveBeenCalledWith('SELECT * FROM product WHERE categoryId = ?', [1]);
      expect(result).toEqual(mockProducts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when category has no products', async () => {
      mockDb.select.mockResolvedValue([]);

      const result = await repository.findByCategory(999);

      expect(result).toEqual([]);
    });

    it('should use parameterized query', async () => {
      mockDb.select.mockResolvedValue([]);

      await repository.findByCategory(5);

      const call = mockDb.select.mock.calls[0];
      expect(call[0]).toContain('?');
      expect(call[1]).toEqual([5]);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Pizza Margherita',
        categoryId: 1,
        price: 12.99,
        stock: 50,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

      const result = await repository.create(newProduct);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO product (name, categoryId, price, stock, isAvailable) VALUES (?, ?, ?, ?, ?)',
        ['Pizza Margherita', 1, 12.99, 50, 1],
      );
      expect(result).toEqual({ ...newProduct, id: 42 });
    });

    it('should create product with isAvailable false', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Sold Out Item',
        categoryId: 1,
        price: 9.99,
        stock: 0,
        isAvailable: false,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 43 });

      const result = await repository.create(newProduct);

      expect(mockDb.execute).toHaveBeenCalledWith(expect.any(String), [
        'Sold Out Item',
        1,
        9.99,
        0,
        0,
      ]);
      expect(result.isAvailable).toBe(false);
    });

    it('should create product with zero stock', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'New Product',
        categoryId: 1,
        price: 15.99,
        stock: 0,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 44 });

      const result = await repository.create(newProduct);

      expect(result.stock).toBe(0);
    });

    it('should use Date.now() when lastInsertId is null', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Test Product',
        categoryId: 1,
        price: 10.99,
        stock: 10,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: null });

      const result = await repository.create(newProduct);

      expect(result.id).toBeGreaterThan(0);
      expect(typeof result.id).toBe('number');
    });

    it('should handle constraint violations', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Duplicate Product',
        categoryId: 1,
        price: 10.99,
        stock: 10,
        isAvailable: true,
      };
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.create(newProduct)).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('update', () => {
    it('should update an existing product', async () => {
      const existingProduct: Product = {
        id: 1,
        name: 'Original Name',
        categoryId: 1,
        price: 10.99,
        stock: 50,
        isAvailable: true,
      };
      const updateData: Partial<Product> = {
        name: 'Updated Name',
        price: 12.99,
      };

      mockDb.select.mockResolvedValue([existingProduct]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, updateData);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE product SET name = ?, categoryId = ?, price = ?, stock = ?, isAvailable = ? WHERE id = ?',
        ['Updated Name', 1, 12.99, 50, 1, 1],
      );
      expect(result.name).toBe('Updated Name');
      expect(result.price).toBe(12.99);
      expect(result.stock).toBe(50); // Unchanged
    });

    it('should update product availability', async () => {
      const existingProduct: Product = {
        id: 1,
        name: 'Test Product',
        categoryId: 1,
        price: 10.99,
        stock: 50,
        isAvailable: true,
      };

      mockDb.select.mockResolvedValue([existingProduct]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { isAvailable: false });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([0]), // isAvailable = false -> 0
      );
      expect(result.isAvailable).toBe(false);
    });

    it('should update stock quantity', async () => {
      const existingProduct: Product = {
        id: 1,
        name: 'Test Product',
        categoryId: 1,
        price: 10.99,
        stock: 50,
        isAvailable: true,
      };

      mockDb.select.mockResolvedValue([existingProduct]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { stock: 25 });

      expect(result.stock).toBe(25);
    });

    it('should throw error when product not found', async () => {
      mockDb.select.mockResolvedValue([]);

      await expect(repository.update(999, { name: 'New Name' })).rejects.toThrow(
        'Product with id 999 not found',
      );
    });

    it('should handle partial updates correctly', async () => {
      const existingProduct: Product = {
        id: 1,
        name: 'Original Name',
        categoryId: 1,
        price: 10.99,
        stock: 50,
        isAvailable: true,
      };

      mockDb.select.mockResolvedValue([existingProduct]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { price: 15.99 });

      expect(result.name).toBe('Original Name'); // Unchanged
      expect(result.price).toBe(15.99); // Updated
      expect(result.categoryId).toBe(1); // Unchanged
    });

    it('should update category', async () => {
      const existingProduct: Product = {
        id: 1,
        name: 'Test Product',
        categoryId: 1,
        price: 10.99,
        stock: 50,
        isAvailable: true,
      };

      mockDb.select.mockResolvedValue([existingProduct]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { categoryId: 2 });

      expect(result.categoryId).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete a product by id', async () => {
      mockDb.execute.mockResolvedValue({});

      await repository.delete(1);

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM product WHERE id = ?', [1]);
    });

    it('should not throw error when deleting non-existent product', async () => {
      mockDb.execute.mockResolvedValue({});

      await expect(repository.delete(999)).resolves.not.toThrow();
    });

    it('should handle foreign key constraints', async () => {
      mockDb.execute.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(repository.delete(1)).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('count', () => {
    it('should return total number of products', async () => {
      mockDb.select.mockResolvedValue([{ count: 25 }]);

      const result = await repository.count();

      expect(mockDb.select).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM product');
      expect(result).toBe(25);
    });

    it('should return 0 when no products exist', async () => {
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
        name: "'; DROP TABLE product; --",
        categoryId: 1,
        price: 10.99,
        stock: 10,
        isAvailable: true,
      });

      // First call is table creation, second is INSERT
      const insertCall = mockDb.execute.mock.calls[1];
      expect(insertCall[0]).toContain('?');
      expect(insertCall[1]).toContain("'; DROP TABLE product; --");
    });

    it('should use parameterized queries for update', async () => {
      const existingProduct: Product = {
        id: 1,
        name: 'Test',
        categoryId: 1,
        price: 10,
        stock: 10,
        isAvailable: true,
      };
      mockDb.select.mockResolvedValue([existingProduct]);
      mockDb.execute.mockResolvedValue({});

      await repository.update(1, { name: "'; DELETE FROM product; --" });

      // First call is table creation, second is UPDATE
      const updateCall = mockDb.execute.mock.calls[1];
      expect(updateCall[0]).toContain('?');
    });
  });

  describe('Edge Cases', () => {
    it('should handle products with zero price', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Free Item',
        categoryId: 1,
        price: 0,
        stock: 100,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newProduct);

      expect(result.price).toBe(0);
    });

    it('should handle products with decimal prices', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Premium Item',
        categoryId: 1,
        price: 99.99,
        stock: 10,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newProduct);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([99.99]),
      );
    });

    it('should handle products with very large stock numbers', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Bulk Item',
        categoryId: 1,
        price: 1.99,
        stock: 999999,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      const result = await repository.create(newProduct);

      expect(result.stock).toBe(999999);
    });

    it('should handle products with negative stock (for tracking)', async () => {
      const existingProduct: Product = {
        id: 1,
        name: 'Test Product',
        categoryId: 1,
        price: 10.99,
        stock: 10,
        isAvailable: true,
      };

      mockDb.select.mockResolvedValue([existingProduct]);
      mockDb.execute.mockResolvedValue({});

      const result = await repository.update(1, { stock: -5 });

      expect(result.stock).toBe(-5);
    });

    it('should handle products with empty names', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: '',
        categoryId: 1,
        price: 10.99,
        stock: 10,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newProduct);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['', 1, 10.99, 10, 1]),
      );
    });

    it('should handle products with very long names', async () => {
      const longName = 'A'.repeat(1000);
      const newProduct: Omit<Product, 'id'> = {
        name: longName,
        categoryId: 1,
        price: 10.99,
        stock: 10,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newProduct);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([longName]),
      );
    });

    it('should handle products with special characters in name', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Café "Deluxe" & <Special>',
        categoryId: 1,
        price: 12.99,
        stock: 20,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newProduct);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['Café "Deluxe" & <Special>']),
      );
    });

    it('should handle high precision decimal prices', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Precise Item',
        categoryId: 1,
        price: 123.456789,
        stock: 10,
        isAvailable: true,
      };
      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });

      await repository.create(newProduct);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([123.456789]),
      );
    });
  });
});
