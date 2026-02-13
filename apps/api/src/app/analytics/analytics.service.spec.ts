import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@simple-pos/api-common';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: {
    withRls: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      withRls: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should compute dashboard summary', async () => {
    prisma.withRls
      .mockImplementationOnce(async (_tenantId: string, callback: (tx: unknown) => unknown) =>
        callback({
          order: {
            findMany: vi.fn().mockResolvedValue([
              { totalAmount: 12.5, createdAt: new Date() },
              { totalAmount: 7.5, createdAt: new Date() },
            ]),
          },
        }),
      )
      .mockImplementationOnce(async (_tenantId: string, callback: (tx: unknown) => unknown) =>
        callback({
          product: {
            count: vi.fn().mockResolvedValue(2),
          },
          customer: {
            count: vi.fn().mockResolvedValue(3),
          },
        }),
      );

    const result = await service.dashboard('tenant-1', 30);

    expect(result.summary.totalSales).toBe(20);
    expect(result.summary.orderCount).toBe(2);
    expect(result.summary.averageOrderValue).toBe(10);
  });

  it('should aggregate sales by day', async () => {
    prisma.withRls.mockImplementation(
      async (_tenantId: string, callback: (tx: unknown) => unknown) =>
        callback({
          order: {
            findMany: vi.fn().mockResolvedValue([
              { createdAt: new Date('2026-02-01T10:00:00Z'), totalAmount: 10 },
              { createdAt: new Date('2026-02-01T15:00:00Z'), totalAmount: 5 },
            ]),
          },
        }),
    );

    const result = await service.sales('tenant-1', 30);

    expect(result.totals.orders).toBe(2);
    expect(result.totals.revenue).toBe(15);
    expect(result.series).toHaveLength(1);
    expect(result.series[0]?.orders).toBe(2);
  });

  it('should rank products by revenue', async () => {
    prisma.withRls.mockImplementation(
      async (_tenantId: string, callback: (tx: unknown) => unknown) =>
        callback({
          orderItem: {
            findMany: vi.fn().mockResolvedValue([
              {
                quantity: 2,
                total: 20,
                productId: 'p1',
                product: { name: 'Coffee' },
              },
              {
                quantity: 1,
                total: 5,
                productId: 'p2',
                product: { name: 'Tea' },
              },
            ]),
          },
        }),
    );

    const result = await service.products('tenant-1', 30);

    expect(result.products[0]?.name).toBe('Coffee');
    expect(result.products[0]?.revenue).toBe(20);
  });

  it('should aggregate staff performance', async () => {
    prisma.withRls.mockImplementation(
      async (_tenantId: string, callback: (tx: unknown) => unknown) =>
        callback({
          order: {
            findMany: vi.fn().mockResolvedValue([
              {
                userId: 'u1',
                totalAmount: 20,
                user: {
                  firstName: 'Alex',
                  lastName: 'Doe',
                  email: 'alex@example.com',
                  role: 'CASHIER',
                },
              },
              {
                userId: 'u1',
                totalAmount: 10,
                user: {
                  firstName: 'Alex',
                  lastName: 'Doe',
                  email: 'alex@example.com',
                  role: 'CASHIER',
                },
              },
            ]),
          },
        }),
    );

    const result = await service.staff('tenant-1', 30);

    expect(result.staff).toHaveLength(1);
    expect(result.staff[0]?.orders).toBe(2);
    expect(result.staff[0]?.revenue).toBe(30);
  });
});
