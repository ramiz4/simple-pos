import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { ValidationUtils } from '@simple-pos/shared/utils';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { parseHostContext } from './tenant-host.utils';

interface CachedTenantContext {
  tenantId: string;
  expiresAt: number;
}

// Extend Express Request
declare module 'express' {
  interface Request {
    tenantId?: string;
    tenantSubdomain?: string;
    isAdminHost?: boolean;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly cacheTtlMs = 5 * 60 * 1000;
  private readonly tenantContextCache = new Map<string, CachedTenantContext>();

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const tenantIdHeader = req.headers['x-tenant-id'];
    if (tenantIdHeader) {
      const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;

      if (!ValidationUtils.isUuid(tenantId)) {
        throw new BadRequestException('Invalid X-Tenant-ID header format. Must be a valid UUID.');
      }

      req.tenantId = tenantId;
      req.isAdminHost = false;
      next();
      return;
    }

    const hostHeader = req.headers.host;
    const baseDomain = process.env['BASE_DOMAIN'] ?? 'localhost';
    const hostContext = parseHostContext(hostHeader, baseDomain);
    req.isAdminHost = hostContext.isAdminHost;

    if (hostContext.tenantSubdomain) {
      req.tenantSubdomain = hostContext.tenantSubdomain;

      const cacheKey = this.buildSubdomainCacheKey(hostContext.tenantSubdomain);
      const cached = this.tenantContextCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        req.tenantId = cached.tenantId;
        next();
        return;
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: {
          subdomain: hostContext.tenantSubdomain,
        },
        select: {
          id: true,
        },
      });

      if (!tenant) {
        throw new BadRequestException(
          `Unknown tenant subdomain: ${hostContext.tenantSubdomain}. Provide X-Tenant-ID header or use a valid tenant host.`,
        );
      }

      req.tenantId = tenant.id;
      this.tenantContextCache.set(cacheKey, {
        tenantId: tenant.id,
        expiresAt: Date.now() + this.cacheTtlMs,
      });
      next();
      return;
    }

    if (
      hostContext.host &&
      hostContext.host !== 'localhost' &&
      hostContext.host !== baseDomain.toLowerCase()
    ) {
      const domainCacheKey = this.buildCustomDomainCacheKey(hostContext.host);
      const cached = this.tenantContextCache.get(domainCacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        req.tenantId = cached.tenantId;
        next();
        return;
      }

      const tenant = await this.prisma.tenant.findFirst({
        where: {
          customDomain: hostContext.host,
          customDomainStatus: 'ACTIVE',
        },
        select: {
          id: true,
          subdomain: true,
        },
      });

      if (tenant) {
        req.tenantId = tenant.id;
        req.tenantSubdomain = tenant.subdomain;
        this.tenantContextCache.set(domainCacheKey, {
          tenantId: tenant.id,
          expiresAt: Date.now() + this.cacheTtlMs,
        });
      }
    }

    next();
  }

  private buildSubdomainCacheKey(subdomain: string): string {
    return `subdomain:${subdomain}`;
  }

  private buildCustomDomainCacheKey(domain: string): string {
    return `custom:${domain}`;
  }
}
