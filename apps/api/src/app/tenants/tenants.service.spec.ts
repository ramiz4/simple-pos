import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@simple-pos/api-common';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: {
    tenant: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    withRls: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      withRls: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should get tenant by id', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });

    const result = await service.getById('tenant-1');

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tenant-1' } }),
    );
    expect(result.id).toBe('tenant-1');
  });

  it('should throw when tenant is missing', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);

    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('should validate tax rate on update', async () => {
    await expect(
      service.updateById('tenant-1', {
        settings: {
          taxRate: -1,
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should resolve admin host', async () => {
    vi.stubEnv('BASE_DOMAIN', 'example.com');

    const result = await service.resolveByHost('admin.example.com');

    expect(result.isAdminHost).toBe(true);
  });

  it('should return onboarding checklist with completion flags', async () => {
    prisma.withRls.mockImplementation(
      async (_tenantId: string, callback: (tx: unknown) => unknown) =>
        callback({
          user: {
            count: vi.fn().mockResolvedValue(1),
          },
          product: {
            count: vi.fn().mockResolvedValue(2),
          },
          order: {
            count: vi.fn().mockResolvedValue(0),
          },
          tenantApiKey: {
            count: vi.fn().mockResolvedValue(1),
          },
        }),
    );

    const result = await service.getOnboardingChecklist('tenant-1');

    expect(result.completed.adminUserCreated).toBe(true);
    expect(result.completed.productCatalogStarted).toBe(true);
    expect(result.completed.firstOrderCaptured).toBe(false);
  });
});
