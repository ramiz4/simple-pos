import { Module } from '@nestjs/common';
import { PrismaModule } from '@simple-pos/api-common';
import { AuthModule } from '../auth/auth.module';
import { SsoController } from './sso.controller';
import { SsoService } from './sso.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SsoController],
  providers: [SsoService],
  exports: [SsoService],
})
export class SsoModule {}
