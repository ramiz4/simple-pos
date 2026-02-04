import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../application/services/auth.service';
import { PlatformService } from '../../shared/utilities/platform.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformService = inject(PlatformService);

  if (authService.isLoggedIn()) {
    return true;
  }

  // In Tauri, if setup is complete, we allow bypassing Account login (Email/Pass)
  // to go straight to Staff selection (PIN login).
  if (platformService.isTauri()) {
    const isSetupComplete = await authService.isSetupComplete();
    if (isSetupComplete) {
      return true;
    }
  }

  router.navigate(['/login']);
  return false;
};
