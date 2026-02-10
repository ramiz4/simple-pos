import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

describe('TenantsController', () => {
  let controller: TenantsController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    service = {
      resolveByHost: vi.fn().mockResolvedValue({
        host: 'tenant.example.com',
        tenantId: 'tenant-1',
      }),
      getById: vi.fn().mockResolvedValue({
        id: 'tenant-1',
      }),
      getOnboardingChecklist: vi.fn().mockResolvedValue({
        completed: {
          adminUserCreated: true,
        },
      }),
      updateById: vi.fn().mockResolvedValue({
        id: 'tenant-1',
        name: 'Updated Tenant',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  it('should resolve tenant by host', async () => {
    const result = await controller.resolveByHost('tenant.example.com');

    expect(service.resolveByHost).toHaveBeenCalledWith('tenant.example.com');
    expect(result.tenantId).toBe('tenant-1');
  });

  it('should return current tenant', async () => {
    const result = await controller.getCurrentTenant('tenant-1');

    expect(service.getById).toHaveBeenCalledWith('tenant-1');
    expect(result.id).toBe('tenant-1');
  });

  it('should return onboarding checklist', async () => {
    const result = await controller.getOnboarding('tenant-1');

    expect(service.getOnboardingChecklist).toHaveBeenCalledWith('tenant-1');
    expect(result.completed.adminUserCreated).toBe(true);
  });

  it('should update tenant profile', async () => {
    const result = await controller.updateCurrentTenant('tenant-1', {
      name: 'Updated Tenant',
    });

    expect(service.updateById).toHaveBeenCalledWith('tenant-1', {
      name: 'Updated Tenant',
    });
    expect(result.name).toBe('Updated Tenant');
  });
});
