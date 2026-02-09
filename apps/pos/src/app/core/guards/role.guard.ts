import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRoleEnum } from '@simple-pos/shared/types';
import { AuthService } from '../../application/services/auth.service';

export const roleGuard = (allowedRoles: UserRoleEnum[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    if (!authService.isStaffActive()) {
      router.navigate(['/staff-select']);
      return false;
    }

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};

export const adminGuard: CanActivateFn = roleGuard([UserRoleEnum.ADMIN]);
export const kitchenGuard: CanActivateFn = roleGuard([UserRoleEnum.KITCHEN, UserRoleEnum.ADMIN]);
export const cashierGuard: CanActivateFn = roleGuard([UserRoleEnum.CASHIER, UserRoleEnum.ADMIN]);
