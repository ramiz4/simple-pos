import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../application/services/auth.service';
import { PlatformService } from '../../shared/utilities/platform.service';

export const desktopLandingGuard: CanActivateFn = async () => {
  const platformService = inject(PlatformService);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (platformService.isTauri()) {
    try {
      const isSetupComplete = await authService.isSetupComplete();

      if (!isSetupComplete) {
        router.navigate(['/initial-setup']);
        return false;
      }

      const target = authService.isLoggedIn() ? '/dashboard' : '/login';
      router.navigate([target]);
      return false;
    } catch (e) {
      console.error('Error in desktop landing guard', e);
      // Fallback to login on error
      router.navigate(['/login']);
      return false;
    }
  }
  return true;
};
