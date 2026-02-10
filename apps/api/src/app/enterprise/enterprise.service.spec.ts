import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { DnsVerificationService } from './dns-verification.service';
import { EnterpriseService } from './enterprise.service';

describe('EnterpriseService', () => {
  let service: EnterpriseService;
  let prisma: {
    tenant: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    professionalServiceRequest: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let dnsVerification: {
    resolveTxtRecords: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      professionalServiceRequest: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    dnsVerification = {
      resolveTxtRecords: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterpriseService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: DnsVerificationService,
          useValue: dnsVerification,
        },
      ],
    }).compile();

    service = module.get<EnterpriseService>(EnterpriseService);
  });

  it('should request custom domain verification token', async () => {
    prisma.tenant.findFirst.mockResolvedValue(null);
    prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    prisma.tenant.update.mockResolvedValue({
      id: 'tenant-1',
      customDomain: 'pos.example.com',
      customDomainStatus: 'PENDING_VERIFICATION',
      customDomainVerificationToken: 'spv_token',
    });

    const result = await service.requestCustomDomain('tenant-1', { domain: 'pos.example.com' });

    expect(result.status).toBe('PENDING_VERIFICATION');
    expect(result.verification.recordName).toBe('_simplepos-verification.pos.example.com');
  });

  it('should verify custom domain with dns record', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      customDomain: 'pos.example.com',
      customDomainStatus: 'PENDING_VERIFICATION',
      customDomainVerificationToken: 'spv_token',
    });
    dnsVerification.resolveTxtRecords.mockResolvedValue(['spv_token']);
    prisma.tenant.update.mockResolvedValue({
      id: 'tenant-1',
      customDomain: 'pos.example.com',
      customDomainStatus: 'ACTIVE',
      customDomainVerifiedAt: new Date('2026-02-10T15:00:00.000Z'),
    });

    const result = await service.verifyCustomDomain('tenant-1', {
      verifyDns: true,
    });

    expect(result.status).toBe('ACTIVE');
    expect(dnsVerification.resolveTxtRecords).toHaveBeenCalledWith(
      '_simplepos-verification.pos.example.com',
    );
  });

  it('should reject mismatched verification token', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      customDomain: 'pos.example.com',
      customDomainStatus: 'PENDING_VERIFICATION',
      customDomainVerificationToken: 'expected-token',
    });

    await expect(service.verifyCustomDomain('tenant-1', { token: 'wrong-token' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should create professional service request', async () => {
    prisma.professionalServiceRequest.create.mockResolvedValue({
      id: 'req-1',
      status: 'OPEN',
      priority: 'HIGH',
    });

    const result = await service.createProfessionalServiceRequest(
      'tenant-1',
      'user-1',
      'owner@example.com',
      {
        category: 'INTEGRATION',
        priority: 'HIGH',
        title: 'Need ERP integration',
        description: 'Please integrate POS with ERP',
      },
    );

    expect(prisma.professionalServiceRequest.create).toHaveBeenCalled();
    expect(result.status).toBe('OPEN');
  });

  it('should update professional service request status', async () => {
    prisma.professionalServiceRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      status: 'OPEN',
    });
    prisma.professionalServiceRequest.update.mockResolvedValue({
      id: 'req-1',
      status: 'RESOLVED',
      resolvedAt: new Date('2026-02-10T15:00:00.000Z'),
    });

    const result = await service.updateProfessionalServiceRequest('req-1', {
      status: 'RESOLVED',
    });

    expect(result.status).toBe('RESOLVED');
    expect(prisma.professionalServiceRequest.update).toHaveBeenCalled();
  });
});
