import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Ingredient } from '../../domain/entities/ingredient.interface';
import { ProductIngredient } from '../../domain/entities/product-ingredient.interface';
import { Product } from '../../domain/entities/product.interface';
import { IngredientService } from './ingredient.service';
import { InventoryService } from './inventory.service';
import { ProductIngredientService } from './product-ingredient.service';
import { ProductService } from './product.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockProductService: any;
  let mockIngredientService: any;
  let mockProductIngredientService: any;

  const mockProduct: Product = {
    id: 1,
    name: 'Pizza Margherita',
    categoryId: 1,
    price: 12.99,
    stock: 50,
    isAvailable: true,
  };

  const mockProductLowStock: Product = {
    id: 2,
    name: 'Burger',
    categoryId: 1,
    price: 8.99,
    stock: 3,
    isAvailable: true,
  };

  const mockProductOutOfStock: Product = {
    id: 3,
    name: 'Pasta',
    categoryId: 1,
    price: 10.99,
    stock: 0,
    isAvailable: false,
  };

  const mockIngredient1: Ingredient = {
    id: 1,
    name: 'Flour',
    stockQuantity: 1000,
    unit: 'g',
  };

  const mockIngredient2: Ingredient = {
    id: 2,
    name: 'Tomato Sauce',
    stockQuantity: 500,
    unit: 'ml',
  };

  const mockIngredient3: Ingredient = {
    id: 3,
    name: 'Cheese',
    stockQuantity: 200,
    unit: 'g',
  };

  const mockIngredientLowStock: Ingredient = {
    id: 4,
    name: 'Basil',
    stockQuantity: 10,
    unit: 'g',
  };

  const mockProductIngredient1: ProductIngredient = {
    id: 1,
    productId: 1,
    ingredientId: 1,
    quantity: 200, // 200g flour per pizza
  };

  const mockProductIngredient2: ProductIngredient = {
    id: 2,
    productId: 1,
    ingredientId: 2,
    quantity: 100, // 100ml sauce per pizza
  };

  const mockProductIngredient3: ProductIngredient = {
    id: 3,
    productId: 1,
    ingredientId: 3,
    quantity: 50, // 50g cheese per pizza
  };

  beforeEach(() => {
    // Mock ProductService
    mockProductService = {
      getById: vi.fn(),
      update: vi.fn(),
      getAll: vi.fn(),
    };

    // Mock IngredientService
    mockIngredientService = {
      getById: vi.fn(),
      update: vi.fn(),
      getAll: vi.fn(),
    };

    // Mock ProductIngredientService
    mockProductIngredientService = {
      getByProduct: vi.fn(),
    };

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        InventoryService,
        { provide: ProductService, useValue: mockProductService },
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: ProductIngredientService, useValue: mockProductIngredientService },
      ],
    });

    service = TestBed.inject(InventoryService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have inventory tracking disabled by default', () => {
      expect(service.isInventoryTrackingEnabled()).toBe(false);
    });
  });

  describe('setInventoryTracking', () => {
    it('should enable inventory tracking', () => {
      service.setInventoryTracking(true);

      expect(service.isInventoryTrackingEnabled()).toBe(true);
    });

    it('should disable inventory tracking', () => {
      service.setInventoryTracking(true);
      service.setInventoryTracking(false);

      expect(service.isInventoryTrackingEnabled()).toBe(false);
    });

    it('should toggle inventory tracking multiple times', () => {
      service.setInventoryTracking(true);
      expect(service.isInventoryTrackingEnabled()).toBe(true);

      service.setInventoryTracking(false);
      expect(service.isInventoryTrackingEnabled()).toBe(false);

      service.setInventoryTracking(true);
      expect(service.isInventoryTrackingEnabled()).toBe(true);
    });
  });

  describe('isInventoryTrackingEnabled', () => {
    it('should return false when tracking is disabled', () => {
      expect(service.isInventoryTrackingEnabled()).toBe(false);
    });

    it('should return true when tracking is enabled', () => {
      service.setInventoryTracking(true);

      expect(service.isInventoryTrackingEnabled()).toBe(true);
    });
  });

  describe('deductProductStock', () => {
    beforeEach(() => {
      service.setInventoryTracking(true);
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductService.update.mockResolvedValue({ ...mockProduct, stock: 49 });
    });

    it('should deduct product stock by default quantity of 1', async () => {
      await service.deductProductStock(1);

      expect(mockProductService.getById).toHaveBeenCalledWith(1);
      expect(mockProductService.update).toHaveBeenCalledWith(1, { stock: 49 });
    });

    it('should deduct product stock by specified quantity', async () => {
      mockProductService.update.mockResolvedValue({ ...mockProduct, stock: 45 });

      await service.deductProductStock(1, 5);

      expect(mockProductService.update).toHaveBeenCalledWith(1, { stock: 45 });
    });

    it('should throw error when product not found', async () => {
      mockProductService.getById.mockResolvedValue(null);

      await expect(service.deductProductStock(999)).rejects.toThrow('Product 999 not found');
    });

    it('should throw error when insufficient stock', async () => {
      mockProductService.getById.mockResolvedValue(mockProductLowStock);

      await expect(service.deductProductStock(2, 10)).rejects.toThrow(
        'Insufficient stock for product Burger',
      );
    });

    it('should not deduct stock when tracking is disabled', async () => {
      service.setInventoryTracking(false);

      await service.deductProductStock(1, 5);

      expect(mockProductService.getById).not.toHaveBeenCalled();
      expect(mockProductService.update).not.toHaveBeenCalled();
    });

    it('should allow deducting entire stock', async () => {
      mockProductService.update.mockResolvedValue({ ...mockProduct, stock: 0 });

      await service.deductProductStock(1, 50);

      expect(mockProductService.update).toHaveBeenCalledWith(1, { stock: 0 });
    });

    it('should throw error when trying to deduct more than available', async () => {
      mockProductService.getById.mockResolvedValue(mockProductLowStock);

      await expect(service.deductProductStock(2, 5)).rejects.toThrow(
        'Insufficient stock for product Burger',
      );
    });

    it('should handle negative stock calculation correctly', async () => {
      mockProductService.getById.mockResolvedValue(mockProductOutOfStock);

      await expect(service.deductProductStock(3, 1)).rejects.toThrow(
        'Insufficient stock for product Pasta',
      );
    });

    it('should handle multiple deductions in sequence', async () => {
      mockProductService.getById
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({ ...mockProduct, stock: 49 });
      mockProductService.update
        .mockResolvedValueOnce({ ...mockProduct, stock: 49 })
        .mockResolvedValueOnce({ ...mockProduct, stock: 47 });

      await service.deductProductStock(1, 1);
      await service.deductProductStock(1, 2);

      expect(mockProductService.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('deductIngredientStock', () => {
    beforeEach(() => {
      service.setInventoryTracking(true);
      mockProductIngredientService.getByProduct.mockResolvedValue([
        mockProductIngredient1,
        mockProductIngredient2,
        mockProductIngredient3,
      ]);
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return mockIngredient1;
        if (id === 2) return mockIngredient2;
        if (id === 3) return mockIngredient3;
        return null;
      });
      mockIngredientService.update.mockResolvedValue({});
    });

    it('should deduct all ingredient stocks for a product', async () => {
      await service.deductIngredientStock(1);

      expect(mockProductIngredientService.getByProduct).toHaveBeenCalledWith(1);
      expect(mockIngredientService.getById).toHaveBeenCalledTimes(3);
      expect(mockIngredientService.update).toHaveBeenCalledWith(1, { stockQuantity: 800 }); // 1000 - 200
      expect(mockIngredientService.update).toHaveBeenCalledWith(2, { stockQuantity: 400 }); // 500 - 100
      expect(mockIngredientService.update).toHaveBeenCalledWith(3, { stockQuantity: 150 }); // 200 - 50
    });

    it('should deduct ingredients with specified quantity multiplier', async () => {
      await service.deductIngredientStock(1, 2);

      expect(mockIngredientService.update).toHaveBeenCalledWith(1, { stockQuantity: 600 }); // 1000 - (200 * 2)
      expect(mockIngredientService.update).toHaveBeenCalledWith(2, { stockQuantity: 300 }); // 500 - (100 * 2)
      expect(mockIngredientService.update).toHaveBeenCalledWith(3, { stockQuantity: 100 }); // 200 - (50 * 2)
    });

    it('should throw error when ingredient has insufficient stock', async () => {
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return mockIngredient1;
        if (id === 2) return mockIngredient2;
        if (id === 3) return mockIngredientLowStock; // Only 10g available
        return null;
      });

      await expect(service.deductIngredientStock(1)).rejects.toThrow(
        'Insufficient stock for ingredient Basil',
      );
    });

    it('should not deduct stock when tracking is disabled', async () => {
      service.setInventoryTracking(false);

      await service.deductIngredientStock(1);

      expect(mockProductIngredientService.getByProduct).not.toHaveBeenCalled();
      expect(mockIngredientService.update).not.toHaveBeenCalled();
    });

    it('should skip ingredients that are not found', async () => {
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return mockIngredient1;
        if (id === 2) return null; // Missing ingredient
        if (id === 3) return mockIngredient3;
        return null;
      });

      await service.deductIngredientStock(1);

      expect(mockIngredientService.update).toHaveBeenCalledTimes(2); // Only 2 updates, skipping missing ingredient
      expect(mockIngredientService.update).toHaveBeenCalledWith(1, { stockQuantity: 800 });
      expect(mockIngredientService.update).toHaveBeenCalledWith(3, { stockQuantity: 150 });
    });

    it('should handle product with no ingredients', async () => {
      mockProductIngredientService.getByProduct.mockResolvedValue([]);

      await service.deductIngredientStock(1);

      expect(mockIngredientService.getById).not.toHaveBeenCalled();
      expect(mockIngredientService.update).not.toHaveBeenCalled();
    });

    it('should handle large quantity deductions', async () => {
      // This test expects the service to throw when stock would go negative
      // The actual service behavior is to throw an error when newStock < 0
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return mockIngredient1; // 1000g available
        if (id === 2) return mockIngredient2;
        if (id === 3) return mockIngredient3;
        return null;
      });

      // Deducting 10 units means: 200g * 10 = 2000g needed, but only 1000g available
      await expect(service.deductIngredientStock(1, 10)).rejects.toThrow(
        'Insufficient stock for ingredient Flour',
      );
    });

    it('should deduct exact stock amount', async () => {
      // Set up so that deduction uses exact remaining stock
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return { ...mockIngredient1, stockQuantity: 200 }; // Exactly 200g
        if (id === 2) return mockIngredient2;
        if (id === 3) return mockIngredient3;
        return null;
      });

      await service.deductIngredientStock(1, 1);

      expect(mockIngredientService.update).toHaveBeenCalledWith(1, { stockQuantity: 0 });
    });
  });

  describe('checkStockAvailability', () => {
    beforeEach(() => {
      service.setInventoryTracking(true);
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductIngredientService.getByProduct.mockResolvedValue([
        mockProductIngredient1,
        mockProductIngredient2,
        mockProductIngredient3,
      ]);
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return mockIngredient1;
        if (id === 2) return mockIngredient2;
        if (id === 3) return mockIngredient3;
        return null;
      });
    });

    it('should return available when sufficient stock exists', async () => {
      const result = await service.checkStockAvailability(1, 1);

      expect(result.available).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return available with quantity 1 by default', async () => {
      const result = await service.checkStockAvailability(1);

      expect(result.available).toBe(true);
      expect(mockProductService.getById).toHaveBeenCalledWith(1);
    });

    it('should return unavailable when product not found', async () => {
      mockProductService.getById.mockResolvedValue(null);

      const result = await service.checkStockAvailability(999);

      expect(result.available).toBe(false);
      expect(result.message).toBe('Product not found');
    });

    it('should return unavailable when insufficient product stock', async () => {
      mockProductService.getById.mockResolvedValue(mockProductLowStock);

      const result = await service.checkStockAvailability(2, 10);

      expect(result.available).toBe(false);
      expect(result.message).toBe('Only 3 units available');
    });

    it('should return unavailable when insufficient ingredient stock', async () => {
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return mockIngredient1;
        if (id === 2) return mockIngredient2;
        if (id === 3) return mockIngredientLowStock; // Only 10g
        return null;
      });

      const result = await service.checkStockAvailability(1, 1);

      expect(result.available).toBe(false);
      expect(result.message).toBe('Insufficient Basil (need 50 g)');
    });

    it('should return available when tracking is disabled', async () => {
      service.setInventoryTracking(false);

      const result = await service.checkStockAvailability(1, 100);

      expect(result.available).toBe(true);
      expect(result.message).toBeUndefined();
      expect(mockProductService.getById).not.toHaveBeenCalled();
    });

    it('should check multiple quantities correctly', async () => {
      mockProductIngredientService.getByProduct.mockResolvedValue([
        mockProductIngredient1,
        mockProductIngredient2,
        mockProductIngredient3,
      ]);

      const result1 = await service.checkStockAvailability(1, 1);
      const result2 = await service.checkStockAvailability(1, 5);

      // Check if we have enough stock for 5 units (needs: 1000g flour, 500ml sauce, 250g cheese)
      // Available: 1000g flour, 500ml sauce, 200g cheese
      // For 5 units we need: 1000g flour (OK), 500ml sauce (OK), 250g cheese (NOT OK - only 200g)
      expect(result1.available).toBe(true);
      expect(result2.available).toBe(false); // Not enough cheese for 5 pizzas
    });

    it('should detect when multiple ingredient quantities would be insufficient', async () => {
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return { ...mockIngredient1, stockQuantity: 250 }; // Not enough for 2 pizzas (needs 400)
        if (id === 2) return mockIngredient2;
        if (id === 3) return mockIngredient3;
        return null;
      });

      const result = await service.checkStockAvailability(1, 2);

      expect(result.available).toBe(false);
      expect(result.message).toBe('Insufficient Flour (need 400 g)');
    });

    it('should handle product with no ingredients', async () => {
      mockProductIngredientService.getByProduct.mockResolvedValue([]);

      const result = await service.checkStockAvailability(1, 5);

      expect(result.available).toBe(true);
    });

    it('should skip null ingredients when checking availability', async () => {
      mockProductIngredientService.getByProduct.mockResolvedValue([
        mockProductIngredient1,
        mockProductIngredient2,
        mockProductIngredient3,
      ]);
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return mockIngredient1;
        if (id === 2) return null; // Missing ingredient
        if (id === 3) return mockIngredient3;
        return null;
      });

      const result = await service.checkStockAvailability(1, 1);

      // Should still return available as it skips null ingredients
      expect(result.available).toBe(true);
    });

    it('should return proper message for zero stock product', async () => {
      mockProductService.getById.mockResolvedValue(mockProductOutOfStock);

      const result = await service.checkStockAvailability(3, 1);

      expect(result.available).toBe(false);
      expect(result.message).toBe('Only 0 units available');
    });

    it('should check exact stock boundary', async () => {
      mockProductService.getById.mockResolvedValue({ ...mockProduct, stock: 5 });
      mockProductIngredientService.getByProduct.mockResolvedValue([]);

      const result1 = await service.checkStockAvailability(1, 5);
      const result2 = await service.checkStockAvailability(1, 6);

      expect(result1.available).toBe(true);
      expect(result2.available).toBe(false);
      expect(result2.message).toBe('Only 5 units available');
    });

    it('should check exact ingredient boundary', async () => {
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return mockIngredient1;
        if (id === 2) return mockIngredient2;
        if (id === 3) return { ...mockIngredient3, stockQuantity: 50 }; // Exactly 50g
        return null;
      });

      const result1 = await service.checkStockAvailability(1, 1); // Needs exactly 50g
      const result2 = await service.checkStockAvailability(1, 2); // Needs 100g

      expect(result1.available).toBe(true);
      expect(result2.available).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      service.setInventoryTracking(true);
    });

    it('should handle complete order flow: check then deduct', async () => {
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductService.update.mockResolvedValue({ ...mockProduct, stock: 48 });
      mockProductIngredientService.getByProduct.mockResolvedValue([mockProductIngredient1]);
      mockIngredientService.getById.mockResolvedValue(mockIngredient1);
      mockIngredientService.update.mockResolvedValue({});

      // Check availability first
      const checkResult = await service.checkStockAvailability(1, 2);
      expect(checkResult.available).toBe(true);

      // Then deduct
      await service.deductProductStock(1, 2);
      await service.deductIngredientStock(1, 2);

      expect(mockProductService.update).toHaveBeenCalledWith(1, { stock: 48 });
      expect(mockIngredientService.update).toHaveBeenCalledWith(1, { stockQuantity: 600 });
    });

    it('should prevent order when stock check fails', async () => {
      mockProductService.getById.mockResolvedValue(mockProductLowStock);

      const checkResult = await service.checkStockAvailability(2, 10);
      expect(checkResult.available).toBe(false);

      // Should not proceed with deduction
      // Test that we would not call deduct in real scenario
    });

    it('should handle partial ingredient availability', async () => {
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductIngredientService.getByProduct.mockResolvedValue([
        mockProductIngredient1,
        mockProductIngredient2,
      ]);
      mockIngredientService.getById.mockImplementation(async (id: number) => {
        if (id === 1) return mockIngredient1; // Sufficient
        if (id === 2) return mockIngredientLowStock; // Insufficient
        return null;
      });

      const result = await service.checkStockAvailability(1, 1);

      expect(result.available).toBe(false);
      expect(result.message).toContain('Insufficient');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      service.setInventoryTracking(true);
    });

    it('should handle zero quantity deduction', async () => {
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductService.update.mockResolvedValue(mockProduct);

      await service.deductProductStock(1, 0);

      expect(mockProductService.update).toHaveBeenCalledWith(1, { stock: 50 }); // No change
    });

    it('should handle negative quantity checks', async () => {
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductIngredientService.getByProduct.mockResolvedValue([]);

      const result = await service.checkStockAvailability(1, -5);

      // Should still process (though negative doesn't make business sense)
      expect(result.available).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      mockProductService.getById.mockRejectedValue(new Error('Database error'));

      await expect(service.deductProductStock(1)).rejects.toThrow('Database error');
    });

    it('should handle ingredient service errors', async () => {
      mockProductIngredientService.getByProduct.mockRejectedValue(new Error('Connection lost'));

      await expect(service.deductIngredientStock(1)).rejects.toThrow('Connection lost');
    });

    it('should handle missing product during stock check', async () => {
      mockProductService.getById.mockResolvedValue(null);

      const result = await service.checkStockAvailability(999);

      expect(result.available).toBe(false);
      expect(result.message).toBe('Product not found');
    });

    it('should handle very large quantities', async () => {
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductIngredientService.getByProduct.mockResolvedValue([]);

      const result = await service.checkStockAvailability(1, 1000000);

      expect(result.available).toBe(false);
      expect(result.message).toContain('Only 50 units available');
    });

    it('should handle decimal quantities correctly', async () => {
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductService.update.mockResolvedValue({ ...mockProduct, stock: 47.5 });

      await service.deductProductStock(1, 2.5);

      expect(mockProductService.update).toHaveBeenCalledWith(1, { stock: 47.5 });
    });
  });

  describe('Tracking State Management', () => {
    it('should maintain tracking state across operations', async () => {
      service.setInventoryTracking(true);
      expect(service.isInventoryTrackingEnabled()).toBe(true);

      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductService.update.mockResolvedValue(mockProduct);
      await service.deductProductStock(1);

      expect(service.isInventoryTrackingEnabled()).toBe(true);
    });

    it('should respect tracking state changes during operations', async () => {
      service.setInventoryTracking(true);
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductService.update.mockResolvedValue(mockProduct);

      await service.deductProductStock(1);
      expect(mockProductService.update).toHaveBeenCalledTimes(1);

      service.setInventoryTracking(false);
      await service.deductProductStock(1);

      // Should not call update again since tracking is disabled
      expect(mockProductService.update).toHaveBeenCalledTimes(1);
    });

    it('should work correctly when re-enabling tracking', async () => {
      service.setInventoryTracking(false);
      mockProductService.getById.mockResolvedValue(mockProduct);

      await service.deductProductStock(1);
      expect(mockProductService.update).not.toHaveBeenCalled();

      service.setInventoryTracking(true);
      mockProductService.update.mockResolvedValue(mockProduct);

      await service.deductProductStock(1);
      expect(mockProductService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      service.setInventoryTracking(true);
    });

    it('should handle multiple concurrent stock checks', async () => {
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductIngredientService.getByProduct.mockResolvedValue([]);

      const results = await Promise.all([
        service.checkStockAvailability(1, 5),
        service.checkStockAvailability(1, 10),
        service.checkStockAvailability(1, 20),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.available)).toBe(true);
    });

    it('should handle multiple concurrent deductions', async () => {
      mockProductService.getById.mockResolvedValue(mockProduct);
      mockProductService.update.mockResolvedValue(mockProduct);

      await Promise.all([
        service.deductProductStock(1, 1),
        service.deductProductStock(1, 2),
        service.deductProductStock(1, 3),
      ]);

      expect(mockProductService.update).toHaveBeenCalledTimes(3);
    });
  });
});
