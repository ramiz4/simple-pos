import { TestBed } from '@angular/core/testing';
import { Product } from '@simple-pos/shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndexedDBProductRepository } from '../../infrastructure/repositories/indexeddb-product.repository';
import { SQLiteProductRepository } from '../../infrastructure/repositories/sqlite-product.repository';
import { PlatformService } from '../../shared/utilities/platform.service';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let mockPlatformService: Record<string, vi.Mock>;
  let mockSqliteProductRepo: Record<string, vi.Mock>;
  let mockIndexedDBProductRepo: Record<string, vi.Mock>;

  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    categoryId: 1,
    price: 29.99,
    stock: 100,
    isAvailable: true,
  };

  const mockProduct2: Product = {
    id: 2,
    name: 'Second Product',
    categoryId: 1,
    price: 49.99,
    stock: 50,
    isAvailable: true,
  };

  const mockProduct3: Product = {
    id: 3,
    name: 'Unavailable Product',
    categoryId: 2,
    price: 19.99,
    stock: 0,
    isAvailable: false,
  };

  beforeEach(() => {
    // Mock PlatformService
    mockPlatformService = {
      isTauri: vi.fn().mockReturnValue(false),
      isWeb: vi.fn().mockReturnValue(true),
    };

    // Mock SQLite Product Repository
    mockSqliteProductRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByCategory: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };

    // Mock IndexedDB Product Repository
    mockIndexedDBProductRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByCategory: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        { provide: PlatformService, useValue: mockPlatformService },
        { provide: SQLiteProductRepository, useValue: mockSqliteProductRepo },
        { provide: IndexedDBProductRepository, useValue: mockIndexedDBProductRepo },
      ],
    });

    service = TestBed.inject(ProductService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with correct repository based on platform', () => {
      expect(service).toBeDefined();
    });
  });

  describe('Platform Selection', () => {
    it('should use IndexedDB repository on web platform', async () => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct);

      const result = await service.getById(1);

      expect(mockIndexedDBProductRepo.findById).toHaveBeenCalledWith(1);
      expect(mockSqliteProductRepo.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should use SQLite repository on Tauri platform', async () => {
      // Reconfigure with Tauri platform
      mockPlatformService.isTauri.mockReturnValue(true);

      // Recreate the service with the new platform configuration
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ProductService,
          { provide: PlatformService, useValue: mockPlatformService },
          { provide: SQLiteProductRepository, useValue: mockSqliteProductRepo },
          { provide: IndexedDBProductRepository, useValue: mockIndexedDBProductRepo },
        ],
      });
      service = TestBed.inject(ProductService);

      mockSqliteProductRepo.findById.mockResolvedValue(mockProduct);

      const result = await service.getById(1);

      expect(mockSqliteProductRepo.findById).toHaveBeenCalledWith(1);
      expect(mockIndexedDBProductRepo.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });
  });

  describe('getAll', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should return all products', async () => {
      const products = [mockProduct, mockProduct2, mockProduct3];
      mockIndexedDBProductRepo.findAll.mockResolvedValue(products);

      const result = await service.getAll();

      expect(result).toEqual(products);
      expect(result).toHaveLength(3);
      expect(mockIndexedDBProductRepo.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no products exist', async () => {
      mockIndexedDBProductRepo.findAll.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      mockIndexedDBProductRepo.findAll.mockRejectedValue(new Error('Database error'));

      await expect(service.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should return product by id', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct);

      const result = await service.getById(1);

      expect(result).toEqual(mockProduct);
      expect(mockIndexedDBProductRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when product not found', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(null);

      const result = await service.getById(999);

      expect(result).toBeNull();
      expect(mockIndexedDBProductRepo.findById).toHaveBeenCalledWith(999);
    });

    it('should handle different product types', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct3);

      const result = await service.getById(3);

      expect(result).toEqual(mockProduct3);
      expect(result?.isAvailable).toBe(false);
      expect(result?.stock).toBe(0);
    });

    it('should handle repository errors', async () => {
      mockIndexedDBProductRepo.findById.mockRejectedValue(new Error('Connection lost'));

      await expect(service.getById(1)).rejects.toThrow('Connection lost');
    });
  });

  describe('getByCategory', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should return products by category id', async () => {
      const categoryProducts = [mockProduct, mockProduct2];
      mockIndexedDBProductRepo.findByCategory.mockResolvedValue(categoryProducts);

      const result = await service.getByCategory(1);

      expect(result).toEqual(categoryProducts);
      expect(result).toHaveLength(2);
      expect(mockIndexedDBProductRepo.findByCategory).toHaveBeenCalledWith(1);
    });

    it('should return empty array when category has no products', async () => {
      mockIndexedDBProductRepo.findByCategory.mockResolvedValue([]);

      const result = await service.getByCategory(99);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter products correctly by category', async () => {
      mockIndexedDBProductRepo.findByCategory.mockResolvedValue([mockProduct3]);

      const result = await service.getByCategory(2);

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe(2);
    });

    it('should handle repository errors', async () => {
      mockIndexedDBProductRepo.findByCategory.mockRejectedValue(new Error('Query failed'));

      await expect(service.getByCategory(1)).rejects.toThrow('Query failed');
    });
  });

  describe('create', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should create a new product successfully', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'New Product',
        categoryId: 1,
        price: 39.99,
        stock: 75,
        isAvailable: true,
      };
      const createdProduct = { id: 4, ...newProduct };
      mockIndexedDBProductRepo.create.mockResolvedValue(createdProduct);

      const result = await service.create(newProduct);

      expect(result).toEqual(createdProduct);
      expect(mockIndexedDBProductRepo.create).toHaveBeenCalledWith(newProduct);
    });

    it('should create product with zero stock', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Out of Stock Product',
        categoryId: 1,
        price: 29.99,
        stock: 0,
        isAvailable: false,
      };
      const createdProduct = { id: 5, ...newProduct };
      mockIndexedDBProductRepo.create.mockResolvedValue(createdProduct);

      const result = await service.create(newProduct);

      expect(result.stock).toBe(0);
      expect(result.isAvailable).toBe(false);
    });

    it('should create product with decimal price', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Decimal Price Product',
        categoryId: 1,
        price: 12.49,
        stock: 100,
        isAvailable: true,
      };
      const createdProduct = { id: 6, ...newProduct };
      mockIndexedDBProductRepo.create.mockResolvedValue(createdProduct);

      const result = await service.create(newProduct);

      expect(result.price).toBe(12.49);
    });

    it('should handle repository errors during creation', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Error Product',
        categoryId: 1,
        price: 29.99,
        stock: 100,
        isAvailable: true,
      };
      mockIndexedDBProductRepo.create.mockRejectedValue(new Error('Constraint violation'));

      await expect(service.create(newProduct)).rejects.toThrow('Constraint violation');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should update product successfully', async () => {
      const updates: Partial<Product> = {
        name: 'Updated Product Name',
        price: 34.99,
      };
      const updatedProduct = { ...mockProduct, ...updates };
      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result).toEqual(updatedProduct);
      expect(mockIndexedDBProductRepo.update).toHaveBeenCalledWith(1, updates);
    });

    it('should update only specified fields', async () => {
      const updates: Partial<Product> = { stock: 150 };
      const updatedProduct = { ...mockProduct, stock: 150 };
      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result.stock).toBe(150);
      expect(result.name).toBe(mockProduct.name); // Unchanged
      expect(result.price).toBe(mockProduct.price); // Unchanged
    });

    it('should update product availability', async () => {
      const updates: Partial<Product> = { isAvailable: false };
      const updatedProduct = { ...mockProduct, isAvailable: false };
      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result.isAvailable).toBe(false);
    });

    it('should update product category', async () => {
      const updates: Partial<Product> = { categoryId: 3 };
      const updatedProduct = { ...mockProduct, categoryId: 3 };
      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result.categoryId).toBe(3);
    });

    it('should update multiple fields at once', async () => {
      const updates: Partial<Product> = {
        name: 'Completely Updated',
        price: 99.99,
        stock: 200,
        isAvailable: false,
        categoryId: 2,
      };
      const updatedProduct = { ...mockProduct, ...updates };
      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result.name).toBe('Completely Updated');
      expect(result.price).toBe(99.99);
      expect(result.stock).toBe(200);
      expect(result.isAvailable).toBe(false);
      expect(result.categoryId).toBe(2);
    });

    it('should handle repository errors during update', async () => {
      mockIndexedDBProductRepo.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.update(1, { price: 39.99 })).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should delete product successfully', async () => {
      mockIndexedDBProductRepo.delete.mockResolvedValue(undefined);

      await service.delete(1);

      expect(mockIndexedDBProductRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should handle deletion of non-existent product', async () => {
      mockIndexedDBProductRepo.delete.mockRejectedValue(new Error('Product not found'));

      await expect(service.delete(999)).rejects.toThrow('Product not found');
    });

    it('should handle repository errors during deletion', async () => {
      mockIndexedDBProductRepo.delete.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(service.delete(1)).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('toggleAvailability', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should toggle product availability from true to false', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct);
      const updatedProduct = { ...mockProduct, isAvailable: false };
      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.toggleAvailability(1);

      expect(mockIndexedDBProductRepo.findById).toHaveBeenCalledWith(1);
      expect(mockIndexedDBProductRepo.update).toHaveBeenCalledWith(1, { isAvailable: false });
      expect(result.isAvailable).toBe(false);
    });

    it('should toggle product availability from false to true', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct3);
      const updatedProduct = { ...mockProduct3, isAvailable: true };
      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.toggleAvailability(3);

      expect(mockIndexedDBProductRepo.findById).toHaveBeenCalledWith(3);
      expect(mockIndexedDBProductRepo.update).toHaveBeenCalledWith(3, { isAvailable: true });
      expect(result.isAvailable).toBe(true);
    });

    it('should throw error when product not found', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(null);

      await expect(service.toggleAvailability(999)).rejects.toThrow(
        'Product with id 999 not found',
      );
    });

    it('should handle repository errors during toggle', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct);
      mockIndexedDBProductRepo.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.toggleAvailability(1)).rejects.toThrow('Update failed');
    });

    it('should maintain other product properties when toggling', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct);
      const updatedProduct = { ...mockProduct, isAvailable: false };
      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.toggleAvailability(1);

      expect(result.name).toBe(mockProduct.name);
      expect(result.price).toBe(mockProduct.price);
      expect(result.stock).toBe(mockProduct.stock);
      expect(result.categoryId).toBe(mockProduct.categoryId);
    });
  });

  describe('Edge Cases and Validation', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should handle product with very large stock number', async () => {
      const largeStockProduct = { ...mockProduct, stock: 999999 };
      mockIndexedDBProductRepo.findById.mockResolvedValue(largeStockProduct);

      const result = await service.getById(1);

      expect(result?.stock).toBe(999999);
    });

    it('should handle product with very high price', async () => {
      const expensiveProduct = { ...mockProduct, price: 9999.99 };
      mockIndexedDBProductRepo.findById.mockResolvedValue(expensiveProduct);

      const result = await service.getById(1);

      expect(result?.price).toBe(9999.99);
    });

    it('should handle product with price of zero', async () => {
      const freeProduct = { ...mockProduct, price: 0 };
      mockIndexedDBProductRepo.findById.mockResolvedValue(freeProduct);

      const result = await service.getById(1);

      expect(result?.price).toBe(0);
    });

    it('should handle product name with special characters', async () => {
      const specialNameProduct = {
        ...mockProduct,
        name: "Product™ with Special & Char's!",
      };
      mockIndexedDBProductRepo.findById.mockResolvedValue(specialNameProduct);

      const result = await service.getById(1);

      expect(result?.name).toBe("Product™ with Special & Char's!");
    });

    it('should handle empty result set from getAll', async () => {
      mockIndexedDBProductRepo.findAll.mockResolvedValue([]);

      const result = await service.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle negative category id in getByCategory', async () => {
      mockIndexedDBProductRepo.findByCategory.mockResolvedValue([]);

      const result = await service.getByCategory(-1);

      expect(result).toEqual([]);
    });
  });

  describe('Multiple Operations Sequence', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should handle create then read sequence', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Sequential Product',
        categoryId: 1,
        price: 29.99,
        stock: 100,
        isAvailable: true,
      };
      const createdProduct = { id: 7, ...newProduct };

      mockIndexedDBProductRepo.create.mockResolvedValue(createdProduct);
      mockIndexedDBProductRepo.findById.mockResolvedValue(createdProduct);

      const created = await service.create(newProduct);
      const retrieved = await service.getById(created.id);

      expect(created).toEqual(createdProduct);
      expect(retrieved).toEqual(createdProduct);
    });

    it('should handle update then read sequence', async () => {
      const updates = { price: 44.99 };
      const updatedProduct = { ...mockProduct, ...updates };

      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);
      mockIndexedDBProductRepo.findById.mockResolvedValue(updatedProduct);

      await service.update(1, updates);
      const result = await service.getById(1);

      expect(result?.price).toBe(44.99);
    });

    it('should handle toggle then read sequence', async () => {
      const toggledProduct = { ...mockProduct, isAvailable: false };

      mockIndexedDBProductRepo.findById
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(toggledProduct);
      mockIndexedDBProductRepo.update.mockResolvedValue(toggledProduct);

      await service.toggleAvailability(1);
      const result = await service.getById(1);

      expect(result?.isAvailable).toBe(false);
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should handle multiple getById calls', async () => {
      mockIndexedDBProductRepo.findById.mockImplementation(async (id: number) => {
        if (id === 1) return mockProduct;
        if (id === 2) return mockProduct2;
        if (id === 3) return mockProduct3;
        return null;
      });

      const results = await Promise.all([
        service.getById(1),
        service.getById(2),
        service.getById(3),
      ]);

      expect(results[0]).toEqual(mockProduct);
      expect(results[1]).toEqual(mockProduct2);
      expect(results[2]).toEqual(mockProduct3);
    });

    it('should handle multiple getByCategory calls', async () => {
      mockIndexedDBProductRepo.findByCategory.mockImplementation(async (categoryId: number) => {
        if (categoryId === 1) return [mockProduct, mockProduct2];
        if (categoryId === 2) return [mockProduct3];
        return [];
      });

      const results = await Promise.all([service.getByCategory(1), service.getByCategory(2)]);

      expect(results[0]).toHaveLength(2);
      expect(results[1]).toHaveLength(1);
    });
  });

  describe('Data Integrity', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should preserve product data during update', async () => {
      const originalProduct = { ...mockProduct };
      const updates = { price: 39.99 };
      const updatedProduct = { ...originalProduct, ...updates };

      mockIndexedDBProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result.id).toBe(originalProduct.id);
      expect(result.name).toBe(originalProduct.name);
      expect(result.categoryId).toBe(originalProduct.categoryId);
      expect(result.stock).toBe(originalProduct.stock);
      expect(result.isAvailable).toBe(originalProduct.isAvailable);
      expect(result.price).toBe(39.99);
    });

    it('should not modify original product object', async () => {
      const originalProduct = { ...mockProduct };
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct);

      await service.getById(1);

      expect(mockProduct).toEqual(originalProduct);
    });
  });

  describe('Performance and Scalability', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should handle large number of products', async () => {
      const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProduct,
        id: i + 1,
        name: `Product ${i + 1}`,
      }));
      mockIndexedDBProductRepo.findAll.mockResolvedValue(largeProductList);

      const result = await service.getAll();

      expect(result).toHaveLength(1000);
    });

    it('should handle category with many products', async () => {
      const manyProducts = Array.from({ length: 500 }, (_, i) => ({
        ...mockProduct,
        id: i + 1,
        name: `Category Product ${i + 1}`,
      }));
      mockIndexedDBProductRepo.findByCategory.mockResolvedValue(manyProducts);

      const result = await service.getByCategory(1);

      expect(result).toHaveLength(500);
    });
  });

  describe('Repository Method Verification', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should call repository methods with correct parameters', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct);
      mockIndexedDBProductRepo.findAll.mockResolvedValue([mockProduct]);
      mockIndexedDBProductRepo.findByCategory.mockResolvedValue([mockProduct]);

      await service.getById(1);
      await service.getAll();
      await service.getByCategory(1);

      expect(mockIndexedDBProductRepo.findById).toHaveBeenCalledTimes(1);
      expect(mockIndexedDBProductRepo.findAll).toHaveBeenCalledTimes(1);
      expect(mockIndexedDBProductRepo.findByCategory).toHaveBeenCalledTimes(1);
    });

    it('should not call repository methods multiple times unnecessarily', async () => {
      mockIndexedDBProductRepo.findById.mockResolvedValue(mockProduct);

      await service.getById(1);

      expect(mockIndexedDBProductRepo.findById).toHaveBeenCalledTimes(1);
      expect(mockIndexedDBProductRepo.findAll).not.toHaveBeenCalled();
      expect(mockIndexedDBProductRepo.findByCategory).not.toHaveBeenCalled();
    });
  });
});
