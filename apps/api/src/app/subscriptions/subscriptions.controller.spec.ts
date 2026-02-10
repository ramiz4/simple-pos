import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    service = {
      createCheckoutSession: vi.fn().mockResolvedValue({
        sessionId: 'cs_test_1',
        url: 'https://checkout.stripe.com/test',
      }),
      createPortalSession: vi.fn().mockResolvedValue({
        url: 'https://billing.stripe.com/test',
      }),
      processWebhook: vi.fn().mockResolvedValue({ received: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });

  it('should create checkout session', async () => {
    const result = await controller.createCheckoutSession('tenant-1', 'owner@example.com', {
      plan: 'PRO',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    expect(service.createCheckoutSession).toHaveBeenCalledWith(
      'tenant-1',
      'owner@example.com',
      expect.objectContaining({ plan: 'PRO' }),
    );
    expect(result.sessionId).toBe('cs_test_1');
  });

  it('should create portal session', async () => {
    const result = await controller.createPortalSession('tenant-1', {
      returnUrl: 'https://app.test/settings',
    });

    expect(service.createPortalSession).toHaveBeenCalledWith('tenant-1', {
      returnUrl: 'https://app.test/settings',
    });
    expect(result.url).toContain('billing.stripe.com');
  });

  it('should process webhook payload', async () => {
    const req = {
      body: Buffer.from('{"id":"evt_1"}', 'utf-8'),
    } as unknown as Request;

    const result = await controller.webhook(req, 'signature');

    expect(service.processWebhook).toHaveBeenCalled();
    expect(result.received).toBe(true);
  });
});
