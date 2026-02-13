import { TestBed } from '@angular/core/testing';
import { getVersion } from '@tauri-apps/api/app';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { PlatformService } from '../../infrastructure/services/platform.service';
import { AppInfoService } from './app-info.service';

vi.mock('@tauri-apps/api/app', () => ({
  getVersion: vi.fn(),
}));

describe('AppInfoService', () => {
  let service: AppInfoService;
  let mockPlatformService: { isTauri: Mock; isWeb: Mock };

  beforeEach(() => {
    mockPlatformService = {
      isTauri: vi.fn(),
      isWeb: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AppInfoService, { provide: PlatformService, useValue: mockPlatformService }],
    });
  });

  it('should be created', () => {
    service = TestBed.inject(AppInfoService);
    expect(service).toBeTruthy();
  });

  it('should use default version on web platform', () => {
    mockPlatformService.isTauri.mockReturnValue(false);
    service = TestBed.inject(AppInfoService);
    expect(service.version()).toBeDefined();
  });

  it('should fetch version from Tauri on desktop platform', async () => {
    mockPlatformService.isTauri.mockReturnValue(true);
    vi.mocked(getVersion).mockResolvedValue('2.0.0');

    service = TestBed.inject(AppInfoService);

    // Wait for the async task in constructor
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.version()).toBe('2.0.0');
  });
});
