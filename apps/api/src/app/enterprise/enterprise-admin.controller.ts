import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ListProfessionalServiceRequestsQueryDto,
  UpdateProfessionalServiceRequestDto,
} from './dto';
import { EnterpriseService } from './enterprise.service';

@Controller('admin/enterprise')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class EnterpriseAdminController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Get('professional-services/requests')
  listProfessionalServiceRequests(@Query() query: ListProfessionalServiceRequestsQueryDto) {
    return this.enterpriseService.listProfessionalServiceRequests(query);
  }

  @Patch('professional-services/requests/:requestId')
  updateProfessionalServiceRequest(
    @Param('requestId') requestId: string,
    @Body() dto: UpdateProfessionalServiceRequestDto,
  ) {
    return this.enterpriseService.updateProfessionalServiceRequest(requestId, dto);
  }
}
