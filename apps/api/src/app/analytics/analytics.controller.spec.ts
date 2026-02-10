import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    service = {
      dashboard: vi.fn().mockResolvedValue({ summary: { orderCount: 10 } }),
      sales: vi.fn().mockResolvedValue({ totals: { orders: 10 } }),
      products: vi.fn().mockResolvedValue({ products: [] }),
      staff: vi.fn().mockResolvedValue({ staff: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should return dashboard metrics', async () => {
    const result = await controller.dashboard('tenant-1', '7');

    expect(service.dashboard).toHaveBeenCalledWith('tenant-1', 7);
    expect(result.summary.orderCount).toBe(10);
  });

  it('should return sales metrics', async () => {
    const result = await controller.sales('tenant-1', '30');

    expect(service.sales).toHaveBeenCalledWith('tenant-1', 30);
    expect(result.totals.orders).toBe(10);
  });

  it('should return products metrics', async () => {
    await controller.products('tenant-1', '30');

    expect(service.products).toHaveBeenCalledWith('tenant-1', 30);
  });

  it('should return staff metrics', async () => {
    await controller.staff('tenant-1', '30');

    expect(service.staff).toHaveBeenCalledWith('tenant-1', 30);
  });

  it('should fallback to default days when query is invalid', async () => {
    await controller.dashboard('tenant-1', 'invalid');

    expect(service.dashboard).toHaveBeenCalledWith('tenant-1', 30);
  });
});
