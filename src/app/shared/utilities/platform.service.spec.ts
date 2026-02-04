import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PlatformService } from './platform.service';

describe('PlatformService', () => {
  let originalTauri: any;

  beforeEach(() => {
    // Store the original __TAURI__ if it exists
    originalTauri = (window as any).__TAURI__;
  });

  afterEach(() => {
    // Restore the original __TAURI__
    if (originalTauri === undefined) {
      delete (window as any).__TAURI__;
    } else {
      (window as any).__TAURI__ = originalTauri;
    }
  });

  describe('Tauri environment detection', () => {
    it('should detect Tauri environment when __TAURI__ is present', () => {
      // Mock window with __TAURI__ object
      (window as any).__TAURI__ = {};

      const service = new PlatformService();
      expect(service.isTauri()).toBe(true);
      expect(service.isWeb()).toBe(false);
    });

    it('should not detect Tauri when __TAURI__ is undefined', () => {
      // Ensure __TAURI__ is undefined
      delete (window as any).__TAURI__;

      const service = new PlatformService();
      expect(service.isTauri()).toBe(false);
      expect(service.isWeb()).toBe(true);
    });

    it('should not detect Tauri when __TAURI__ is not an object', () => {
      // Mock window with __TAURI__ as string (invalid)
      (window as any).__TAURI__ = 'string';

      const service = new PlatformService();
      expect(service.isTauri()).toBe(false);
      expect(service.isWeb()).toBe(true);
    });

    it('should not detect Tauri when __TAURI__ is null', () => {
      // Mock window with __TAURI__ as null (edge case: typeof null === 'object')
      (window as any).__TAURI__ = null;

      const service = new PlatformService();
      expect(service.isTauri()).toBe(false);
      expect(service.isWeb()).toBe(true);
    });
  });

  describe('Web environment detection', () => {
    it('should detect web environment when window has no __TAURI__', () => {
      // Ensure __TAURI__ is undefined
      delete (window as any).__TAURI__;

      const service = new PlatformService();
      expect(service.isWeb()).toBe(true);
      expect(service.isTauri()).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should return consistent results across multiple calls', () => {
      (window as any).__TAURI__ = {};

      const service = new PlatformService();

      // Call multiple times to ensure consistency
      expect(service.isTauri()).toBe(true);
      expect(service.isTauri()).toBe(true);
      expect(service.isWeb()).toBe(false);
      expect(service.isWeb()).toBe(false);
    });
  });

  describe('Return value validation', () => {
    it('should return correct boolean values for isTauri()', () => {
      (window as any).__TAURI__ = {};

      const service = new PlatformService();
      const result = service.isTauri();

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should return correct boolean values for isWeb()', () => {
      delete (window as any).__TAURI__;

      const service = new PlatformService();
      const result = service.isWeb();

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should have isTauri() and isWeb() return opposite values', () => {
      (window as any).__TAURI__ = {};

      const service = new PlatformService();

      expect(service.isTauri()).toBe(!service.isWeb());
      expect(service.isWeb()).toBe(!service.isTauri());
    });
  });
});
