import { Injectable } from '@angular/core';

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

/**
 * Client-side rate limiting service to prevent brute force attacks
 */
@Injectable({
  providedIn: 'root',
})
export class RateLimiterService {
  private attempts: Map<string, RateLimitRecord> = new Map();

  // Default configuration
  private readonly MAX_ATTEMPTS = 5;
  private readonly TIME_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Check if an action is allowed for the given key
   * @param key Unique identifier (e.g., 'login:username' or 'register:email')
   * @returns true if action is allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    // If no record exists, allow the action
    if (!record) {
      return true;
    }

    // Check if currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return false;
    }

    // If blocked period has expired, reset
    if (record.blockedUntil && now >= record.blockedUntil) {
      this.attempts.delete(key);
      return true;
    }

    // Check if time window has expired
    if (now - record.firstAttempt > this.TIME_WINDOW_MS) {
      this.attempts.delete(key);
      return true;
    }

    // Check if max attempts exceeded
    if (record.attempts >= this.MAX_ATTEMPTS) {
      record.blockedUntil = now + this.BLOCK_DURATION_MS;
      return false;
    }

    return true;
  }

  /**
   * Record an attempt for the given key
   * @param key Unique identifier
   */
  recordAttempt(key: string): void {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, {
        attempts: 1,
        firstAttempt: now,
      });
    } else if (now - record.firstAttempt > this.TIME_WINDOW_MS) {
      // Reset if time window expired
      this.attempts.set(key, {
        attempts: 1,
        firstAttempt: now,
      });
    } else {
      record.attempts++;
    }
  }

  /**
   * Get remaining time until unblocked (in seconds)
   * @param key Unique identifier
   * @returns seconds until unblocked, or 0 if not blocked
   */
  getBlockedTimeRemaining(key: string): number {
    const record = this.attempts.get(key);
    if (!record || !record.blockedUntil) {
      return 0;
    }

    const now = Date.now();
    if (now >= record.blockedUntil) {
      return 0;
    }

    return Math.ceil((record.blockedUntil - now) / 1000);
  }

  /**
   * Reset attempts for a key (use after successful action)
   * @param key Unique identifier
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limit records
   */
  clearAll(): void {
    this.attempts.clear();
  }
}
