import { describe, expect, it } from 'vitest';
import { roundCurrency } from './currency.utils';

describe('Currency Utils', () => {
  describe('roundCurrency', () => {
    it('should round to 2 decimal places', () => {
      expect(roundCurrency(18.74)).toBe(18.74);
      expect(roundCurrency(18.745)).toBe(18.75);
      expect(roundCurrency(18.744)).toBe(18.74);
    });

    it('should handle floating-point precision errors', () => {
      expect(roundCurrency(18.74000000000001)).toBe(18.74);
      expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    });

    it('should handle zero and negative values', () => {
      expect(roundCurrency(0)).toBe(0);
      expect(roundCurrency(-18.74)).toBe(-18.74);
      expect(roundCurrency(-18.745)).toBe(-18.74);
    });

    it('should handle very small values', () => {
      expect(roundCurrency(0.004)).toBe(0);
      expect(roundCurrency(0.005)).toBe(0.01);
      expect(roundCurrency(0.014)).toBe(0.01);
      expect(roundCurrency(0.015)).toBe(0.02);
    });

    it('should handle large values', () => {
      expect(roundCurrency(999999.994)).toBe(999999.99);
      expect(roundCurrency(999999.995)).toBe(1000000);
    });
  });
});
