import { beforeEach, describe, expect, it } from 'vitest';
import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterService', () => {
  let service: RateLimiterService;

  beforeEach(() => {
    service = new RateLimiterService();
    service.clearAll();
  });

  describe('isAllowed', () => {
    it('should allow first attempt', () => {
      expect(service.isAllowed('test-key')).toBe(true);
    });

    it('should allow up to MAX_ATTEMPTS', () => {
      const key = 'test-key';

      // First 5 attempts should be allowed (checking then recording)
      for (let i = 0; i < 5; i++) {
        expect(service.isAllowed(key)).toBe(true);
        service.recordAttempt(key);
      }

      // 6th attempt should be blocked
      expect(service.isAllowed(key)).toBe(false);
    });

    it('should block after MAX_ATTEMPTS exceeded', () => {
      const key = 'test-key';

      // Record 5 attempts
      for (let i = 0; i < 5; i++) {
        service.recordAttempt(key);
      }

      // Should now be blocked
      expect(service.isAllowed(key)).toBe(false);
    });

    it('should return blocked time remaining', () => {
      const key = 'test-key';

      // Record 5 attempts to trigger block
      for (let i = 0; i < 5; i++) {
        service.recordAttempt(key);
      }

      // Check if blocked
      expect(service.isAllowed(key)).toBe(false);

      // Get remaining time
      const remainingTime = service.getBlockedTimeRemaining(key);
      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThanOrEqual(30 * 60); // 30 minutes max
    });
  });

  describe('recordAttempt', () => {
    it('should record first attempt', () => {
      service.recordAttempt('test-key');
      expect(service.isAllowed('test-key')).toBe(true);
    });

    it('should increment attempt count', () => {
      const key = 'test-key';

      for (let i = 0; i < 5; i++) {
        service.recordAttempt(key);
      }

      // After 5 attempts, should be blocked
      expect(service.isAllowed(key)).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset attempts for a key', () => {
      const key = 'test-key';

      // Record some attempts
      for (let i = 0; i < 3; i++) {
        service.recordAttempt(key);
      }

      // Reset
      service.reset(key);

      // Should be allowed again
      expect(service.isAllowed(key)).toBe(true);
    });

    it('should not affect other keys', () => {
      service.recordAttempt('key1');
      service.recordAttempt('key2');

      service.reset('key1');

      // key1 should be reset
      expect(service.isAllowed('key1')).toBe(true);

      // key2 should still have attempts recorded
      service.recordAttempt('key2');
      expect(service.isAllowed('key2')).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should clear all rate limit records', () => {
      service.recordAttempt('key1');
      service.recordAttempt('key2');
      service.recordAttempt('key3');

      service.clearAll();

      expect(service.isAllowed('key1')).toBe(true);
      expect(service.isAllowed('key2')).toBe(true);
      expect(service.isAllowed('key3')).toBe(true);
    });
  });

  describe('getBlockedTimeRemaining', () => {
    it('should return 0 for non-blocked key', () => {
      expect(service.getBlockedTimeRemaining('test-key')).toBe(0);
    });

    it('should return 0 for key with few attempts', () => {
      const key = 'test-key';
      service.recordAttempt(key);
      expect(service.getBlockedTimeRemaining(key)).toBe(0);
    });
  });
});
