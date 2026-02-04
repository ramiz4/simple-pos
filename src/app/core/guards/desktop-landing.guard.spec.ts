import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../application/services/auth.service';
import { PlatformService } from '../../shared/utilities/platform.service';
import { desktopLandingGuard } from './desktop-landing.guard';

describe('desktopLandingGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => desktopLandingGuard(...guardParameters));

  let authServiceSpy: { isSetupComplete: any; isLoggedIn: any };
  let routerSpy: { navigate: any };
  let platformServiceSpy: { isTauri: any };

  beforeEach(() => {
    authServiceSpy = {
      isSetupComplete: vi.fn(),
      isLoggedIn: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn(),
    };
    platformServiceSpy = {
      isTauri: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PlatformService, useValue: platformServiceSpy },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow navigation if NOT tauri and NOT logged in', async () => {
    platformServiceSpy.isTauri.mockReturnValue(false);
    authServiceSpy.isLoggedIn.mockReturnValue(false);

    const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    expect(result).toBe(true);
    expect(authServiceSpy.isSetupComplete).not.toHaveBeenCalled();
  });

  it('should redirect to /initial-setup if Tauri and setup NOT complete', async () => {
    platformServiceSpy.isTauri.mockReturnValue(true);
    authServiceSpy.isSetupComplete.mockResolvedValue(false);

    const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/initial-setup']);
  });

  it('should redirect to /staff-select if Tauri and setup complete', async () => {
    platformServiceSpy.isTauri.mockReturnValue(true);
    authServiceSpy.isSetupComplete.mockResolvedValue(true);

    const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
  });

  it('should redirect to /staff-select if Tauri, setup complete (login status irrelevant)', async () => {
    platformServiceSpy.isTauri.mockReturnValue(true);
    authServiceSpy.isSetupComplete.mockResolvedValue(true);
    authServiceSpy.isLoggedIn.mockReturnValue(false);

    const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
  });

  it('should fallback to /initial-setup if check errors', async () => {
    platformServiceSpy.isTauri.mockReturnValue(true);
    authServiceSpy.isSetupComplete.mockRejectedValue('Error');

    const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/initial-setup']);
  });
});
