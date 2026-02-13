export interface BaseOrderItem {
  productPrice: number;
  variantPriceModifier?: number;
  extraPrices?: number[];
  quantity: number;
}

/**
 * Kosovo VAT rate (18%) - prices already include this tax (tax-inclusive pricing)
 */
export const TAX_RATE = 0.18;

/**
 * Round a monetary value to 2 decimal places
 * This eliminates JavaScript floating-point precision errors
 * @param value The value to round
 * @returns The value rounded to 2 decimal places
 */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export class PricingCalculator {
  /**
   * Calculate line total for an order item
   */
  static calculateLineTotal(item: BaseOrderItem): number {
    const productPrice = item.productPrice || 0;
    const variantModifier = item.variantPriceModifier || 0;
    const extrasSum = item.extraPrices?.reduce((sum, p) => sum + p, 0) || 0;

    const unitPrice = productPrice + variantModifier + extrasSum;
    return unitPrice * (item.quantity || 0);
  }

  /**
   * Calculate order total (sum of line totals)
   */
  static calculateOrderTotal(items: BaseOrderItem[]): number {
    return items.reduce((sum, item) => sum + this.calculateLineTotal(item), 0);
  }

  /**
   * Calculate tax from a tax-inclusive total
   * Formula: Tax = (Total * Rate) / (1 + Rate)
   */
  static calculateTaxFromInclusiveTotal(total: number, rate: number = TAX_RATE): number {
    if (total <= 0) return 0;
    return (total * rate) / (1 + rate);
  }

  /**
   * Calculate grand total including tip
   */
  static calculateGrandTotal(subtotal: number, tip = 0): number {
    return Math.max(0, subtotal + tip);
  }

  /**
   * Validate if the provided totals match the items
   */
  static validateOrderTotals(total: number, tax: number, items: BaseOrderItem[]): boolean {
    const calculatedTotal = this.calculateOrderTotal(items);
    const calculatedTax = this.calculateTaxFromInclusiveTotal(calculatedTotal);

    return (
      roundCurrency(total) === roundCurrency(calculatedTotal) &&
      roundCurrency(tax) === roundCurrency(calculatedTax)
    );
  }
}
