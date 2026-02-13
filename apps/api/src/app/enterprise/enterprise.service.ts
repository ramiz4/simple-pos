import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@simple-pos/api-common';
import { randomBytes } from 'crypto';
import { DnsVerificationService } from './dns-verification.service';
import {
  CreateProfessionalServiceRequestDto,
  ListProfessionalServiceRequestsQueryDto,
  RequestCustomDomainDto,
  UpdateProfessionalServiceRequestDto,
  VerifyCustomDomainDto,
} from './dto';

const PROFESSIONAL_SERVICE_STATUS = [
  'OPEN',
  'IN_REVIEW',
  'SCHEDULED',
  'RESOLVED',
  'CLOSED',
] as const;
const PROFESSIONAL_SERVICE_PRIORITY = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
const PROFESSIONAL_SERVICE_CATEGORY = [
  'ONBOARDING',
  'MIGRATION',
  'INTEGRATION',
  'TRAINING',
  'SECURITY_REVIEW',
  'CUSTOM_DEVELOPMENT',
] as const;

type ProfessionalServiceStatus = (typeof PROFESSIONAL_SERVICE_STATUS)[number];
type ProfessionalServicePriority = (typeof PROFESSIONAL_SERVICE_PRIORITY)[number];
type ProfessionalServiceCategory = (typeof PROFESSIONAL_SERVICE_CATEGORY)[number];

interface JsonObject {
  [key: string]: unknown;
}

@Injectable()
export class EnterpriseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dnsVerificationService: DnsVerificationService,
  ) {}

  async requestCustomDomain(tenantId: string, dto: RequestCustomDomainDto) {
    const domain = this.normalizeDomain(dto.domain);
    const verificationToken = this.generateVerificationToken();

    const existingTenantForDomain = await this.prisma.tenant.findFirst({
      where: {
        customDomain: domain,
        NOT: {
          id: tenantId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingTenantForDomain) {
      throw new ConflictException(`Domain '${domain}' is already claimed by another tenant`);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        customDomain: domain,
        customDomainStatus: 'PENDING_VERIFICATION',
        customDomainVerificationToken: verificationToken,
        customDomainVerifiedAt: null,
      },
      select: {
        id: true,
        customDomain: true,
        customDomainStatus: true,
        customDomainVerificationToken: true,
      },
    });

    return {
      tenantId: updated.id,
      customDomain: updated.customDomain,
      status: updated.customDomainStatus,
      verification: {
        method: 'DNS_TXT',
        recordName: `_simplepos-verification.${domain}`,
        recordValue: updated.customDomainVerificationToken,
      },
    };
  }

  async verifyCustomDomain(tenantId: string, dto: VerifyCustomDomainDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
        customDomain: true,
        customDomainStatus: true,
        customDomainVerificationToken: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.customDomain) {
      throw new BadRequestException('Tenant has no custom domain configured');
    }

    const expectedToken = tenant.customDomainVerificationToken;
    if (!expectedToken) {
      throw new BadRequestException('Custom domain verification token is missing');
    }

    // Require verification token to be provided
    if (!dto.token || dto.token.trim() !== expectedToken) {
      throw new BadRequestException('Provided verification token does not match or is missing');
    }

    const shouldVerifyDns = dto.verifyDns ?? true;
    if (shouldVerifyDns) {
      const recordName = `_simplepos-verification.${tenant.customDomain}`;
      const records = await this.resolveTxtRecords(recordName);

      if (!records.includes(expectedToken)) {
        throw new BadRequestException(
          `Domain verification TXT record mismatch. Expected token '${expectedToken}' at '${recordName}'`,
        );
      }
    }

    const updated = await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        customDomainStatus: 'ACTIVE',
        customDomainVerifiedAt: new Date(),
        customDomainVerificationToken: null,
      },
      select: {
        id: true,
        customDomain: true,
        customDomainStatus: true,
        customDomainVerifiedAt: true,
      },
    });

    return {
      tenantId: updated.id,
      customDomain: updated.customDomain,
      status: updated.customDomainStatus,
      verifiedAt: updated.customDomainVerifiedAt?.toISOString(),
    };
  }

  async removeCustomDomain(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        customDomain: null,
        customDomainStatus: 'NOT_CONFIGURED',
        customDomainVerificationToken: null,
        customDomainVerifiedAt: null,
      },
      select: {
        id: true,
        customDomain: true,
        customDomainStatus: true,
      },
    });

    return {
      tenantId: updated.id,
      customDomain: updated.customDomain,
      status: updated.customDomainStatus,
    };
  }

  async createProfessionalServiceRequest(
    tenantId: string,
    requestedByUserId: string,
    requesterEmail: string,
    dto: CreateProfessionalServiceRequestDto,
  ) {
    const category = this.normalizeCategory(dto.category);
    const priority = this.normalizePriority(dto.priority);

    if (!dto.title?.trim()) {
      throw new BadRequestException('Professional service request title is required');
    }

    if (!dto.description?.trim()) {
      throw new BadRequestException('Professional service request description is required');
    }

    return this.prisma.professionalServiceRequest.create({
      data: {
        tenantId,
        requestedByUserId,
        requesterEmail: requesterEmail.toLowerCase(),
        category,
        priority,
        title: dto.title.trim(),
        description: dto.description.trim(),
        preferredContact: this.normalizePreferredContact(dto.preferredContact),
      },
      select: {
        id: true,
        tenantId: true,
        requesterEmail: true,
        category: true,
        priority: true,
        status: true,
        title: true,
        description: true,
        preferredContact: true,
        assignedTo: true,
        internalNotes: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
      },
    });
  }

  async listTenantProfessionalServiceRequests(tenantId: string, status?: string) {
    const where = {
      tenantId,
      ...(status ? { status: this.normalizeStatus(status) } : {}),
    };

    return this.prisma.professionalServiceRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        tenantId: true,
        requesterEmail: true,
        category: true,
        priority: true,
        status: true,
        title: true,
        description: true,
        preferredContact: true,
        assignedTo: true,
        internalNotes: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
      },
    });
  }

  async listProfessionalServiceRequests(query: ListProfessionalServiceRequestsQueryDto) {
    const limit = this.normalizePageSize(query.limit);
    const offset = this.normalizeOffset(query.offset);

    const where = {
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      ...(query.status ? { status: this.normalizeStatus(query.status) } : {}),
      ...(query.category ? { category: this.normalizeCategory(query.category) } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.professionalServiceRequest.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          tenantId: true,
          requestedByUserId: true,
          requesterEmail: true,
          category: true,
          priority: true,
          status: true,
          title: true,
          description: true,
          preferredContact: true,
          assignedTo: true,
          internalNotes: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
        },
      }),
      this.prisma.professionalServiceRequest.count({ where }),
    ]);

    return {
      total,
      limit,
      offset,
      items,
    };
  }

  async updateProfessionalServiceRequest(
    requestId: string,
    dto: UpdateProfessionalServiceRequestDto,
  ) {
    const existing = await this.prisma.professionalServiceRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Professional service request '${requestId}' not found`);
    }

    const data: Prisma.ProfessionalServiceRequestUpdateInput = {};

    if (dto.status !== undefined) {
      const normalizedStatus = this.normalizeStatus(dto.status);
      data.status = normalizedStatus;
      data.resolvedAt =
        normalizedStatus === 'RESOLVED' || normalizedStatus === 'CLOSED' ? new Date() : null;
    }

    if (dto.priority !== undefined) {
      data.priority = this.normalizePriority(dto.priority);
    }

    if (dto.assignedTo !== undefined) {
      data.assignedTo = dto.assignedTo?.trim() || null;
    }

    if (dto.internalNotes !== undefined) {
      data.internalNotes = dto.internalNotes as Prisma.InputJsonValue;
    }

    return this.prisma.professionalServiceRequest.update({
      where: {
        id: requestId,
      },
      data,
      select: {
        id: true,
        tenantId: true,
        requestedByUserId: true,
        requesterEmail: true,
        category: true,
        priority: true,
        status: true,
        title: true,
        description: true,
        preferredContact: true,
        assignedTo: true,
        internalNotes: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
      },
    });
  }

  private normalizeDomain(rawDomain: string): string {
    const withoutScheme = rawDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '');
    const host = withoutScheme.split('/')[0] ?? '';

    if (!host) {
      throw new BadRequestException('Custom domain is required');
    }

    if (!/^(?=.{1,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host)) {
      throw new BadRequestException('Custom domain must be a valid hostname');
    }

    return host;
  }

  private normalizeStatus(status: string): ProfessionalServiceStatus {
    const normalized = status.trim().toUpperCase();
    if (!PROFESSIONAL_SERVICE_STATUS.includes(normalized as ProfessionalServiceStatus)) {
      throw new BadRequestException(
        `Invalid status '${status}'. Allowed values: ${PROFESSIONAL_SERVICE_STATUS.join(', ')}`,
      );
    }

    return normalized as ProfessionalServiceStatus;
  }

  private normalizePriority(priority: string | undefined): ProfessionalServicePriority {
    if (!priority) {
      return 'NORMAL';
    }

    const normalized = priority.trim().toUpperCase();
    if (!PROFESSIONAL_SERVICE_PRIORITY.includes(normalized as ProfessionalServicePriority)) {
      throw new BadRequestException(
        `Invalid priority '${priority}'. Allowed values: ${PROFESSIONAL_SERVICE_PRIORITY.join(', ')}`,
      );
    }

    return normalized as ProfessionalServicePriority;
  }

  private normalizeCategory(category: string): ProfessionalServiceCategory {
    const normalized = category?.trim().toUpperCase();
    if (!PROFESSIONAL_SERVICE_CATEGORY.includes(normalized as ProfessionalServiceCategory)) {
      throw new BadRequestException(
        `Invalid category '${category}'. Allowed values: ${PROFESSIONAL_SERVICE_CATEGORY.join(', ')}`,
      );
    }

    return normalized as ProfessionalServiceCategory;
  }

  private normalizePageSize(limit: string | undefined): number {
    if (!limit) {
      return 50;
    }

    const parsed = Number(limit);
    if (!Number.isFinite(parsed) || parsed < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }

    return Math.min(Math.floor(parsed), 200);
  }

  private normalizeOffset(offset: string | undefined): number {
    if (!offset) {
      return 0;
    }

    const parsed = Number(offset);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException('offset must be a non-negative integer');
    }

    return Math.floor(parsed);
  }

  private normalizePreferredContact(value: unknown): Prisma.InputJsonValue {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const raw = value as JsonObject;
    return {
      ...(typeof raw['method'] === 'string' ? { method: raw['method'].trim().toUpperCase() } : {}),
      ...(typeof raw['email'] === 'string' ? { email: raw['email'].trim().toLowerCase() } : {}),
      ...(typeof raw['phone'] === 'string' ? { phone: raw['phone'].trim() } : {}),
      ...(typeof raw['timezone'] === 'string' ? { timezone: raw['timezone'].trim() } : {}),
      ...(typeof raw['availability'] === 'string'
        ? { availability: raw['availability'].trim() }
        : {}),
    };
  }

  private generateVerificationToken(): string {
    return `spv_${randomBytes(20).toString('hex')}`;
  }

  private async resolveTxtRecords(recordName: string): Promise<string[]> {
    try {
      return await this.dnsVerificationService.resolveTxtRecords(recordName);
    } catch {
      return [];
    }
  }
}
