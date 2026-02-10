import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateSsoProviderDto,
  OauthAuthorizeRequestDto,
  SsoSamlAssertionDto,
  UpdateSsoProviderDto,
} from './dto';
import { SsoService } from './sso.service';

@Controller('sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('providers')
  listProviders(@CurrentUser('tenantId') tenantId: string) {
    return this.ssoService.listProviders(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('providers')
  createProvider(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateSsoProviderDto) {
    return this.ssoService.createProvider(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('providers/:providerId')
  updateProvider(
    @CurrentUser('tenantId') tenantId: string,
    @Param('providerId') providerId: string,
    @Body() dto: UpdateSsoProviderDto,
  ) {
    return this.ssoService.updateProvider(tenantId, providerId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('providers/:providerId')
  deleteProvider(
    @CurrentUser('tenantId') tenantId: string,
    @Param('providerId') providerId: string,
  ) {
    return this.ssoService.deleteProvider(tenantId, providerId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('oauth/:providerId/authorize')
  createOauthAuthorizationUrl(
    @CurrentUser('tenantId') tenantId: string,
    @Param('providerId') providerId: string,
    @Body() dto: OauthAuthorizeRequestDto,
  ) {
    return this.ssoService.createOauthAuthorizationUrl(tenantId, providerId, dto);
  }

  @Get('oauth/:providerId/callback')
  oauthCallback(
    @Param('providerId') providerId: string,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    return this.ssoService.oauthCallback(providerId, code, state);
  }

  /**
   * SAML assertion endpoint - called by external IdP systems.
   * Authentication is enforced via mandatory shared secret validation in the service layer.
   * Do not add JWT guards as this must be accessible to external SAML providers.
   */
  @Post('saml/:providerId/assertion')
  @HttpCode(HttpStatus.OK)
  samlAssertion(
    @Param('providerId') providerId: string,
    @Body() dto: SsoSamlAssertionDto,
    @Headers('x-sso-shared-secret') sharedSecret: string | undefined,
  ) {
    return this.ssoService.samlAssertion(providerId, dto, sharedSecret);
  }
}
