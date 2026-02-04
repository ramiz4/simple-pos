import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../application/services/auth.service';
import { PlatformService } from '../../shared/utilities/platform.service';
import { desktopLandingGuard } from './desktop-landing.guard';

describe('desktopLandingGuard', () => {
  let platformService: any;
  let authService: any;
  let router: any;

  beforeEach(() => {
    // Create mocks
    platformService = {
      isTauri: vi.fn(),
    };

    authService = {
      isLoggedIn: vi.fn(),
    };

    router = {
      navigate: vi.fn(),
    };

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        { provide: PlatformService, useValue: platformService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  describe('Web platform behavior', () => {
    it('should allow access to landing page when running on web platform', () => {
      platformService.isTauri.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => desktopLandingGuard());

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Desktop platform behavior - not logged in', () => {
    it('should redirect to /login when running on desktop and user is not logged in', () => {
      platformService.isTauri.mockReturnValue(true);
      authService.isLoggedIn.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => desktopLandingGuard());

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(router.navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Desktop platform behavior - logged in', () => {
    it('should redirect to /dashboard when running on desktop and user is logged in', () => {
      platformService.isTauri.mockReturnValue(true);
      authService.isLoggedIn.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => desktopLandingGuard());

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(router.navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Service interaction validation', () => {
    it('should check platform before checking authentication', () => {
      platformService.isTauri.mockReturnValue(false);
      authService.isLoggedIn.mockReturnValue(true);

      TestBed.runInInjectionContext(() => desktopLandingGuard());

      // On web platform, authentication should not be checked
      expect(platformService.isTauri).toHaveBeenCalled();
      expect(authService.isLoggedIn).not.toHaveBeenCalled();
    });

    it('should check authentication when on desktop platform', () => {
      platformService.isTauri.mockReturnValue(true);
      authService.isLoggedIn.mockReturnValue(false);

      TestBed.runInInjectionContext(() => desktopLandingGuard());

      expect(platformService.isTauri).toHaveBeenCalled();
      expect(authService.isLoggedIn).toHaveBeenCalled();
    });
  });

  describe('Return value validation', () => {
    it('should return boolean false when redirecting on desktop', () => {
      platformService.isTauri.mockReturnValue(true);
      authService.isLoggedIn.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => desktopLandingGuard());

      expect(typeof result).toBe('boolean');
      expect(result).toBe(false);
    });

    it('should return boolean true when allowing access on web', () => {
      platformService.isTauri.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => desktopLandingGuard());

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });
});
