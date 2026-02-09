/**
 * Pure domain logic for price and tax calculations
 */

export const TAX_RATE = 0.18;

/**
 * Calculate tax from a tax-inclusive total
 * Formula: Tax = (Total * Rate) / (1 + Rate)
 */
export function calculateTaxInclusive(total: number, rate: number = TAX_RATE): number {
  if (total <= 0) return 0;
  return (total * rate) / (1 + rate);
}

/**
 * Calculate grand total including tip
 */
export function calculateGrandTotal(subtotal: number, tip = 0): number {
  return Math.max(0, subtotal + tip);
}
