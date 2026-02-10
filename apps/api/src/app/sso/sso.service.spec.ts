import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { SsoService } from './sso.service';

describe('SsoService', () => {
  let service: SsoService;
  let prisma: {
    ssoProvider: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let auth: {
    issueSessionForUserId: ReturnType<typeof vi.fn>;
  };
  let jwt: {
    verify: ReturnType<typeof vi.fn>;
    sign: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      ssoProvider: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    auth = {
      issueSessionForUserId: vi.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      }),
    };

    jwt = {
      verify: vi.fn(),
      sign: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SsoService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AuthService,
          useValue: auth,
        },
        {
          provide: JwtService,
          useValue: jwt,
        },
      ],
    }).compile();

    service = module.get<SsoService>(SsoService);
  });

  it('should redact client secrets from list response', async () => {
    prisma.ssoProvider.findMany.mockResolvedValue([
      {
        id: 'provider-1',
        tenantId: 'tenant-1',
        name: 'Okta',
        slug: 'okta',
        protocol: 'OAUTH2',
        enabled: true,
        authorizationUrl: 'https://idp.example.com/auth',
        tokenUrl: 'https://idp.example.com/token',
        userInfoUrl: 'https://idp.example.com/userinfo',
        issuer: null,
        entryPoint: null,
        callbackUrl: 'https://app.example.com/callback',
        clientId: 'client-id',
        clientSecret: 'secret',
        scopes: ['openid'],
        roleMappings: {},
        claimMapping: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.listProviders('tenant-1');

    expect(result[0].hasClientSecret).toBe(true);
    expect(result[0].clientSecret).toBeUndefined();
  });

  it('should create oauth authorization url', async () => {
    prisma.ssoProvider.findFirst.mockResolvedValue({
      id: 'provider-1',
      tenantId: 'tenant-1',
      name: 'Okta',
      slug: 'okta',
      protocol: 'OAUTH2',
      enabled: true,
      authorizationUrl: 'https://idp.example.com/auth',
      tokenUrl: 'https://idp.example.com/token',
      userInfoUrl: 'https://idp.example.com/userinfo',
      issuer: null,
      entryPoint: null,
      callbackUrl: 'https://app.example.com/callback',
      clientId: 'client-id',
      clientSecret: 'secret',
      scopes: ['openid', 'email'],
      roleMappings: {},
      claimMapping: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createOauthAuthorizationUrl('tenant-1', 'provider-1', {
      redirectUri: undefined,
    });

    expect(result.authorizationUrl).toContain('https://idp.example.com/auth?');
    expect(result.authorizationUrl).toContain('state=');
  });

  it('should reject expired oauth state', async () => {
    await expect(service.oauthCallback('provider-1', 'code', 'missing-state')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject malformed oauth state payload', async () => {
    jwt.verify.mockReturnValue({ sub: 'user-123' }); // Missing tid, pid, uri
    await expect(
      service.oauthCallback('provider-1', 'code', 'valid-jwt-but-wrong-payload'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should authenticate saml assertion and auto-provision user', async () => {
    prisma.ssoProvider.findUnique.mockResolvedValue({
      id: 'provider-1',
      tenantId: 'tenant-1',
      protocol: 'SAML',
      enabled: true,
      roleMappings: {
        ADMIN: ['restaurant-admin'],
      },
      claimMapping: {
        autoProvisionUsers: true,
      },
      clientSecret: 'shared-secret',
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'owner@example.com',
      firstName: 'Owner',
      lastName: 'User',
      role: 'ADMIN',
      password: null,
    });

    const result = await service.samlAssertion(
      'provider-1',
      {
        email: 'owner@example.com',
        firstName: 'Owner',
        lastName: 'User',
        roles: ['restaurant-admin'],
      },
      'shared-secret',
    );

    expect(prisma.user.create).toHaveBeenCalled();
    expect(auth.issueSessionForUserId).toHaveBeenCalledWith('user-1');
    expect(result.accessToken).toBe('access');
  });
});
