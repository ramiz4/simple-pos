import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { DnsVerificationService } from './dns-verification.service';
import { EnterpriseAdminController } from './enterprise-admin.controller';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';

@Module({
  imports: [PrismaModule],
  controllers: [EnterpriseController, EnterpriseAdminController],
  providers: [EnterpriseService, DnsVerificationService],
  exports: [EnterpriseService],
})
export class EnterpriseModule {}
