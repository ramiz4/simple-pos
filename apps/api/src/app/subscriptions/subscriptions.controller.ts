import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('checkout-session')
  createCheckoutSession(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('email') email: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.subscriptionsService.createCheckoutSession(tenantId, email, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('portal-session')
  createPortalSession(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreatePortalSessionDto,
  ) {
    return this.subscriptionsService.createPortalSession(tenantId, dto);
  }

  @Post('webhook')
  webhook(@Req() req: Request, @Headers('stripe-signature') signature: string | undefined) {
    const body = req.body;
    const rawBody = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body ?? {}), 'utf-8');

    return this.subscriptionsService.processWebhook(rawBody, signature);
  }
}
