import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('tenants')
  listTenants(@Query() query: ListTenantsQueryDto) {
    return this.adminService.listTenants({
      search: query.search,
      status: query.status,
      plan: query.plan,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined,
    });
  }

  @Post('tenants/:id/suspend')
  suspendTenant(@Param('id') id: string) {
    return this.adminService.suspendTenant(id);
  }

  @Post('tenants/:id/activate')
  activateTenant(@Param('id') id: string) {
    return this.adminService.activateTenant(id);
  }

  @Get('usage')
  usage() {
    return this.adminService.usageOverview();
  }

  @Get('analytics')
  analytics() {
    return this.adminService.platformAnalytics();
  }
}
