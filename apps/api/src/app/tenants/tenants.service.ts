import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseHostContext, PrismaService } from '@simple-pos/api-common';
import { randomBytes } from 'crypto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

interface TenantObject {
  [key: string]: unknown;
}

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        customDomainStatus: true,
        customDomainVerifiedAt: true,
        plan: true,
        status: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        currentPeriodEndsAt: true,
        maxUsers: true,
        maxLocations: true,
        maxDevices: true,
        features: true,
        settings: true,
        billingInfo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateById(tenantId: string, updateDto: UpdateTenantDto) {
    if (updateDto.settings?.taxRate !== undefined && updateDto.settings.taxRate < 0) {
      throw new BadRequestException('Tax rate cannot be negative');
    }

    const existing = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
        settings: true,
        billingInfo: true,
        customDomain: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Tenant not found');
    }

    const data: Prisma.TenantUpdateInput = {};
    if (updateDto.name?.trim()) {
      data.name = updateDto.name.trim();
    }

    if (updateDto.customDomain !== undefined) {
      if (updateDto.customDomain === null) {
        data.customDomain = null;
        data.customDomainStatus = 'NOT_CONFIGURED';
        data.customDomainVerificationToken = null;
        data.customDomainVerifiedAt = null;
      } else {
        const normalizedDomain = this.normalizeDomain(updateDto.customDomain);

        if (existing.customDomain !== normalizedDomain) {
          data.customDomain = normalizedDomain;
          data.customDomainStatus = 'PENDING_VERIFICATION';
          data.customDomainVerifiedAt = null;
          data.customDomainVerificationToken = this.generateVerificationToken();
        }
      }
    }

    if (updateDto.settings) {
      data.settings = {
        ...this.ensureObject(existing.settings),
        ...updateDto.settings,
      } as Prisma.InputJsonValue;
    }

    if (updateDto.billingInfo) {
      data.billingInfo = {
        ...this.ensureObject(existing.billingInfo),
        ...updateDto.billingInfo,
      } as Prisma.InputJsonValue;
    }

    return this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data,
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        customDomainStatus: true,
        customDomainVerifiedAt: true,
        plan: true,
        status: true,
        settings: true,
        billingInfo: true,
        updatedAt: true,
      },
    });
  }

  async resolveByHost(host: string) {
    if (!host?.trim()) {
      throw new BadRequestException('host query parameter is required');
    }

    const baseDomain = process.env['BASE_DOMAIN'] ?? 'localhost';
    const hostContext = parseHostContext(host, baseDomain);

    if (hostContext.isAdminHost) {
      return {
        host: hostContext.host,
        isAdminHost: true,
        tenantId: null,
        subdomain: null,
      };
    }

    if (hostContext.tenantSubdomain) {
      const tenant = await this.prisma.tenant.findUnique({
        where: {
          subdomain: hostContext.tenantSubdomain,
        },
        select: {
          id: true,
          subdomain: true,
          name: true,
          plan: true,
          status: true,
        },
      });

      return {
        host: hostContext.host,
        isAdminHost: false,
        tenantId: tenant?.id ?? null,
        subdomain: tenant?.subdomain ?? hostContext.tenantSubdomain,
        tenant,
      };
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        customDomain: hostContext.host,
        customDomainStatus: 'ACTIVE',
      },
      select: {
        id: true,
        subdomain: true,
        name: true,
        plan: true,
        status: true,
      },
    });

    return {
      host: hostContext.host,
      isAdminHost: false,
      tenantId: tenant?.id ?? null,
      subdomain: tenant?.subdomain ?? null,
      tenant,
    };
  }

  async getOnboardingChecklist(tenantId: string) {
    return this.prisma.withRls(tenantId, async (tx) => {
      const [usersCount, productsCount, ordersCount, apiKeysCount] = await Promise.all([
        tx.user.count({ where: { tenantId } }),
        tx.product.count({ where: { tenantId, isDeleted: false } }),
        tx.order.count({ where: { tenantId } }),
        tx.tenantApiKey.count({ where: { tenantId, revokedAt: null } }),
      ]);

      return {
        usersCount,
        productsCount,
        ordersCount,
        apiKeysCount,
        completed: {
          adminUserCreated: usersCount >= 1,
          apiKeyGenerated: apiKeysCount >= 1,
          productCatalogStarted: productsCount >= 1,
          firstOrderCaptured: ordersCount >= 1,
        },
      };
    });
  }

  private ensureObject(value: unknown): TenantObject {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as TenantObject;
  }

  private normalizeDomain(rawDomain: string): string {
    const withoutScheme = rawDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '');
    const host = withoutScheme.split('/')[0] ?? '';

    if (!host) {
      throw new BadRequestException('Custom domain value is empty');
    }

    if (!/^(?=.{1,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host)) {
      throw new BadRequestException('Custom domain must be a valid hostname');
    }

    return host;
  }

  private generateVerificationToken(): string {
    return `spv_${randomBytes(20).toString('hex')}`;
  }
}
