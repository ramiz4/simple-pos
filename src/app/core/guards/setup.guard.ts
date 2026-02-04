import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../application/services/auth.service';
import { PlatformService } from '../../shared/utilities/platform.service';

export const setupGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformService = inject(PlatformService);

  if (!platformService.isTauri()) {
    return router.createUrlTree(['/login']);
  }

  try {
    const isComplete = await authService.isSetupComplete();
    if (isComplete) {
      // If setup is done, redirect to staff-select (or login)
      router.navigate(['/staff-select']);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking setup status', error);
    // In case of error (e.g. DB error), maybe allow access or show error page?
    // Safer to allow access to setup or login?
    // If DB is broken, setup might not work either.
    return true;
  }
};
