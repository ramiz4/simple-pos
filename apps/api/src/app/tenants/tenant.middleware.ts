import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// Extend Express Request
declare module 'express' {
  interface Request {
    tenantId?: string;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Try header
    const tenantIdHeader = req.headers['x-tenant-id'];
    if (tenantIdHeader) {
      const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;

      // Validate UUID format to prevent database errors/SQL injection attempts
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tenantId)) {
        throw new BadRequestException('Invalid X-Tenant-ID header format. Must be a valid UUID.');
      }

      req.tenantId = tenantId;
      return next();
    }

    // 2. Try subdomain (simplified logic)
    const host = req.headers.host;
    if (host) {
      // logic to extract subdomain: tenant.domain.com
      // This requires config about base domain. Skipping for basic setup.
    }

    // For now, allow requests without tenant (e.g. public endpoints or admin),
    // simply don't set the ID.
    // Guards should enforce presence if needed.

    next();
  }
}
