import { Injectable } from '@angular/core';

/**
 * Service for sanitizing user inputs to prevent XSS and other injection attacks
 */
@Injectable({
  providedIn: 'root',
})
export class InputSanitizerService {
  /**
   * Sanitize a string input by removing potentially dangerous HTML/script content
   */
  sanitizeString(input: string): string {
    if (!input) return '';

    // Remove any HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Remove script-related content
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Sanitize email input - allows only valid email characters
   */
  sanitizeEmail(email: string): string {
    if (!email) return '';

    // Remove any characters that aren't valid in email addresses
    return email
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._+-]/g, '');
  }

  /**
   * Sanitize PIN input - allows only numeric characters
   */
  sanitizePin(pin: string): string {
    if (!pin) return '';

    // Remove any non-numeric characters
    return pin.replace(/[^0-9]/g, '');
  }

  /**
   * Sanitize organization/user name - allows alphanumeric and common name characters
   */
  sanitizeName(name: string): string {
    if (!name) return '';

    // Allow letters, numbers, spaces, hyphens, apostrophes, and periods
    return this.sanitizeString(name).replace(/[^a-zA-Z0-9\s\-'\.]/g, '');
  }

  /**
   * Validate and sanitize username - alphanumeric with underscores and hyphens
   */
  sanitizeUsername(username: string): string {
    if (!username) return '';

    // Allow only alphanumeric, underscores, and hyphens
    return username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '');
  }
}
