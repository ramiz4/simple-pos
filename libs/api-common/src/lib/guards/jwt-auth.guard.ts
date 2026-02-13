import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const activated = await super.canActivate(context);
    if (!activated) {
      return false;
    }

    const request = context.switchToHttp().getRequest<{
      tenantId?: string;
      user?: { tenantId?: string };
    }>();

    const requestTenantId = request.tenantId;
    const jwtTenantId = request.user?.tenantId;

    // Enforce tenant consistency when both sources are present.
    if (requestTenantId && jwtTenantId && requestTenantId !== jwtTenantId) {
      throw new UnauthorizedException('Tenant context mismatch between JWT and request header');
    }

    return true;
  }
}
