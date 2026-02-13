import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@simple-pos/api-common';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: {
    tenant: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    billingEvent: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      billingEvent: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should throw when stripe key is missing', async () => {
    delete process.env['STRIPE_SECRET_KEY'];

    await expect(
      service.createCheckoutSession('tenant-1', 'owner@example.com', {
        plan: 'PRO',
        successUrl: 'https://app/success',
        cancelUrl: 'https://app/cancel',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('should reject checkout for free plan', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');

    await expect(
      service.createCheckoutSession('tenant-1', 'owner@example.com', {
        plan: 'FREE',
        successUrl: 'https://app/success',
        cancelUrl: 'https://app/cancel',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create checkout session for paid plan', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
    vi.stubEnv('STRIPE_PRICE_PRO', 'price_pro_123');

    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant',
      stripeCustomerId: null,
    });

    const stripeMock = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/c/test',
          }),
        },
      },
      billingPortal: {
        sessions: {
          create: vi.fn(),
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    };

    (service as unknown as { stripeClient: unknown }).stripeClient = stripeMock;

    const result = await service.createCheckoutSession('tenant-1', 'owner@example.com', {
      plan: 'PRO',
      successUrl: 'https://app/success',
      cancelUrl: 'https://app/cancel',
    });

    expect(result.sessionId).toBe('cs_test_123');
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it('should return duplicate webhook response for processed events', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_123');

    prisma.billingEvent.findUnique.mockResolvedValue({ id: 'evt_record_1' });

    const stripeMock = {
      checkout: {
        sessions: {
          create: vi.fn(),
        },
      },
      billingPortal: {
        sessions: {
          create: vi.fn(),
        },
      },
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          id: 'evt_1',
          type: 'checkout.session.completed',
          livemode: false,
          data: {
            object: {
              metadata: {},
            },
          },
        }),
      },
    };

    (service as unknown as { stripeClient: unknown }).stripeClient = stripeMock;

    const result = await service.processWebhook(Buffer.from('{}'), 'signature');

    expect(result.duplicate).toBe(true);
    expect(prisma.billingEvent.create).not.toHaveBeenCalled();
  });
});
