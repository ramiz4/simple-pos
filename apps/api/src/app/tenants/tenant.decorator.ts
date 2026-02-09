import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';

export const TenantId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const tenantId = request.tenantId;

  // If used on a route guarded by something that ensures tenant context,
  // this theoretically shouldn't happen, but it's good for safety.
  if (!tenantId) {
    throw new InternalServerErrorException('Tenant ID not found in request context');
  }

  return tenantId;
});
