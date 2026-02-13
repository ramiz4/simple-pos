import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AuthService } from '../../application/services/auth.service';
import { PlatformService } from '../../infrastructure/services/platform.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authServiceSpy: { isLoggedIn: Mock; isSetupComplete: Mock };
  let routerSpy: { navigate: Mock };
  let platformServiceSpy: { isTauri: Mock };

  beforeEach(() => {
    authServiceSpy = {
      isLoggedIn: vi.fn(),
      isSetupComplete: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn(),
    };
    platformServiceSpy = {
      isTauri: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PlatformService, useValue: platformServiceSpy },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  describe('User is logged in', () => {
    it('should allow access when user is logged in', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);

      const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      expect(platformServiceSpy.isTauri).not.toHaveBeenCalled();
    });

    it('should not check platform or setup completion when user is logged in', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);

      await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(authServiceSpy.isSetupComplete).not.toHaveBeenCalled();
      expect(platformServiceSpy.isTauri).not.toHaveBeenCalled();
    });
  });

  describe('User is not logged in - Web platform', () => {
    it('should redirect to /login when user is not logged in on web', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(false);

      const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not check setup completion on web platform', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(false);

      await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(authServiceSpy.isSetupComplete).not.toHaveBeenCalled();
    });
  });

  describe('User is not logged in - Tauri platform with setup complete', () => {
    it('should allow access in Tauri when setup is complete (bypass for staff-select)', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(true);
      authServiceSpy.isSetupComplete.mockResolvedValue(true);

      const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(platformServiceSpy.isTauri).toHaveBeenCalled();
      expect(authServiceSpy.isSetupComplete).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should allow Tauri bypass even when navigation was attempted', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(true);
      authServiceSpy.isSetupComplete.mockResolvedValue(true);

      const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('User is not logged in - Tauri platform with setup incomplete', () => {
    it('should redirect to /login when setup is not complete in Tauri', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(true);
      authServiceSpy.isSetupComplete.mockResolvedValue(false);

      const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should check all conditions in correct order for incomplete setup', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(true);
      authServiceSpy.isSetupComplete.mockResolvedValue(false);

      await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(platformServiceSpy.isTauri).toHaveBeenCalled();
      expect(authServiceSpy.isSetupComplete).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Error handling', () => {
    it('should propagate error when isSetupComplete throws error', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(true);
      authServiceSpy.isSetupComplete.mockRejectedValue(new Error('Database error'));

      await expect(
        executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      ).rejects.toThrow('Database error');
    });

    it('should propagate error when setup complete check fails', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(true);
      authServiceSpy.isSetupComplete.mockRejectedValue(new Error('Generic error'));

      await expect(
        executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      ).rejects.toThrow('Generic error');
    });
  });

  describe('Guard behavior with different route snapshots', () => {
    it('should handle guard activation with empty route snapshot', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);

      const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
    });

    it('should work with route snapshot containing params', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      const routeSnapshot = {
        params: { id: '123' },
        queryParams: { filter: 'active' },
      } as unknown as ActivatedRouteSnapshot;

      const result = await executeGuard(routeSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
    });
  });

  describe('Security: Tauri desktop bypass considerations', () => {
    it('should only bypass on Tauri platform, not web', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(false);
      authServiceSpy.isSetupComplete.mockResolvedValue(true);

      const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      // Setup check should not be called on web
      expect(authServiceSpy.isSetupComplete).not.toHaveBeenCalled();
    });

    it('should require both Tauri platform AND setup complete for bypass', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(true);
      authServiceSpy.isSetupComplete.mockResolvedValue(false);

      const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should prioritize logged-in state over Tauri bypass', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      platformServiceSpy.isTauri.mockReturnValue(true);
      // Setup complete is not checked when already logged in
      authServiceSpy.isSetupComplete.mockResolvedValue(false);

      const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      // Should short-circuit and not check Tauri or setup
      expect(platformServiceSpy.isTauri).not.toHaveBeenCalled();
      expect(authServiceSpy.isSetupComplete).not.toHaveBeenCalled();
    });
  });

  describe('Navigation flow testing', () => {
    it('should call navigate with correct path when redirecting', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      platformServiceSpy.isTauri.mockReturnValue(false);

      await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not navigate when access is granted', async () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);

      await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});
