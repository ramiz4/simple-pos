import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../application/services/auth.service';
import { PlatformService } from '../../shared/utilities/platform.service';

export const desktopLandingGuard: CanActivateFn = () => {
  const platformService = inject(PlatformService);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (platformService.isTauri()) {
    const target = authService.isLoggedIn() ? '/dashboard' : '/login';
    router.navigate([target]);
    return false;
  }
  return true;
};
