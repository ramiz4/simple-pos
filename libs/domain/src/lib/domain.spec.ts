import { OrderStatusEnum } from '@simple-pos/shared/types';
import { describe, expect, it } from 'vitest';
import { CartLogic, InventoryManager, OrderStateMachine, PricingCalculator } from '../index';

describe('Domain Logic', () => {
  describe('PricingCalculator', () => {
    it('should calculate line total correctly', () => {
      const item = {
        productPrice: 10,
        variantPriceModifier: 2,
        extraPrices: [1, 0.5],
        quantity: 2,
      };
      // (10 + 2 + 1 + 0.5) * 2 = 13.5 * 2 = 27
      expect(PricingCalculator.calculateLineTotal(item as any)).toBe(27);
    });

    it('should calculate order total correctly', () => {
      const items = [
        { productPrice: 10, quantity: 1 },
        { productPrice: 20, quantity: 2 },
      ];
      expect(PricingCalculator.calculateOrderTotal(items as any)).toBe(50);
    });

    it('should calculate inclusive tax correctly', () => {
      // 118 at 18% -> 18
      expect(PricingCalculator.calculateTaxFromInclusiveTotal(118)).toBeCloseTo(18);
    });

    it('should calculate grand total correctly', () => {
      expect(PricingCalculator.calculateGrandTotal(100, 15)).toBe(115);
      expect(PricingCalculator.calculateGrandTotal(100, -50)).toBe(50);
      expect(PricingCalculator.calculateGrandTotal(100, -150)).toBe(0);
    });

    it('should validate order totals', () => {
      const items = [{ productPrice: 100, quantity: 1 }];
      const total = 100;
      const tax = (100 * 0.18) / 1.18;
      expect(PricingCalculator.validateOrderTotals(total, tax, items as any)).toBe(true);
      expect(PricingCalculator.validateOrderTotals(101, tax, items as any)).toBe(false);
    });
  });

  describe('InventoryManager', () => {
    it('should check stock availability', () => {
      const product = { stock: 10 } as any;
      expect(InventoryManager.isStockAvailable(product, 5)).toBe(true);
      expect(InventoryManager.isStockAvailable(product, 15)).toBe(false);
    });
  });

  describe('OrderStateMachine', () => {
    it('should allow valid transitions', () => {
      expect(OrderStateMachine.canTransition(OrderStatusEnum.OPEN, OrderStatusEnum.PREPARING)).toBe(
        true,
      );
      expect(OrderStateMachine.canTransition(OrderStatusEnum.OPEN, OrderStatusEnum.COMPLETED)).toBe(
        true,
      );
      expect(
        OrderStateMachine.canTransition(OrderStatusEnum.PREPARING, OrderStatusEnum.READY),
      ).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(OrderStateMachine.canTransition(OrderStatusEnum.COMPLETED, OrderStatusEnum.OPEN)).toBe(
        false,
      );
      expect(
        OrderStateMachine.canTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.PREPARING),
      ).toBe(false);
    });
  });

  describe('CartLogic', () => {
    it('should identify equal items', () => {
      const itemA = { productId: 1, variantId: 2, extraIds: [3, 4], notes: 'none' } as any;
      const itemB = { productId: 1, variantId: 2, extraIds: [4, 3], notes: 'none' } as any;
      expect(CartLogic.areCartItemsEqual(itemA, itemB)).toBe(true);
    });

    it('should identify different items', () => {
      const itemA = { productId: 1, variantId: 2, extraIds: [3], notes: 'none' } as any;
      const itemB = { productId: 1, variantId: 2, extraIds: [4], notes: 'none' } as any;
      expect(CartLogic.areCartItemsEqual(itemA, itemB)).toBe(false);
    });
  });
});
