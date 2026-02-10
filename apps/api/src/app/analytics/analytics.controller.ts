import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenants/tenant.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@TenantId() tenantId: string, @Query('days') days?: string) {
    return this.analyticsService.dashboard(tenantId, this.parseDays(days));
  }

  @Get('sales')
  sales(@TenantId() tenantId: string, @Query('days') days?: string) {
    return this.analyticsService.sales(tenantId, this.parseDays(days));
  }

  @Get('products')
  products(@TenantId() tenantId: string, @Query('days') days?: string) {
    return this.analyticsService.products(tenantId, this.parseDays(days));
  }

  @Get('staff')
  staff(@TenantId() tenantId: string, @Query('days') days?: string) {
    return this.analyticsService.staff(tenantId, this.parseDays(days));
  }

  private parseDays(days: string | undefined): number {
    if (!days) {
      return 30;
    }

    const parsed = Number(days);
    if (!Number.isFinite(parsed)) {
      return 30;
    }

    return parsed;
  }
}
