import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../application/services/auth.service';
import { UserRoleEnum } from '../../domain/enums';
import { adminGuard, cashierGuard, kitchenGuard, roleGuard } from './role.guard';

describe('roleGuard', () => {
  let authServiceSpy: { isLoggedIn: any; isStaffActive: any; hasAnyRole: any };
  let routerSpy: { navigate: any };

  beforeEach(() => {
    authServiceSpy = {
      isLoggedIn: vi.fn(),
      isStaffActive: vi.fn(),
      hasAnyRole: vi.fn(),
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

  describe('roleGuard factory function', () => {
    it('should create a guard with allowed roles', () => {
      const guard = roleGuard([UserRoleEnum.ADMIN]);
      expect(guard).toBeTruthy();
      expect(typeof guard).toBe('function');
    });

    it('should create a guard with multiple allowed roles', () => {
      const guard = roleGuard([UserRoleEnum.ADMIN, UserRoleEnum.CASHIER]);
      expect(guard).toBeTruthy();
    });

    it('should create different guards for different role combinations', () => {
      const adminOnlyGuard = roleGuard([UserRoleEnum.ADMIN]);
      const cashierOnlyGuard = roleGuard([UserRoleEnum.CASHIER]);
      expect(adminOnlyGuard).not.toBe(cashierOnlyGuard);
    });
  });

  describe('Authentication checks', () => {
    it('should redirect to /login when user is not logged in', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      const guard = roleGuard([UserRoleEnum.ADMIN]);

      const result = TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      expect(authServiceSpy.isStaffActive).not.toHaveBeenCalled();
      expect(authServiceSpy.hasAnyRole).not.toHaveBeenCalled();
    });

    it('should check login status before checking staff status', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);
      const guard = roleGuard([UserRoleEnum.ADMIN]);

      TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(authServiceSpy.isStaffActive).not.toHaveBeenCalled();
    });
  });

  describe('Staff activation checks', () => {
    it('should redirect to /staff-select when logged in but staff not active', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);
      const guard = roleGuard([UserRoleEnum.ADMIN]);

      const result = TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
      expect(authServiceSpy.hasAnyRole).not.toHaveBeenCalled();
    });

    it('should check staff status after login check', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);
      const guard = roleGuard([UserRoleEnum.CASHIER]);

      TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(authServiceSpy.isStaffActive).toHaveBeenCalled();
    });
  });

  describe('Role-based authorization', () => {
    it('should allow access when user has required role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);
      const guard = roleGuard([UserRoleEnum.ADMIN]);

      const result = TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(true);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should pass correct roles to hasAnyRole method', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);
      const allowedRoles = [UserRoleEnum.ADMIN, UserRoleEnum.CASHIER];
      const guard = roleGuard(allowedRoles);

      TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith(allowedRoles);
    });

    it('should redirect to /unauthorized when user lacks required role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(false);
      const guard = roleGuard([UserRoleEnum.ADMIN]);

      const result = TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });

    it('should check role authorization only after login and staff checks pass', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);
      const guard = roleGuard([UserRoleEnum.KITCHEN]);

      TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(authServiceSpy.isStaffActive).toHaveBeenCalled();
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalled();
    });
  });

  describe('adminGuard (pre-configured guard)', () => {
    const executeAdminGuard: CanActivateFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

    it('should be created', () => {
      expect(executeAdminGuard).toBeTruthy();
    });

    it('should allow access for ADMIN role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);

      const result = executeAdminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith([UserRoleEnum.ADMIN]);
    });

    it('should deny access for non-ADMIN users', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(false);

      const result = executeAdminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });

    it('should redirect to /login when not authenticated', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);

      const result = executeAdminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should redirect to /staff-select when staff not active', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(false);

      const result = executeAdminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
    });
  });

  describe('kitchenGuard (pre-configured guard)', () => {
    const executeKitchenGuard: CanActivateFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => kitchenGuard(...guardParameters));

    it('should be created', () => {
      expect(executeKitchenGuard).toBeTruthy();
    });

    it('should allow access for KITCHEN role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);

      const result = executeKitchenGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith([
        UserRoleEnum.KITCHEN,
        UserRoleEnum.ADMIN,
      ]);
    });

    it('should allow access for ADMIN role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);

      const result = executeKitchenGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
    });

    it('should deny access for CASHIER role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(false);

      const result = executeKitchenGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });
  });

  describe('cashierGuard (pre-configured guard)', () => {
    const executeCashierGuard: CanActivateFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => cashierGuard(...guardParameters));

    it('should be created', () => {
      expect(executeCashierGuard).toBeTruthy();
    });

    it('should allow access for CASHIER role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);

      const result = executeCashierGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith([
        UserRoleEnum.CASHIER,
        UserRoleEnum.ADMIN,
      ]);
    });

    it('should allow access for ADMIN role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);

      const result = executeCashierGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(true);
    });

    it('should deny access for KITCHEN role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(false);

      const result = executeCashierGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });
  });

  describe('Multiple roles support', () => {
    it('should handle guard with empty roles array', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(false);
      const guard = roleGuard([]);

      const result = TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(false);
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith([]);
    });

    it('should handle guard with all role types', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);
      const allRoles = [
        UserRoleEnum.ADMIN,
        UserRoleEnum.CASHIER,
        UserRoleEnum.KITCHEN,
        UserRoleEnum.DRIVER,
      ];
      const guard = roleGuard(allRoles);

      const result = TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(true);
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith(allRoles);
    });
  });

  describe('Guard with route parameters', () => {
    it('should work with route snapshot containing params', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);
      const guard = roleGuard([UserRoleEnum.ADMIN]);
      const routeSnapshot = {
        params: { id: '123' },
        queryParams: { filter: 'active' },
      } as unknown as ActivatedRouteSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        guard(routeSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(true);
    });

    it('should work with empty route snapshot', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);
      const guard = roleGuard([UserRoleEnum.CASHIER]);

      const result = TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBe(true);
    });
  });

  describe('Navigation flow and call order', () => {
    it('should navigate only once per guard execution', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(false);
      const guard = roleGuard([UserRoleEnum.ADMIN]);

      TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
    });

    it('should not navigate when all checks pass', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);
      const guard = roleGuard([UserRoleEnum.ADMIN]);

      TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should perform checks in correct order: login -> staff -> role', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);
      const guard = roleGuard([UserRoleEnum.KITCHEN]);

      TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      const loginCallOrder = authServiceSpy.isLoggedIn.mock.invocationCallOrder[0];
      const staffCallOrder = authServiceSpy.isStaffActive.mock.invocationCallOrder[0];
      const roleCallOrder = authServiceSpy.hasAnyRole.mock.invocationCallOrder[0];

      expect(loginCallOrder).toBeLessThan(staffCallOrder);
      expect(staffCallOrder).toBeLessThan(roleCallOrder);
    });
  });

  describe('Security: Guard isolation', () => {
    it('should not affect other guards when one guard denies access', () => {
      authServiceSpy.isLoggedIn.mockReturnValue(true);
      authServiceSpy.isStaffActive.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(false);

      const guard1 = roleGuard([UserRoleEnum.ADMIN]);
      const guard2 = roleGuard([UserRoleEnum.CASHIER]);

      const result1 = TestBed.runInInjectionContext(() =>
        guard1({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      // Reset mocks for second guard
      routerSpy.navigate.mockClear();
      authServiceSpy.hasAnyRole.mockReturnValue(true);

      const result2 = TestBed.runInInjectionContext(() =>
        guard2({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });

    it('should evaluate each guard independently', () => {
      const guard1 = roleGuard([UserRoleEnum.ADMIN]);
      const guard2 = roleGuard([UserRoleEnum.ADMIN]);

      expect(guard1).not.toBe(guard2);
    });
  });
});
