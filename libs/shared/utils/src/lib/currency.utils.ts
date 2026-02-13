/**
 * Currency utility functions for monetary calculations
 */

/**
 * Round a monetary value to 2 decimal places
 * This eliminates JavaScript floating-point precision errors
 * @param value The value to round
 * @returns The value rounded to 2 decimal places
 * @example
 * roundCurrency(18.74000000000001) // returns 18.74
 * roundCurrency(0.1 + 0.2) // returns 0.3 (instead of 0.30000000000004)
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
