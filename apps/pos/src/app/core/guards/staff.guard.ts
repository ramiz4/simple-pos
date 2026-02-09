import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../application/services/auth.service';

/**
 * Guard that ensures a staff member has been selected and "unlocked" via PIN.
 * If logged in but staff not active, redirects to /staff-select.
 */
export const staffGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    if (authService.isStaffActive()) {
      return true;
    }
    // Authenticated via Email/Pass but no staff active
    router.navigate(['/staff-select']);
    return false;
  }

  // Not logged in at all
  router.navigate(['/login']);
  return false;
};
