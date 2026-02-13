import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../application/services/auth.service';
import { PlatformService } from '../../infrastructure/services/platform.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformService = inject(PlatformService);

  if (authService.isLoggedIn()) {
    return true;
  }

  /**
   * Security consideration: Tauri desktop bypass for account login
   *
   * In Tauri, if setup is complete, we allow bypassing account login (email/password)
   * to go straight to staff selection (PIN login). This is intentional for the desktop flow
   * where users authenticate via PIN at the staff selection screen.
   *
   * IMPORTANT: This bypass only affects routes protected by authGuard, which should only be
   * the /staff-select route. All sensitive routes (dashboard, POS, reports, admin) MUST use
   * staffGuard instead of authGuard to ensure proper staff-level authentication.
   *
   * Current usage (verified in app.routes.ts):
   * - authGuard: /staff-select (intentionally accessible in Tauri after setup)
   * - staffGuard: /dashboard, /pos/*, /reports/*, /admin/* (requires staff authentication)
   */
  if (platformService.isTauri()) {
    const isSetupComplete = await authService.isSetupComplete();
    if (isSetupComplete) {
      return true;
    }
  }

  router.navigate(['/login']);
  return false;
};
