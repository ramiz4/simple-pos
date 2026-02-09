import { describe, expect, it } from 'vitest';
import { InputSanitizerService } from './input-sanitizer.service';

describe('InputSanitizerService', () => {
  const service = new InputSanitizerService();

  describe('sanitizeString', () => {
    it('should remove HTML tags and script content', () => {
      expect(service.sanitizeString('<script>alert("xss")</script>')).toBe('');
      expect(service.sanitizeString('Hello <b>World</b>')).toBe('Hello World');
      expect(service.sanitizeString('<img src=x onerror=alert(1)>')).toBe('');
      expect(service.sanitizeString('<script>alert(1)</script>Hello')).toBe('Hello');
    });

    it('should remove javascript: protocol', () => {
      expect(service.sanitizeString('javascript:alert(1)')).toBe('alert(1)');
      expect(service.sanitizeString('JavaScript:alert(1)')).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      expect(service.sanitizeString('onclick=alert(1)')).toBe('alert(1)');
      expect(service.sanitizeString('onload=malicious()')).toBe('malicious()');
    });

    it('should trim whitespace', () => {
      expect(service.sanitizeString('  hello  ')).toBe('hello');
      expect(service.sanitizeString('\n\ttest\n\t')).toBe('test');
    });

    it('should handle empty or null input', () => {
      expect(service.sanitizeString('')).toBe('');
      expect(service.sanitizeString(null as unknown as string)).toBe('');
      expect(service.sanitizeString(undefined as unknown as string)).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      expect(service.sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    });

    it('should remove invalid characters', () => {
      // The sanitizeEmail removes < and > but keeps text between them
      expect(service.sanitizeEmail('test<script>@example.com')).toBe('testscript@example.com');
      // Parentheses are removed by the regex
      expect(service.sanitizeEmail('test(123)@example.com')).toBe('test123@example.com');
    });

    it('should trim whitespace', () => {
      expect(service.sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should allow valid email characters', () => {
      expect(service.sanitizeEmail('test.user+tag@example-domain.com')).toBe(
        'test.user+tag@example-domain.com',
      );
    });
  });

  describe('sanitizePin', () => {
    it('should remove non-numeric characters', () => {
      expect(service.sanitizePin('123abc456')).toBe('123456');
      expect(service.sanitizePin('12-34-56')).toBe('123456');
      expect(service.sanitizePin('abc')).toBe('');
    });

    it('should keep only digits', () => {
      expect(service.sanitizePin('123456')).toBe('123456');
      expect(service.sanitizePin('0000')).toBe('0000');
    });
  });

  describe('sanitizeName', () => {
    it('should allow letters, numbers, spaces, hyphens, apostrophes, and periods', () => {
      expect(service.sanitizeName("John O'Brien")).toBe("John O'Brien");
      expect(service.sanitizeName('Mary-Jane Smith')).toBe('Mary-Jane Smith');
      expect(service.sanitizeName('Dr. Johnson')).toBe('Dr. Johnson');
    });

    it('should remove special characters', () => {
      expect(service.sanitizeName('John@Smith')).toBe('JohnSmith');
      expect(service.sanitizeName('Test#123')).toBe('Test123');
    });

    it('should remove HTML and script content', () => {
      // Script tags and content are removed completely, then non-alphanumeric is filtered
      expect(service.sanitizeName('<script>alert(1)</script>John')).toBe('John');
      expect(service.sanitizeName('John<script>bad</script>Doe')).toBe('JohnDoe');
    });
  });

  describe('sanitizeUsername', () => {
    it('should convert to lowercase', () => {
      expect(service.sanitizeUsername('TestUser')).toBe('testuser');
    });

    it('should allow alphanumeric, underscores, and hyphens', () => {
      expect(service.sanitizeUsername('test_user-123')).toBe('test_user-123');
    });

    it('should remove invalid characters', () => {
      expect(service.sanitizeUsername('test@user')).toBe('testuser');
      expect(service.sanitizeUsername('test.user')).toBe('testuser');
    });

    it('should trim whitespace', () => {
      expect(service.sanitizeUsername('  testuser  ')).toBe('testuser');
    });
  });
});
