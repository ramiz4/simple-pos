import { describe, expect, it } from 'vitest';
import { ValidationUtils } from './validation.utils';

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(ValidationUtils.isValidEmail('test123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(ValidationUtils.isValidEmail('')).toBe(false);
      expect(ValidationUtils.isValidEmail('invalid')).toBe(false);
      expect(ValidationUtils.isValidEmail('@example.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@.com')).toBe(false);
    });

    it('should reject emails exceeding RFC 5321 length limit', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(ValidationUtils.isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('validatePin', () => {
    it('should validate strong numeric PIN', () => {
      const result = ValidationUtils.validatePin('147258'); // Non-sequential numbers
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject PIN shorter than 6 characters', () => {
      const result = ValidationUtils.validatePin('1234');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PIN must be at least 6 characters');
    });

    it('should reject PIN longer than 20 characters', () => {
      const result = ValidationUtils.validatePin('1'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PIN must not exceed 20 characters');
    });

    it('should reject PIN with non-numeric characters', () => {
      const result = ValidationUtils.validatePin('12345a');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PIN should contain only numbers');
    });

    it('should reject PIN with sequential numbers', () => {
      const result = ValidationUtils.validatePin('123456');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PIN should not contain sequential numbers');
    });

    it('should reject PIN with repeated digits', () => {
      const result = ValidationUtils.validatePin('111111');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PIN should not contain only repeated digits');
    });

    it('should handle empty PIN', () => {
      const result = ValidationUtils.validatePin('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PIN is required');
    });
  });

  describe('calculatePinStrength', () => {
    it('should return 0 for empty PIN', () => {
      expect(ValidationUtils.calculatePinStrength('')).toBe(0);
    });

    it('should give higher score for longer PINs', () => {
      const shortPin = ValidationUtils.calculatePinStrength('123789');
      const longPin = ValidationUtils.calculatePinStrength('1237894560');
      expect(longPin).toBeGreaterThan(shortPin);
    });

    it('should penalize sequential numbers', () => {
      const sequential = ValidationUtils.calculatePinStrength('123456');
      const random = ValidationUtils.calculatePinStrength('147258');
      expect(random).toBeGreaterThan(sequential);
    });

    it('should penalize repeated numbers', () => {
      const repeated = ValidationUtils.calculatePinStrength('111111');
      const varied = ValidationUtils.calculatePinStrength('147258');
      expect(varied).toBeGreaterThan(repeated);
    });

    it('should give bonus for complexity', () => {
      const numeric = ValidationUtils.calculatePinStrength('147258');
      const mixed = ValidationUtils.calculatePinStrength('Pass123');
      expect(mixed).toBeGreaterThan(numeric);
    });

    it('should cap strength at 100', () => {
      const veryStrong = ValidationUtils.calculatePinStrength('P@ssw0rd!123456');
      expect(veryStrong).toBeLessThanOrEqual(100);
    });
  });

  describe('getPinStrengthLabel', () => {
    it('should return correct labels for strength levels', () => {
      expect(ValidationUtils.getPinStrengthLabel(20)).toBe('Weak');
      expect(ValidationUtils.getPinStrengthLabel(50)).toBe('Fair');
      expect(ValidationUtils.getPinStrengthLabel(70)).toBe('Good');
      expect(ValidationUtils.getPinStrengthLabel(90)).toBe('Strong');
    });
  });

  describe('getPinStrengthColor', () => {
    it('should return correct colors for strength levels', () => {
      expect(ValidationUtils.getPinStrengthColor(20)).toBe('bg-red-500');
      expect(ValidationUtils.getPinStrengthColor(50)).toBe('bg-yellow-500');
      expect(ValidationUtils.getPinStrengthColor(70)).toBe('bg-blue-500');
      expect(ValidationUtils.getPinStrengthColor(90)).toBe('bg-green-500');
    });
  });

  describe('isValidName', () => {
    it('should validate names with proper length', () => {
      expect(ValidationUtils.isValidName('John Doe')).toBe(true);
      expect(ValidationUtils.isValidName('Al')).toBe(true);
      expect(ValidationUtils.isValidName('A'.repeat(100))).toBe(true);
    });

    it('should reject names that are too short', () => {
      expect(ValidationUtils.isValidName('A')).toBe(false);
      expect(ValidationUtils.isValidName(' ')).toBe(false);
    });

    it('should reject names that are too long', () => {
      expect(ValidationUtils.isValidName('A'.repeat(101))).toBe(false);
    });

    it('should reject empty names', () => {
      expect(ValidationUtils.isValidName('')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      expect(ValidationUtils.isValidUsername('user123')).toBe(true);
      expect(ValidationUtils.isValidUsername('test_user')).toBe(true);
      expect(ValidationUtils.isValidUsername('test-user')).toBe(true);
    });

    it('should reject usernames that are too short', () => {
      expect(ValidationUtils.isValidUsername('ab')).toBe(false);
    });

    it('should reject usernames that are too long', () => {
      expect(ValidationUtils.isValidUsername('a'.repeat(31))).toBe(false);
    });

    it('should reject usernames with invalid characters', () => {
      expect(ValidationUtils.isValidUsername('test@user')).toBe(false);
      expect(ValidationUtils.isValidUsername('test.user')).toBe(false);
      expect(ValidationUtils.isValidUsername('test user')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(ValidationUtils.isValidUsername('TestUser')).toBe(true);
      expect(ValidationUtils.isValidUsername('TESTUSER')).toBe(true);
    });
  });
});
