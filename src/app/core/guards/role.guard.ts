import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../application/services/auth.service';
import { UserRoleEnum } from '../../domain/enums';

export const roleGuard = (allowedRoles: UserRoleEnum[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
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
export const kitchenGuard: CanActivateFn = roleGuard([UserRoleEnum.KITCHEN]);
export const cashierGuard: CanActivateFn = roleGuard([UserRoleEnum.CASHIER, UserRoleEnum.ADMIN]);
