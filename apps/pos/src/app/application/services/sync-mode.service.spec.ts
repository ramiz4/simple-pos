import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CloudSyncClientService } from '../../infrastructure/http/cloud-sync-client.service';
import { AuthService } from './auth.service';
import { SyncModeService } from './sync-mode.service';

describe('SyncModeService', () => {
  let service: SyncModeService;
  let cloudSyncClient: { status: ReturnType<typeof vi.fn> };
  let authService: { hasCloudSession: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    cloudSyncClient = {
      status: vi
        .fn()
        .mockResolvedValue({ online: true, mode: 'cloud', serverTime: new Date().toISOString() }),
    };

    authService = {
      hasCloudSession: vi.fn().mockReturnValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        SyncModeService,
        { provide: CloudSyncClientService, useValue: cloudSyncClient },
        { provide: AuthService, useValue: authService },
      ],
    });

    service = TestBed.inject(SyncModeService);
  });

  it('should set hybrid mode when backend is reachable and cloud session exists', async () => {
    await service.refreshConnectivity();

    expect(service.backendReachable()).toBe(true);
    expect(service.mode()).toBe('hybrid');
  });

  it('should fall back to local mode when backend status fails', async () => {
    cloudSyncClient.status.mockRejectedValueOnce(new Error('offline'));

    await service.refreshConnectivity();

    expect(service.backendReachable()).toBe(false);
    expect(service.mode()).toBe('local');
  });
});
