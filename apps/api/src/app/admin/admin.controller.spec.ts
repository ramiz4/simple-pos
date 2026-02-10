import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    service = {
      listTenants: vi.fn().mockResolvedValue({ total: 1, items: [{ id: 'tenant-1' }] }),
      suspendTenant: vi.fn().mockResolvedValue({ id: 'tenant-1', status: 'SUSPENDED' }),
      activateTenant: vi.fn().mockResolvedValue({ id: 'tenant-1', status: 'ACTIVE' }),
      usageOverview: vi.fn().mockResolvedValue({ totals: { totalTenants: 1 } }),
      platformAnalytics: vi.fn().mockResolvedValue({ totals: { orders: 5 } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should list tenants', async () => {
    const result = await controller.listTenants({ search: 'acme', limit: '10' });

    expect(service.listTenants).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'acme', limit: 10 }),
    );
    expect(result.total).toBe(1);
  });

  it('should suspend tenant', async () => {
    const result = await controller.suspendTenant('tenant-1');

    expect(service.suspendTenant).toHaveBeenCalledWith('tenant-1');
    expect(result.status).toBe('SUSPENDED');
  });

  it('should activate tenant', async () => {
    const result = await controller.activateTenant('tenant-1');

    expect(service.activateTenant).toHaveBeenCalledWith('tenant-1');
    expect(result.status).toBe('ACTIVE');
  });

  it('should return usage overview', async () => {
    const result = await controller.usage();

    expect(service.usageOverview).toHaveBeenCalled();
    expect(result.totals.totalTenants).toBe(1);
  });

  it('should return platform analytics', async () => {
    const result = await controller.analytics();

    expect(service.platformAnalytics).toHaveBeenCalled();
    expect(result.totals.orders).toBe(5);
  });
});
