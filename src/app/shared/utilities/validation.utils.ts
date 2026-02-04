/**
 * Validation utility functions for authentication and user input
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321
  }

  /**
   * Validate PIN strength
   */
  static validatePin(pin: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pin) {
      errors.push('PIN is required');
      return { valid: false, errors };
    }

    if (pin.length < 6) {
      errors.push('PIN must be at least 6 characters');
    }

    if (pin.length > 20) {
      errors.push('PIN must not exceed 20 characters');
    }

    // Check if only numeric (recommended for POS systems)
    if (!/^\d+$/.test(pin)) {
      errors.push('PIN should contain only numbers');
    }

    // Check for sequential numbers (123456, 654321)
    if (this.hasSequentialNumbers(pin)) {
      errors.push('PIN should not contain sequential numbers');
    }

    // Check for repeated numbers (111111, 000000)
    if (this.hasRepeatedNumbers(pin)) {
      errors.push('PIN should not contain only repeated digits');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calculate PIN strength (0-100)
   * Note: For numeric-only PINs, this focuses on length and uniqueness
   */
  static calculatePinStrength(pin: string): number {
    if (!pin) return 0;

    let strength = 0;

    // Length score (up to 40 points)
    if (pin.length >= 6) strength += 20;
    if (pin.length >= 8) strength += 10;
    if (pin.length >= 10) strength += 10;

    // For numeric PINs: diversity bonus (up to 30 points)
    const isNumeric = /^\d+$/.test(pin);
    if (isNumeric) {
      // Award points for using different digits
      const uniqueDigits = new Set(pin.split('')).size;
      strength += Math.min(30, uniqueDigits * 3);
    } else {
      // For mixed PINs: complexity score (up to 30 points)
      if (/\d/.test(pin)) strength += 10;
      if (/[a-z]/.test(pin)) strength += 10;
      if (/[A-Z]/.test(pin)) strength += 10;
    }

    // Special characters (up to 10 points) - only for non-numeric PINs
    if (!isNumeric && /[^a-zA-Z0-9]/.test(pin)) strength += 10;

    // Uniqueness penalty (up to -20 points)
    if (this.hasSequentialNumbers(pin)) strength -= 10;
    if (this.hasRepeatedNumbers(pin)) strength -= 10;

    return Math.max(0, Math.min(100, strength));
  }

  /**
   * Get PIN strength label
   */
  static getPinStrengthLabel(strength: number): string {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  }

  /**
   * Get PIN strength color
   */
  static getPinStrengthColor(strength: number): string {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  }

  /**
   * Validate account/user name
   */
  static isValidName(name: string): boolean {
    if (!name) return false;
    return name.trim().length >= 2 && name.trim().length <= 100;
  }

  /**
   * Validate username format
   */
  static isValidUsername(username: string): boolean {
    if (!username) return false;
    // 3-30 characters, alphanumeric with underscores and hyphens
    const usernameRegex = /^[a-z0-9_-]{3,30}$/;
    return usernameRegex.test(username.toLowerCase());
  }

  /**
   * Check if string contains sequential numbers
   */
  private static hasSequentialNumbers(str: string): boolean {
    for (let i = 0; i < str.length - 2; i++) {
      const curr = parseInt(str[i]);
      const next1 = parseInt(str[i + 1]);
      const next2 = parseInt(str[i + 2]);

      if (!isNaN(curr) && !isNaN(next1) && !isNaN(next2)) {
        if (next1 === curr + 1 && next2 === curr + 2) return true;
        if (next1 === curr - 1 && next2 === curr - 2) return true;
      }
    }
    return false;
  }

  /**
   * Check if string contains mostly repeated characters
   */
  private static hasRepeatedNumbers(str: string): boolean {
    if (str.length < 3) return false;
    const firstChar = str[0];
    let repeatCount = 1;

    for (let i = 1; i < str.length; i++) {
      if (str[i] === firstChar) {
        repeatCount++;
      }
    }

    // If more than 80% are the same character
    return repeatCount / str.length > 0.8;
  }
  /**
   * Calculate Password strength (0-100)
   */
  static calculatePasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;

    // Length score (up to 60 points)
    if (password.length >= 8) strength += 40;
    if (password.length >= 12) strength += 20;

    // Complexity score (up to 40 points)
    if (/\d/.test(password)) strength += 10;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[A-Z]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    return Math.min(100, strength);
  }

  /**
   * Get Password strength label
   */
  static getPasswordStrengthLabel(strength: number): string {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  }

  /**
   * Get Password strength color
   */
  static getPasswordStrengthColor(strength: number): string {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  }
}
