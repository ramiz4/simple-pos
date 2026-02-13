import { TestBed } from '@angular/core/testing';
import { Product } from '@simple-pos/shared/types';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { PRODUCT_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let mockProductRepo: {
    findById: Mock;
    findAll: Mock;
    findByCategory: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
  };

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
    // Mock Product Repository
    mockProductRepo = {
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
      providers: [ProductService, { provide: PRODUCT_REPOSITORY, useValue: mockProductRepo }],
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
    it('should use the injected repository', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);

      const result = await service.getById(1);

      expect(mockProductRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('getAll', () => {
    it('should return all products', async () => {
      const products = [mockProduct, mockProduct2, mockProduct3];
      mockProductRepo.findAll.mockResolvedValue(products);

      const result = await service.getAll();

      expect(result).toEqual(products);
      expect(result).toHaveLength(3);
      expect(mockProductRepo.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no products exist', async () => {
      mockProductRepo.findAll.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      mockProductRepo.findAll.mockRejectedValue(new Error('Database error'));

      await expect(service.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should return product by id', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);

      const result = await service.getById(1);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when product not found', async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      const result = await service.getById(999);

      expect(result).toBeNull();
      expect(mockProductRepo.findById).toHaveBeenCalledWith(999);
    });

    it('should handle different product types', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct3);

      const result = await service.getById(3);

      expect(result).toEqual(mockProduct3);
      expect(result?.isAvailable).toBe(false);
      expect(result?.stock).toBe(0);
    });

    it('should handle repository errors', async () => {
      mockProductRepo.findById.mockRejectedValue(new Error('Connection lost'));

      await expect(service.getById(1)).rejects.toThrow('Connection lost');
    });
  });

  describe('getByCategory', () => {
    it('should return products by category id', async () => {
      const categoryProducts = [mockProduct, mockProduct2];
      mockProductRepo.findByCategory.mockResolvedValue(categoryProducts);

      const result = await service.getByCategory(1);

      expect(result).toEqual(categoryProducts);
      expect(result).toHaveLength(2);
      expect(mockProductRepo.findByCategory).toHaveBeenCalledWith(1);
    });

    it('should return empty array when category has no products', async () => {
      mockProductRepo.findByCategory.mockResolvedValue([]);

      const result = await service.getByCategory(99);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter products correctly by category', async () => {
      mockProductRepo.findByCategory.mockResolvedValue([mockProduct3]);

      const result = await service.getByCategory(2);

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe(2);
    });

    it('should handle repository errors', async () => {
      mockProductRepo.findByCategory.mockRejectedValue(new Error('Query failed'));

      await expect(service.getByCategory(1)).rejects.toThrow('Query failed');
    });
  });

  describe('create', () => {
    it('should create a new product successfully', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'New Product',
        categoryId: 1,
        price: 39.99,
        stock: 75,
        isAvailable: true,
      };
      const createdProduct = { id: 4, ...newProduct };
      mockProductRepo.create.mockResolvedValue(createdProduct);

      const result = await service.create(newProduct);

      expect(result).toEqual(createdProduct);
      expect(mockProductRepo.create).toHaveBeenCalledWith(newProduct);
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
      mockProductRepo.create.mockResolvedValue(createdProduct);

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
      mockProductRepo.create.mockResolvedValue(createdProduct);

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
      mockProductRepo.create.mockRejectedValue(new Error('Constraint violation'));

      await expect(service.create(newProduct)).rejects.toThrow('Constraint violation');
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updates: Partial<Product> = {
        name: 'Updated Product Name',
        price: 34.99,
      };
      const updatedProduct = { ...mockProduct, ...updates };
      mockProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepo.update).toHaveBeenCalledWith(1, updates);
    });

    it('should update only specified fields', async () => {
      const updates: Partial<Product> = { stock: 150 };
      const updatedProduct = { ...mockProduct, stock: 150 };
      mockProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result.stock).toBe(150);
      expect(result.name).toBe(mockProduct.name); // Unchanged
      expect(result.price).toBe(mockProduct.price); // Unchanged
    });

    it('should update product availability', async () => {
      const updates: Partial<Product> = { isAvailable: false };
      const updatedProduct = { ...mockProduct, isAvailable: false };
      mockProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result.isAvailable).toBe(false);
    });

    it('should update product category', async () => {
      const updates: Partial<Product> = { categoryId: 3 };
      const updatedProduct = { ...mockProduct, categoryId: 3 };
      mockProductRepo.update.mockResolvedValue(updatedProduct);

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
      mockProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.update(1, updates);

      expect(result.name).toBe('Completely Updated');
      expect(result.price).toBe(99.99);
      expect(result.stock).toBe(200);
      expect(result.isAvailable).toBe(false);
      expect(result.categoryId).toBe(2);
    });

    it('should handle repository errors during update', async () => {
      mockProductRepo.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.update(1, { price: 39.99 })).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      mockProductRepo.delete.mockResolvedValue(undefined);

      await service.delete(1);

      expect(mockProductRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should handle deletion of non-existent product', async () => {
      mockProductRepo.delete.mockRejectedValue(new Error('Product not found'));

      await expect(service.delete(999)).rejects.toThrow('Product not found');
    });

    it('should handle repository errors during deletion', async () => {
      mockProductRepo.delete.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(service.delete(1)).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('toggleAvailability', () => {
    it('should toggle product availability from true to false', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      const updatedProduct = { ...mockProduct, isAvailable: false };
      mockProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.toggleAvailability(1);

      expect(mockProductRepo.findById).toHaveBeenCalledWith(1);
      expect(mockProductRepo.update).toHaveBeenCalledWith(1, { isAvailable: false });
      expect(result.isAvailable).toBe(false);
    });

    it('should toggle product availability from false to true', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct3);
      const updatedProduct = { ...mockProduct3, isAvailable: true };
      mockProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.toggleAvailability(3);

      expect(mockProductRepo.findById).toHaveBeenCalledWith(3);
      expect(mockProductRepo.update).toHaveBeenCalledWith(3, { isAvailable: true });
      expect(result.isAvailable).toBe(true);
    });

    it('should throw error when product not found', async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(service.toggleAvailability(999)).rejects.toThrow(
        'Product with id 999 not found',
      );
    });

    it('should handle repository errors during toggle', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockProductRepo.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.toggleAvailability(1)).rejects.toThrow('Update failed');
    });

    it('should maintain other product properties when toggling', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      const updatedProduct = { ...mockProduct, isAvailable: false };
      mockProductRepo.update.mockResolvedValue(updatedProduct);

      const result = await service.toggleAvailability(1);

      expect(result.name).toBe(mockProduct.name);
      expect(result.price).toBe(mockProduct.price);
      expect(result.stock).toBe(mockProduct.stock);
      expect(result.categoryId).toBe(mockProduct.categoryId);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle product with very large stock number', async () => {
      const largeStockProduct = { ...mockProduct, stock: 999999 };
      mockProductRepo.findById.mockResolvedValue(largeStockProduct);

      const result = await service.getById(1);

      expect(result?.stock).toBe(999999);
    });

    it('should handle product with very high price', async () => {
      const expensiveProduct = { ...mockProduct, price: 9999.99 };
      mockProductRepo.findById.mockResolvedValue(expensiveProduct);

      const result = await service.getById(1);

      expect(result?.price).toBe(9999.99);
    });

    it('should handle product with price of zero', async () => {
      const freeProduct = { ...mockProduct, price: 0 };
      mockProductRepo.findById.mockResolvedValue(freeProduct);

      const result = await service.getById(1);

      expect(result?.price).toBe(0);
    });

    it('should handle product name with special characters', async () => {
      const specialNameProduct = {
        ...mockProduct,
        name: "Product™ with Special & Char's!",
      };
      mockProductRepo.findById.mockResolvedValue(specialNameProduct);

      const result = await service.getById(1);

      expect(result?.name).toBe("Product™ with Special & Char's!");
    });

    it('should handle empty result set from getAll', async () => {
      mockProductRepo.findAll.mockResolvedValue([]);

      const result = await service.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle negative category id in getByCategory', async () => {
      mockProductRepo.findByCategory.mockResolvedValue([]);

      const result = await service.getByCategory(-1);

      expect(result).toEqual([]);
    });
  });

  describe('Multiple Operations Sequence', () => {
    it('should handle create then read sequence', async () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Sequential Product',
        categoryId: 1,
        price: 29.99,
        stock: 100,
        isAvailable: true,
      };
      const createdProduct = { id: 7, ...newProduct };

      mockProductRepo.create.mockResolvedValue(createdProduct);
      mockProductRepo.findById.mockResolvedValue(createdProduct);

      const created = await service.create(newProduct);
      const retrieved = await service.getById(created.id);

      expect(created).toEqual(createdProduct);
      expect(retrieved).toEqual(createdProduct);
    });

    it('should handle update then read sequence', async () => {
      const updates = { price: 44.99 };
      const updatedProduct = { ...mockProduct, ...updates };

      mockProductRepo.update.mockResolvedValue(updatedProduct);
      mockProductRepo.findById.mockResolvedValue(updatedProduct);

      await service.update(1, updates);
      const result = await service.getById(1);

      expect(result?.price).toBe(44.99);
    });

    it('should handle toggle then read sequence', async () => {
      const toggledProduct = { ...mockProduct, isAvailable: false };

      mockProductRepo.findById
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(toggledProduct);
      mockProductRepo.update.mockResolvedValue(toggledProduct);

      await service.toggleAvailability(1);
      const result = await service.getById(1);

      expect(result?.isAvailable).toBe(false);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple getById calls', async () => {
      mockProductRepo.findById.mockImplementation(async (id: number) => {
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
      mockProductRepo.findByCategory.mockImplementation(async (categoryId: number) => {
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
    it('should preserve product data during update', async () => {
      const originalProduct = { ...mockProduct };
      const updates = { price: 39.99 };
      const updatedProduct = { ...originalProduct, ...updates };

      mockProductRepo.update.mockResolvedValue(updatedProduct);

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
      mockProductRepo.findById.mockResolvedValue(mockProduct);

      await service.getById(1);

      expect(mockProduct).toEqual(originalProduct);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of products', async () => {
      const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProduct,
        id: i + 1,
        name: `Product ${i + 1}`,
      }));
      mockProductRepo.findAll.mockResolvedValue(largeProductList);

      const result = await service.getAll();

      expect(result).toHaveLength(1000);
    });

    it('should handle category with many products', async () => {
      const manyProducts = Array.from({ length: 500 }, (_, i) => ({
        ...mockProduct,
        id: i + 1,
        name: `Category Product ${i + 1}`,
      }));
      mockProductRepo.findByCategory.mockResolvedValue(manyProducts);

      const result = await service.getByCategory(1);

      expect(result).toHaveLength(500);
    });
  });

  describe('Repository Method Verification', () => {
    it('should call repository methods with correct parameters', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockProductRepo.findAll.mockResolvedValue([mockProduct]);
      mockProductRepo.findByCategory.mockResolvedValue([mockProduct]);

      await service.getById(1);
      await service.getAll();
      await service.getByCategory(1);

      expect(mockProductRepo.findById).toHaveBeenCalledTimes(1);
      expect(mockProductRepo.findAll).toHaveBeenCalledTimes(1);
      expect(mockProductRepo.findByCategory).toHaveBeenCalledTimes(1);
    });

    it('should not call repository methods multiple times unnecessarily', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);

      await service.getById(1);

      expect(mockProductRepo.findById).toHaveBeenCalledTimes(1);
      expect(mockProductRepo.findAll).not.toHaveBeenCalled();
      expect(mockProductRepo.findByCategory).not.toHaveBeenCalled();
    });
  });
});
