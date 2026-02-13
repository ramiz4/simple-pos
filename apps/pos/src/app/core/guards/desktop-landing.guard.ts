import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../application/services/auth.service';
import { PlatformService } from '../../infrastructure/services/platform.service';

export const desktopLandingGuard: CanActivateFn = async () => {
  const platformService = inject(PlatformService);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (platformService.isTauri()) {
    try {
      const setupComplete = await authService.isSetupComplete();

      if (!setupComplete) {
        router.navigate(['/initial-setup']);
      } else {
        router.navigate(['/staff-select']);
      }
      return false;
    } catch (error) {
      console.error('[DesktopLandingGuard] Error checking setup:', error);
      router.navigate(['/initial-setup']);
      return false;
    }
  }

  // Web logic: redirect logged-in users to staff selection
  if (authService.isLoggedIn()) {
    router.navigate(['/staff-select']);
    return false;
  }

  // Allow access to landing page for non-logged-in web users
  return true;
};
