import { Injectable } from '@angular/core';

/**
 * Service for sanitizing user inputs to prevent XSS and other injection attacks
 *
 * SECURITY NOTE: This service provides defense-in-depth input validation.
 * However, the PRIMARY defense against XSS in Angular applications is:
 * 1. Angular's automatic sanitization of template bindings
 * 2. Using Angular's DomSanitizer for dynamic content
 * 3. Server-side validation and sanitization
 *
 * This service should be used as an ADDITIONAL layer, not the only defense.
 */
@Injectable({
  providedIn: 'root',
})
export class InputSanitizerService {
  /**
   * Sanitize a string input by removing potentially dangerous HTML/script content
   * Note: This is a best-effort sanitization. For production use, rely on Angular's
   * DomSanitizer or server-side validation as the primary defense.
   */
  sanitizeString(input: string): string {
    if (!input) return '';

    let sanitized = input;

    // Remove script tags and their content - handles whitespace variations
    // Use a loop to handle nested or multiple script tags
    let maxIterations = 10; // Prevent infinite loops
    let previousLength;
    do {
      previousLength = sanitized.length;
      // Match <script with any attributes and </script with any whitespace
      sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script[\s]*>/gi, '');
      maxIterations--;
    } while (sanitized.length !== previousLength && maxIterations > 0);

    // Remove all remaining HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove dangerous protocols - do multiple passes
    maxIterations = 3;
    do {
      previousLength = sanitized.length;
      sanitized = sanitized.replace(/(?:javascript|data|vbscript):/gi, '');
      maxIterations--;
    } while (sanitized.length !== previousLength && maxIterations > 0);

    // Remove event handlers - multiple passes
    maxIterations = 3;
    do {
      previousLength = sanitized.length;
      sanitized = sanitized.replace(/\s*on\w+\s*=/gi, '');
      maxIterations--;
    } while (sanitized.length !== previousLength && maxIterations > 0);

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
   * Sanitize account/user name - allows alphanumeric and common name characters
   */
  sanitizeName(name: string): string {
    if (!name) return '';

    // First remove script tags and their content completely
    let sanitized = this.sanitizeString(name);

    // Allow letters, numbers, spaces, hyphens, apostrophes, and periods
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-'\.]/g, '');

    return sanitized;
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
