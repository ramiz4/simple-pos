import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('resolve')
  resolveByHost(@Query('host') host: string) {
    return this.tenantsService.resolveByHost(host);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentTenant(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantsService.getById(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/onboarding')
  getOnboarding(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantsService.getOnboardingChecklist(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('me')
  updateCurrentTenant(
    @CurrentUser('tenantId') tenantId: string,
    @Body() updateDto: UpdateTenantDto,
  ) {
    return this.tenantsService.updateById(tenantId, updateDto);
  }
}
