import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlatformService } from '../../infrastructure/services/platform.service';
import { UpdateService } from './update.service';

describe('UpdateService', () => {
  let service: UpdateService;
  let versionUpdates$: Subject<VersionReadyEvent>;
  let mockSwUpdate: {
    isEnabled: boolean;
    checkForUpdate: ReturnType<typeof vi.fn>;
    versionUpdates: Subject<VersionReadyEvent>;
    activateUpdate: ReturnType<typeof vi.fn>;
  };
  let mockPlatformService: { isTauri: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    versionUpdates$ = new Subject<VersionReadyEvent>();

    mockSwUpdate = {
      isEnabled: true,
      checkForUpdate: vi.fn().mockResolvedValue(false),
      versionUpdates: versionUpdates$,
      activateUpdate: vi.fn().mockResolvedValue(undefined),
    };

    mockPlatformService = {
      isTauri: vi.fn().mockReturnValue(false),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdateService,
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: PlatformService, useValue: mockPlatformService },
      ],
    });

    service = TestBed.inject(UpdateService);
  });

  afterEach(() => {
    // Remove the visibilitychange listener and clear the periodic interval
    // registered by the service under test to prevent accumulation across tests.
    service.ngOnDestroy();
    vi.useRealTimers();
  });

  it('should initialize with no update available', () => {
    expect(service.updateAvailable()).toBe(false);
    expect(service.updateStatus()).toBeNull();
  });

  it('should set updateAvailable when VERSION_READY event is received', () => {
    const event = {
      type: 'VERSION_READY',
      currentVersion: { hash: 'abc123' },
      latestVersion: { hash: 'def456' },
    } as VersionReadyEvent;

    versionUpdates$.next(event);

    expect(service.updateAvailable()).toBe(true);
    expect(service.updateStatus()).toBe('New version available');
  });

  it('should call checkForUpdate when visibilitychange fires and document becomes visible', () => {
    // Reset mock to track calls after service construction
    mockSwUpdate.checkForUpdate.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('should not call checkForUpdate when visibilitychange fires but document is hidden', () => {
    mockSwUpdate.checkForUpdate.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();
  });

  it('should not call checkForUpdate on visibilitychange when swUpdate is disabled', () => {
    const disabledCheckForUpdate = vi.fn().mockResolvedValue(false);
    const disabledSwUpdate = {
      ...mockSwUpdate,
      isEnabled: false,
      checkForUpdate: disabledCheckForUpdate,
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        UpdateService,
        { provide: SwUpdate, useValue: disabledSwUpdate },
        { provide: PlatformService, useValue: mockPlatformService },
      ],
    });

    const disabledService = TestBed.inject(UpdateService);

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    expect(disabledCheckForUpdate).not.toHaveBeenCalled();

    disabledService.ngOnDestroy();
  });

  it('should call checkForUpdate every 6 hours via periodic interval', () => {
    vi.useFakeTimers();

    // Re-create service after fake timers are active so the interval is captured
    service.ngOnDestroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        UpdateService,
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: PlatformService, useValue: mockPlatformService },
      ],
    });
    service = TestBed.inject(UpdateService);
    mockSwUpdate.checkForUpdate.mockClear();

    // Advance 6 hours — one interval tick
    vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1);

    // Advance another 6 hours — second tick
    vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('should stop the periodic interval after ngOnDestroy', () => {
    vi.useFakeTimers();

    // Re-create service after fake timers are active so the interval is captured
    service.ngOnDestroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        UpdateService,
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: PlatformService, useValue: mockPlatformService },
      ],
    });
    service = TestBed.inject(UpdateService);
    mockSwUpdate.checkForUpdate.mockClear();

    service.ngOnDestroy();

    // Advance well past the 6-hour mark — interval should not fire
    vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();
  });

  it('should activate update for PWA when applyUpdate is called', async () => {
    await service.applyUpdate();

    expect(mockSwUpdate.activateUpdate).toHaveBeenCalled();
  });
});
