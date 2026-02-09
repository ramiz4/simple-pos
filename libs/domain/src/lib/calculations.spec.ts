import { describe, expect, it } from 'vitest';
import { calculateGrandTotal, calculateTaxInclusive } from './calculations';

describe('calculations domain logic', () => {
  describe('calculateTaxInclusive', () => {
    it('should return 0 for zero total', () => {
      expect(calculateTaxInclusive(0)).toBe(0);
    });

    it('should return 0 for negative total', () => {
      expect(calculateTaxInclusive(-100)).toBe(0);
    });

    it('should calculate tax correctly for default rate (18%)', () => {
      // Formula: (Total * Rate) / (1 + Rate)
      // For 118: (118 * 0.18) / 1.18 = 18
      expect(calculateTaxInclusive(118)).toBeCloseTo(18);
    });

    it('should calculate tax correctly for custom rate', () => {
      // For 110 at 10%: (110 * 0.10) / 1.1 = 10
      expect(calculateTaxInclusive(110, 0.1)).toBeCloseTo(10);
    });

    it('should handle typical POS totals', () => {
      expect(calculateTaxInclusive(50)).toBeCloseTo(7.627, 2);
      expect(calculateTaxInclusive(1500)).toBeCloseTo(228.813, 2);
    });
  });

  describe('calculateGrandTotal', () => {
    it('should return 0 for zero subtotal and zero tip', () => {
      expect(calculateGrandTotal(0, 0)).toBe(0);
    });

    it('should return 0 for negative subtotal', () => {
      // Negative subtotal should clip to 0 even with positive tip
      expect(calculateGrandTotal(-100, 50)).toBe(0);
    });

    it('should return 0 if subtotal + tip results in negative value', () => {
      expect(calculateGrandTotal(100, -150)).toBe(0);
    });

    it('should calculate grand total correctly for typical values', () => {
      expect(calculateGrandTotal(100, 15.5)).toBe(115.5);
      expect(calculateGrandTotal(45.99, 5.0)).toBe(50.99);
    });

    it('should use default tip of 0 if not provided', () => {
      expect(calculateGrandTotal(100)).toBe(100);
    });

    it('should handle zero tip explicitly', () => {
      expect(calculateGrandTotal(250, 0)).toBe(250);
    });
  });
});
