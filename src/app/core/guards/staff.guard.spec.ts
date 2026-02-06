import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../application/services/auth.service';
import { staffGuard } from './staff.guard';

describe('staffGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => staffGuard(...guardParameters));

  let authServiceSpy: { isLoggedIn: any; isStaffActive: any };
  let routerSpy: { navigate: any };

  beforeEach(() => {
    authServiceSpy = {
      isLoggedIn: vi.fn(),
      isStaffActive: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  describe('Successful authorization - Full access granted', () => {
    it('should allow access when user is logged in and staff is active', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(authServiceSpy.isStaffActive).toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should check staff status after confirming login', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(authServiceSpy.isStaffActive).toHaveBeenCalled();
    });

    it('should not navigate when both checks pass', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Partial authorization - Logged in but no active staff', () => {
    it('should redirect to /staff-select when logged in but staff not active', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
    });

    it('should check staff status when logged in', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(authServiceSpy.isStaffActive).toHaveBeenCalled();
    });

    it('should not check staff status before confirming login', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(authServiceSpy.isStaffActive).not.toHaveBeenCalled();
    });
  });

  describe('No authorization - Not logged in', () => {
    it('should redirect to /login when user is not logged in', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not check staff status when not logged in', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(authServiceSpy.isStaffActive).not.toHaveBeenCalled();
    });

    it('should short-circuit on login check failure', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(authServiceSpy.isStaffActive).not.toHaveBeenCalled();
    });
  });

  describe('Navigation targets based on authentication state', () => {
    it('should navigate to /login for unauthenticated users', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
    });

    it('should navigate to /staff-select for authenticated users without active staff', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
      expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
    });

    it('should not navigate for fully authenticated users', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Guard behavior with route snapshots', () => {
    it('should work with empty route snapshot', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
    });

    it('should work with route snapshot containing params', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      const routeSnapshot = {
        params: { id: '123' },
        queryParams: { action: 'edit' },
      } as unknown as ActivatedRouteSnapshot;

      const result = executeGuard(routeSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
    });

    it('should work with route snapshot containing data', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      const routeSnapshot = {
        data: { title: 'Dashboard' },
      } as unknown as ActivatedRouteSnapshot;

      const result = executeGuard(routeSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
    });

    it('should handle complex route snapshots with nested routes', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      const routeSnapshot = {
        params: { id: '456' },
        queryParams: { view: 'detailed' },
        data: { requiresAuth: true },
        parent: {} as ActivatedRouteSnapshot,
      } as unknown as ActivatedRouteSnapshot;

      const result = executeGuard(routeSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
    });
  });

  describe('Authentication flow scenarios', () => {
    it('should handle fresh session (not logged in, no staff)', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      authServiceSpy.isStaffActive.mockReturnValue(false);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle email/password login without PIN unlock', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
    });

    it('should handle full authentication flow (email + PIN)', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Security: Two-factor authentication pattern', () => {
    it('should require both email/password AND staff PIN', () => {
      // First factor (email/password) only
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);

      const result1 = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result1).toBe(false);

      // Both factors
      authServiceSpy.isStaffActive.mockReturnValue(true);

      const result2 = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result2).toBe(true);
    });

    it('should not grant access with staff active but not logged in', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should enforce authentication order: login first, then staff', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      // Staff check should not be called if not logged in
      expect(authServiceSpy.isStaffActive).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle isLoggedIn returning undefined', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(undefined);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle isLoggedIn returning null', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(null);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
    });

    it('should handle isStaffActive returning undefined', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(undefined);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
    });

    it('should handle isStaffActive returning null', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(null);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
    });

    it('should handle both returning falsy values', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(0);
      authServiceSpy.isStaffActive.mockReturnValue('');

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
    });
  });

  describe('Call order and efficiency', () => {
    it('should call isLoggedIn before isStaffActive', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      const loginCallOrder = authServiceSpy.isLoggedIn.mock.invocationCallOrder[0];
      const staffCallOrder = authServiceSpy.isStaffActive.mock.invocationCallOrder[0];

      expect(loginCallOrder).toBeLessThan(staffCallOrder);
    });

    it('should not make unnecessary calls when short-circuiting', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(authServiceSpy.isLoggedIn).toHaveBeenCalledTimes(1);
      expect(authServiceSpy.isStaffActive).not.toHaveBeenCalled();
    });

    it('should call navigate exactly once per failed guard check', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
    });

    it('should make all necessary calls when fully authenticated', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(authServiceSpy.isLoggedIn).toHaveBeenCalledTimes(1);
      expect(authServiceSpy.isStaffActive).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Multiple guard executions', () => {
    it('should handle multiple consecutive guard checks independently', () => {
      // First check - not logged in
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      const result1 = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      expect(result1).toBe(false);

      // Clear mocks
      routerSpy.navigate.mockClear();

      // Second check - logged in but no staff
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);
      const result2 = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      expect(result2).toBe(false);

      // Clear mocks
      routerSpy.navigate.mockClear();

      // Third check - fully authenticated
      authServiceSpy.isStaffActive.mockReturnValue(true);
      const result3 = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      expect(result3).toBe(true);
    });

    it('should not retain state between guard executions', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
    });
  });

  describe('Guard documentation alignment', () => {
    it('should enforce staff-level authentication as documented', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);

      const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      expect(authServiceSpy.isStaffActive).toHaveBeenCalled();
    });

    it('should redirect to staff-select for email/password auth without PIN', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);

      executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
    });
  });
});
