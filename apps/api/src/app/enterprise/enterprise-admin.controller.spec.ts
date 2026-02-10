import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseAdminController } from './enterprise-admin.controller';
import { EnterpriseService } from './enterprise.service';

describe('EnterpriseAdminController', () => {
  let controller: EnterpriseAdminController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    service = {
      listProfessionalServiceRequests: vi
        .fn()
        .mockResolvedValue({ total: 1, items: [{ id: 'req-1' }] }),
      updateProfessionalServiceRequest: vi
        .fn()
        .mockResolvedValue({ id: 'req-1', status: 'SCHEDULED' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterpriseAdminController],
      providers: [
        {
          provide: EnterpriseService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<EnterpriseAdminController>(EnterpriseAdminController);
  });

  it('should list requests', async () => {
    const result = await controller.listProfessionalServiceRequests({ tenantId: 'tenant-1' });

    expect(service.listProfessionalServiceRequests).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
    expect(result.total).toBe(1);
  });

  it('should update request', async () => {
    const result = await controller.updateProfessionalServiceRequest('req-1', {
      status: 'SCHEDULED',
    });

    expect(service.updateProfessionalServiceRequest).toHaveBeenCalledWith('req-1', {
      status: 'SCHEDULED',
    });
    expect(result.status).toBe('SCHEDULED');
  });
});
