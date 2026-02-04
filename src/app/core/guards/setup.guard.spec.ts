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
import { setupGuard } from './setup.guard';

describe('setupGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => setupGuard(...guardParameters));

  let authServiceSpy: { isSetupComplete: any };
  let routerSpy: { navigate: any; createUrlTree: any };
  let platformServiceSpy: { isTauri: any };

  beforeEach(() => {
    authServiceSpy = {
      isSetupComplete: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn(),
      createUrlTree: vi.fn().mockReturnValue('url-tree'),
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

  it('should redirect to /login if NOT Tauri', async () => {
    platformServiceSpy.isTauri.mockReturnValue(false);

    const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    expect(result).toBe('url-tree');
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /login if setup is complete (and is Tauri)', async () => {
    platformServiceSpy.isTauri.mockReturnValue(true);
    authServiceSpy.isSetupComplete.mockResolvedValue(true);

    const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/staff-select']);
  });

  it('should allow access if setup is NOT complete', async () => {
    platformServiceSpy.isTauri.mockReturnValue(true);
    authServiceSpy.isSetupComplete.mockResolvedValue(false);

    const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    expect(result).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should allow access (fail safe) if isSetupComplete errors', async () => {
    platformServiceSpy.isTauri.mockReturnValue(true);
    authServiceSpy.isSetupComplete.mockRejectedValue('Error');

    const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    expect(result).toBe(true);
  });
});
