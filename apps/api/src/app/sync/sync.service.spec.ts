import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@simple-pos/api-common';
import { ConflictResolutionService } from './conflict-resolution.service';
import { EntitySyncAdapterRegistry } from './entity-sync-adapter.registry';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;
  let prisma: {
    withRls: ReturnType<typeof vi.fn>;
  };

  const txMock = {
    syncDocument: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    syncConflict: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    prisma = {
      withRls: vi.fn(async (_tenantId: string, fn: (tx: typeof txMock) => Promise<unknown>) =>
        fn(txMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        EntitySyncAdapterRegistry,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConflictResolutionService,
          useValue: {
            resolve: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);

    vi.clearAllMocks();
  });

  it('should accept and create a new sync document', async () => {
    txMock.syncDocument.findFirst.mockResolvedValue(null);
    txMock.syncDocument.create.mockResolvedValue({});

    const result = await service.push('tenant-1', 'device-1', [
      {
        entity: 'product',
        operation: 'CREATE',
        localId: 12,
        data: { name: 'Coffee' },
        version: 1,
        timestamp: new Date().toISOString(),
      },
    ]);

    expect(result.accepted).toHaveLength(1);
    expect(result.conflicts).toHaveLength(0);
    expect(txMock.syncDocument.create).toHaveBeenCalledTimes(1);
  });

  it('should create conflict when client version is stale', async () => {
    txMock.syncDocument.findFirst.mockResolvedValue({
      id: 'doc-1',
      cloudId: 'cloud-1',
      version: 4,
      data: { name: 'Server coffee' },
    });
    txMock.syncConflict.create.mockResolvedValue({
      id: 'conflict-1',
      entity: 'product',
      cloudId: 'cloud-1',
      localId: '12',
      strategy: 'SERVER_WINS',
      serverVersion: 4,
      clientVersion: 2,
      serverData: { name: 'Server coffee' },
      clientData: { name: 'Client coffee' },
      resolved: false,
    });

    const result = await service.push('tenant-1', 'device-1', [
      {
        entity: 'product',
        operation: 'UPDATE',
        localId: 12,
        cloudId: 'cloud-1',
        data: { name: 'Client coffee' },
        version: 2,
        timestamp: new Date().toISOString(),
      },
    ]);

    expect(result.success).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(txMock.syncConflict.create).toHaveBeenCalledTimes(1);
  });

  it('should throw on invalid timestamp', async () => {
    txMock.syncDocument.findFirst.mockResolvedValue(null);

    await expect(
      service.push('tenant-1', 'device-1', [
        {
          entity: 'product',
          operation: 'CREATE',
          localId: 12,
          data: { name: 'Coffee' },
          version: 1,
          timestamp: 'invalid',
        },
      ]),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return pull delta with cursor', async () => {
    const now = new Date();
    txMock.syncDocument.findMany.mockResolvedValue([
      {
        id: 'doc-1',
        tenantId: 'tenant-1',
        entity: 'product',
        cloudId: 'cloud-1',
        localId: '1',
        data: { id: 1, name: 'Coffee' },
        version: 2,
        isDeleted: false,
        updatedAt: now,
      },
    ]);

    const result = await service.pull('tenant-1', ['product'], undefined, undefined, 100);

    expect(result.changes).toHaveLength(1);
    expect(result.deletions).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });
});
