import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma/prisma.service';
import { normalizeTenantPlan, TENANT_PLAN_VALUES, TenantPlan } from '../tenants/tenant-plan.config';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';

@Injectable()
export class SubscriptionsService {
  private stripeClient: Stripe | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async createCheckoutSession(
    tenantId: string,
    userEmail: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ sessionId: string; url: string | null }> {
    const stripe = this.getStripeClient();

    const plan = normalizeTenantPlan(dto.plan);
    if (plan === 'FREE') {
      throw new BadRequestException('FREE plan does not require a checkout session');
    }

    const priceId = this.priceIdForPlan(plan);
    if (!priceId) {
      throw new ServiceUnavailableException(`Stripe price ID is missing for plan ${plan}`);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: tenant.stripeCustomerId ?? undefined,
      customer_email: tenant.stripeCustomerId ? undefined : userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        tenantId,
        plan,
      },
      subscription_data: {
        metadata: {
          tenantId,
          plan,
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createPortalSession(
    tenantId: string,
    dto: CreatePortalSessionDto,
  ): Promise<{ url: string }> {
    const stripe = this.getStripeClient();

    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.stripeCustomerId) {
      throw new BadRequestException('Tenant does not have a Stripe customer account yet');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: dto.returnUrl,
    });

    return {
      url: session.url,
    };
  }

  async processWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    const stripe = this.getStripeClient();
    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];

    if (!webhookSecret) {
      throw new ServiceUnavailableException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const existing = await this.prisma.billingEvent.findUnique({
      where: {
        stripeEventId: event.id,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return {
        received: true,
        duplicate: true,
        eventId: event.id,
      };
    }

    const tenantId = await this.handleStripeEvent(event);

    try {
      await this.prisma.billingEvent.create({
        data: {
          tenantId,
          stripeEventId: event.id,
          eventType: event.type,
          livemode: event.livemode,
          payload: this.safeJsonPayload(rawBody),
          processedAt: new Date(),
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return {
          received: true,
          duplicate: true,
          eventId: event.id,
        };
      }

      throw error;
    }

    return {
      received: true,
      duplicate: false,
      eventId: event.id,
      eventType: event.type,
    };
  }

  private async handleStripeEvent(event: Stripe.Event): Promise<string | null> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        return this.handleCheckoutSessionCompleted(session);
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        return this.handleSubscriptionEvent(subscription);
      }
      default:
        return null;
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<string | null> {
    const tenantId = session.metadata?.['tenantId'];

    if (!tenantId) {
      return null;
    }

    const plan = normalizeTenantPlan(session.metadata?.['plan']);
    const subscriptionId = this.extractSubscriptionId(session.subscription);
    const currentPeriodEndsAt = this.extractCheckoutCurrentPeriodEnd(session);

    await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        plan,
        status: 'ACTIVE',
        stripeCustomerId:
          typeof session.customer === 'string'
            ? session.customer
            : (session.customer?.id ?? undefined),
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        currentPeriodEndsAt,
        subscriptionEndsAt: currentPeriodEndsAt,
      },
    });

    return tenantId;
  }

  private async handleSubscriptionEvent(subscription: Stripe.Subscription): Promise<string | null> {
    const subscriptionId = subscription.id;
    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          {
            stripeSubscriptionId: subscriptionId,
          },
          {
            stripeCustomerId: customerId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      return null;
    }

    const resolvedPlan = this.resolvePlanFromSubscription(subscription);
    const currentPeriodEndEpoch = subscription.items.data.reduce<number | null>((latest, item) => {
      if (latest === null || item.current_period_end > latest) {
        return item.current_period_end;
      }
      return latest;
    }, null);
    const currentPeriodEndsAt = currentPeriodEndEpoch
      ? new Date(currentPeriodEndEpoch * 1000)
      : null;
    const normalizedStatus = this.normalizeSubscriptionStatus(subscription.status);

    await this.prisma.tenant.update({
      where: {
        id: tenant.id,
      },
      data: {
        ...(resolvedPlan ? { plan: resolvedPlan } : {}),
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        status: normalizedStatus,
        currentPeriodEndsAt,
        subscriptionEndsAt: currentPeriodEndsAt,
      },
    });

    return tenant.id;
  }

  private normalizeSubscriptionStatus(status: Stripe.Subscription.Status): string {
    switch (status) {
      case 'active':
      case 'trialing':
      case 'past_due':
        return 'ACTIVE';
      case 'canceled':
      case 'incomplete_expired':
      case 'unpaid':
        return 'CANCELLED';
      default:
        return 'SUSPENDED';
    }
  }

  private resolvePlanFromSubscription(subscription: Stripe.Subscription): TenantPlan | null {
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      return null;
    }

    for (const plan of TENANT_PLAN_VALUES) {
      const configuredPriceId = this.priceIdForPlan(plan);
      if (configuredPriceId && configuredPriceId === priceId) {
        return plan;
      }
    }

    return null;
  }

  private extractSubscriptionId(subscription: string | Stripe.Subscription | null): string | null {
    if (!subscription) {
      return null;
    }

    if (typeof subscription === 'string') {
      return subscription;
    }

    return subscription.id;
  }

  private extractCheckoutCurrentPeriodEnd(session: Stripe.Checkout.Session): Date | null {
    const epochSeconds = session.expires_at;
    return epochSeconds ? new Date(epochSeconds * 1000) : null;
  }

  private getStripeClient(): Stripe {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = process.env['STRIPE_SECRET_KEY'];
    if (!secretKey) {
      throw new ServiceUnavailableException('STRIPE_SECRET_KEY is not configured');
    }

    this.stripeClient = new Stripe(secretKey);

    return this.stripeClient;
  }

  private priceIdForPlan(plan: TenantPlan): string | null {
    const envKeyByPlan: Record<TenantPlan, string | null> = {
      FREE: null,
      BASIC: process.env['STRIPE_PRICE_BASIC'] ?? null,
      PRO: process.env['STRIPE_PRICE_PRO'] ?? null,
      ENTERPRISE: process.env['STRIPE_PRICE_ENTERPRISE'] ?? null,
    };

    return envKeyByPlan[plan];
  }

  private safeJsonPayload(rawBody: Buffer): Prisma.InputJsonValue {
    try {
      return JSON.parse(rawBody.toString('utf-8')) as Prisma.InputJsonValue;
    } catch {
      return {
        parseError: true,
      };
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('code' in error)) {
      return false;
    }

    const typedError = error as { code?: string };
    return typedError.code === 'P2002';
  }
}
