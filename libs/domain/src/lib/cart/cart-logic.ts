import { CartItem, CartSummary } from '@simple-pos/shared/types';
import { PricingCalculator, TAX_RATE } from '../pricing';

export class CartLogic {
  /**
   * Check if two cart items are identical (same product, variant, extras, and notes)
   */
  static areCartItemsEqual(itemA: CartItem, itemB: CartItem): boolean {
    if (itemA.productId !== itemB.productId) return false;
    if (itemA.variantId !== itemB.variantId) return false;
    if (itemA.notes !== itemB.notes) return false;

    return this.arraysEqual(itemA.extraIds, itemB.extraIds);
  }

  /**
   * Summarize cart items into a summary object
   */
  static summarizeCart(items: CartItem[]): CartSummary {
    const total = PricingCalculator.calculateOrderTotal(items);
    const tax = PricingCalculator.calculateTaxFromInclusiveTotal(total);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal: total, // Prices are tax-inclusive in this system
      taxRate: TAX_RATE,
      tax,
      total,
      itemCount,
    };
  }

  private static arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort((x, y) => x - y);
    const sortedB = [...b].sort((x, y) => x - y);
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }
}
