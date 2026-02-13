import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@simple-pos/api-common';
import {
  CreateProfessionalServiceRequestDto,
  RequestCustomDomainDto,
  VerifyCustomDomainDto,
} from './dto';
import { EnterpriseService } from './enterprise.service';

@Controller('enterprise')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Post('custom-domain/request')
  requestCustomDomain(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: RequestCustomDomainDto,
  ) {
    return this.enterpriseService.requestCustomDomain(tenantId, dto);
  }

  @Post('custom-domain/verify')
  verifyCustomDomain(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: VerifyCustomDomainDto,
  ) {
    return this.enterpriseService.verifyCustomDomain(tenantId, dto);
  }

  @Delete('custom-domain')
  removeCustomDomain(@CurrentUser('tenantId') tenantId: string) {
    return this.enterpriseService.removeCustomDomain(tenantId);
  }

  @Post('professional-services/requests')
  createProfessionalServiceRequest(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
    @Body() dto: CreateProfessionalServiceRequestDto,
  ) {
    return this.enterpriseService.createProfessionalServiceRequest(tenantId, userId, email, dto);
  }

  @Get('professional-services/requests')
  listProfessionalServiceRequests(
    @CurrentUser('tenantId') tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.enterpriseService.listTenantProfessionalServiceRequests(tenantId, status);
  }
}
