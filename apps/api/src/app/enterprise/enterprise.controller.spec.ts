import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';

describe('EnterpriseController', () => {
  let controller: EnterpriseController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    service = {
      requestCustomDomain: vi.fn().mockResolvedValue({ status: 'PENDING_VERIFICATION' }),
      verifyCustomDomain: vi.fn().mockResolvedValue({ status: 'ACTIVE' }),
      removeCustomDomain: vi.fn().mockResolvedValue({ status: 'NOT_CONFIGURED' }),
      createProfessionalServiceRequest: vi.fn().mockResolvedValue({ id: 'req-1' }),
      listTenantProfessionalServiceRequests: vi.fn().mockResolvedValue([{ id: 'req-1' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterpriseController],
      providers: [
        {
          provide: EnterpriseService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<EnterpriseController>(EnterpriseController);
  });

  it('should request custom domain verification', async () => {
    const result = await controller.requestCustomDomain('tenant-1', { domain: 'pos.example.com' });

    expect(service.requestCustomDomain).toHaveBeenCalledWith('tenant-1', {
      domain: 'pos.example.com',
    });
    expect(result.status).toBe('PENDING_VERIFICATION');
  });

  it('should verify custom domain', async () => {
    const result = await controller.verifyCustomDomain('tenant-1', { token: 'abc' });

    expect(service.verifyCustomDomain).toHaveBeenCalledWith('tenant-1', {
      token: 'abc',
    });
    expect(result.status).toBe('ACTIVE');
  });

  it('should create professional service request', async () => {
    const result = await controller.createProfessionalServiceRequest(
      'tenant-1',
      'user-1',
      'owner@example.com',
      {
        category: 'MIGRATION',
        title: 'Need migration support',
        description: 'Please assist with migration from local mode',
      },
    );

    expect(service.createProfessionalServiceRequest).toHaveBeenCalledWith(
      'tenant-1',
      'user-1',
      'owner@example.com',
      {
        category: 'MIGRATION',
        title: 'Need migration support',
        description: 'Please assist with migration from local mode',
      },
    );
    expect(result.id).toBe('req-1');
  });
});
