import { Test, TestingModule } from '@nestjs/testing';
import { SsoController } from './sso.controller';
import { SsoService } from './sso.service';

describe('SsoController', () => {
  let controller: SsoController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    service = {
      listProviders: vi.fn().mockResolvedValue([{ id: 'provider-1' }]),
      createProvider: vi.fn().mockResolvedValue({ id: 'provider-1', slug: 'okta' }),
      updateProvider: vi.fn().mockResolvedValue({ id: 'provider-1', enabled: false }),
      deleteProvider: vi.fn().mockResolvedValue({ deleted: true }),
      createOauthAuthorizationUrl: vi
        .fn()
        .mockResolvedValue({ authorizationUrl: 'https://idp/auth' }),
      oauthCallback: vi.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
      samlAssertion: vi.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SsoController],
      providers: [
        {
          provide: SsoService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<SsoController>(SsoController);
  });

  it('should list tenant providers', async () => {
    const result = await controller.listProviders('tenant-1');

    expect(service.listProviders).toHaveBeenCalledWith('tenant-1');
    expect(result).toHaveLength(1);
  });

  it('should create provider', async () => {
    const result = await controller.createProvider('tenant-1', {
      name: 'Okta',
      protocol: 'OAUTH2',
    });

    expect(service.createProvider).toHaveBeenCalledWith('tenant-1', {
      name: 'Okta',
      protocol: 'OAUTH2',
    });
    expect(result.slug).toBe('okta');
  });

  it('should create oauth auth url', async () => {
    const result = await controller.createOauthAuthorizationUrl('tenant-1', 'provider-1', {
      redirectUri: 'https://app/callback',
    });

    expect(service.createOauthAuthorizationUrl).toHaveBeenCalledWith('tenant-1', 'provider-1', {
      redirectUri: 'https://app/callback',
    });
    expect(result.authorizationUrl).toContain('https://');
  });

  it('should call oauth callback handler', async () => {
    const result = await controller.oauthCallback('provider-1', 'code', 'state');

    expect(service.oauthCallback).toHaveBeenCalledWith('provider-1', 'code', 'state');
    expect(result.accessToken).toBe('access');
  });

  it('should call saml assertion handler', async () => {
    const result = await controller.samlAssertion(
      'provider-1',
      {
        email: 'sso@example.com',
      },
      'shared',
    );

    expect(service.samlAssertion).toHaveBeenCalledWith(
      'provider-1',
      {
        email: 'sso@example.com',
      },
      'shared',
    );
    expect(result.refreshToken).toBe('refresh');
  });
});
