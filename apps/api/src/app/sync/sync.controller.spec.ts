import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

describe('SyncController', () => {
  let controller: SyncController;
  let syncService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    syncService = {
      push: vi.fn().mockResolvedValue({
        success: true,
        conflicts: [],
        accepted: [],
        rejected: [],
        syncedAt: new Date().toISOString(),
      }),
      pull: vi.fn().mockResolvedValue({
        changes: [],
        deletions: [],
        syncedAt: new Date().toISOString(),
        hasMore: false,
      }),
      listOpenConflicts: vi.fn().mockResolvedValue([]),
      resolveConflict: vi.fn().mockResolvedValue({
        success: true,
        conflictId: 'conflict-1',
        syncedAt: new Date().toISOString(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: syncService,
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
  });

  it('should expose status without auth', () => {
    const result = controller.status();

    expect(result.online).toBe(true);
    expect(result.mode).toBe('cloud');
  });

  it('should call push service with tenant context', async () => {
    await controller.push('tenant-1', {
      tenantId: 'tenant-1',
      deviceId: 'device-1',
      changes: [],
    });

    expect(syncService.push).toHaveBeenCalledWith('tenant-1', 'device-1', []);
  });

  it('should call pull service with parsed params', async () => {
    await controller.pull('tenant-1', 'product,order', undefined, undefined, '100');

    expect(syncService.pull).toHaveBeenCalledWith(
      'tenant-1',
      ['product', 'order'],
      undefined,
      undefined,
      100,
    );
  });
});
