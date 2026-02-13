import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@simple-pos/api-common';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    tenant: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    order: {
      groupBy: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    syncConflict: {
      groupBy: ReturnType<typeof vi.fn>;
    };
    billingEvent: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      order: {
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
      syncConflict: {
        groupBy: vi.fn(),
      },
      billingEvent: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should list tenants with total', async () => {
    prisma.tenant.findMany.mockResolvedValue([{ id: 'tenant-1' }]);
    prisma.tenant.count.mockResolvedValue(1);

    const result = await service.listTenants({ search: 'tenant', limit: 10, offset: 0 });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('should suspend an existing tenant', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    prisma.tenant.update.mockResolvedValue({ id: 'tenant-1', status: 'SUSPENDED' });

    const result = await service.suspendTenant('tenant-1');

    expect(result.status).toBe('SUSPENDED');
  });

  it('should throw for missing tenant on activate', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);

    await expect(service.activateTenant('tenant-404')).rejects.toThrow(NotFoundException);
  });

  it('should calculate usage overview', async () => {
    prisma.tenant.findMany.mockResolvedValue([
      {
        id: 'tenant-1',
        name: 'Tenant One',
        subdomain: 'tenant-one',
        plan: 'FREE',
        status: 'ACTIVE',
        createdAt: new Date(),
        _count: {
          users: 2,
          products: 3,
          customers: 1,
          orders: 4,
          syncDocuments: 5,
        },
      },
    ]);
    prisma.tenant.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prisma.order.groupBy.mockResolvedValue([
      {
        tenantId: 'tenant-1',
        _count: { _all: 4 },
        _sum: { totalAmount: 120 },
      },
    ]);
    prisma.syncConflict.groupBy.mockResolvedValue([
      {
        tenantId: 'tenant-1',
        _count: { _all: 1 },
      },
    ]);

    const result = await service.usageOverview();

    expect(result.totals.totalTenants).toBe(1);
    expect(result.totals.totalRevenue30d).toBe(120);
    expect(result.tenants[0].unresolvedSyncConflicts).toBe(1);
  });

  it('should produce platform analytics', async () => {
    prisma.order.findMany.mockResolvedValue([
      { createdAt: new Date(), totalAmount: 10 },
      { createdAt: new Date(), totalAmount: 5 },
    ]);
    prisma.billingEvent.findMany.mockResolvedValue([{ createdAt: new Date(), eventType: 'evt' }]);
    prisma.tenant.findMany.mockResolvedValue([{ createdAt: new Date() }]);

    const result = await service.platformAnalytics();

    expect(result.totals.orders).toBe(2);
    expect(result.totals.revenue).toBe(15);
    expect(result.totals.billingEvents).toBe(1);
    expect(result.totals.newTenants).toBe(1);
  });
});
