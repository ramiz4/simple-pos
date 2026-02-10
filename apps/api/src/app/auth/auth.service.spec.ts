import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-uuid-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: '',
    role: 'ADMIN',
    tenantId: 'tenant-uuid-1',
    active: true,
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('password123', 10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn().mockResolvedValue('mock-token'),
            verify: vi.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: vi.fn(),
            },
            tenant: {
              findUnique: vi.fn(),
            },
            tenantApiKey: {
              create: vi.fn(),
            },
            $transaction: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.unstubAllEnvs();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(null);

      await expect(service.login('unknown@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue({
        ...mockUser,
        active: false,
      });

      await expect(service.login('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);

      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when tenant context mismatches user tenant', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);

      await expect(
        service.login('test@example.com', 'password123', '550e8400-e29b-41d4-a716-446655440001'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens and user on successful login', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);

      const result = await service.login('test@example.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
      });
    });

    it('should call jwtService.signAsync for token generation', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);

      await service.login('test@example.com', 'password123');

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('register', () => {
    it('should create tenant, owner user, and api key', async () => {
      const tenant = {
        id: 'tenant-new-1',
        name: 'Test Business',
        subdomain: 'test-business',
        plan: 'FREE',
        status: 'TRIAL',
        trialEndsAt: new Date(),
      };
      const user = {
        id: 'user-new-1',
        tenantId: 'tenant-new-1',
        firstName: 'Owner',
        lastName: 'User',
        email: 'owner@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'ADMIN',
      };
      const apiKey = {
        id: 'key-1',
        name: 'default',
        keyPrefix: 'spk_12345678',
      };

      const transactionMock = {
        tenant: {
          create: vi.fn().mockResolvedValue(tenant),
        },
        user: {
          create: vi.fn().mockResolvedValue(user),
        },
        tenantApiKey: {
          create: vi.fn().mockResolvedValue(apiKey),
        },
      };

      const prismaMock = prismaService as unknown as {
        tenant: { findUnique: ReturnType<typeof vi.fn> };
        user: { findUnique: ReturnType<typeof vi.fn> };
        $transaction: ReturnType<typeof vi.fn>;
      };

      prismaMock.tenant.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.$transaction.mockImplementation(
        (callback: (tx: typeof transactionMock) => unknown) => callback(transactionMock),
      );

      const result = await service.register({
        businessName: 'Test Business',
        subdomain: 'test-business',
        ownerFirstName: 'Owner',
        ownerLastName: 'User',
        email: 'owner@test.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('owner@test.com');
      expect(result.tenant?.subdomain).toBe('test-business');
      expect(result.apiKey?.key.startsWith('spk_')).toBe(true);
      expect(transactionMock.tenant.create).toHaveBeenCalledTimes(1);
      expect(transactionMock.user.create).toHaveBeenCalledTimes(1);
      expect(transactionMock.tenantApiKey.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException for unknown refresh token', async () => {
      await expect(service.refreshToken('unknown-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully refresh a valid token', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);
      const loginResult = await service.login('test@example.com', 'password123');

      vi.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'user-uuid-1',
        email: 'test@example.com',
        role: 'ADMIN',
        tenantId: 'tenant-uuid-1',
      });
      vi.spyOn(service, 'findUserById').mockResolvedValue(mockUser);

      const result = await service.refreshToken(loginResult.refreshToken);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);
      const loginResult = await service.login('test@example.com', 'password123');

      // Manipulate the stored token to be expired by advancing Date.now
      const originalDateNow = Date.now;
      Date.now = () => originalDateNow() + 31 * 24 * 60 * 60 * 1000; // 31 days in future

      await expect(service.refreshToken(loginResult.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      Date.now = originalDateNow;
    });

    it('should throw when user is not found during refresh', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);
      const loginResult = await service.login('test@example.com', 'password123');

      vi.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'user-uuid-1',
        email: 'test@example.com',
        role: 'ADMIN',
        tenantId: 'tenant-uuid-1',
      });
      vi.spyOn(service, 'findUserById').mockResolvedValue(null);

      await expect(service.refreshToken(loginResult.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw when user is inactive during refresh', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);
      const loginResult = await service.login('test@example.com', 'password123');

      vi.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'user-uuid-1',
        email: 'test@example.com',
        role: 'ADMIN',
        tenantId: 'tenant-uuid-1',
      });
      vi.spyOn(service, 'findUserById').mockResolvedValue({ ...mockUser, active: false });

      await expect(service.refreshToken(loginResult.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile when user exists', async () => {
      vi.spyOn(service, 'findUserById').mockResolvedValue(mockUser);

      const result = await service.getProfile('user-uuid-1');

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      vi.spyOn(service, 'findUserById').mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-uuid')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should remove refresh token from store', async () => {
      vi.spyOn(service, 'findUserByEmail').mockResolvedValue(mockUser);
      const loginResult = await service.login('test@example.com', 'password123');

      expect(() => service.logout(loginResult.refreshToken)).not.toThrow();
    });

    it('should handle logout without refresh token', () => {
      expect(() => service.logout()).not.toThrow();
    });
  });

  describe('validatePayload', () => {
    it('should return user for valid payload', async () => {
      vi.spyOn(service, 'findUserById').mockResolvedValue(mockUser);

      const result = await service.validatePayload({
        sub: 'user-uuid-1',
        email: 'test@example.com',
        role: 'ADMIN',
        tenantId: 'tenant-uuid-1',
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      vi.spyOn(service, 'findUserById').mockResolvedValue(null);

      const result = await service.validatePayload({
        sub: 'nonexistent-uuid',
        email: 'test@example.com',
        role: 'ADMIN',
        tenantId: 'tenant-uuid-1',
      });

      expect(result).toBeNull();
    });
  });

  describe('getRefreshTokenSecret', () => {
    it('should return default secret when env var is not set', () => {
      vi.stubEnv('JWT_REFRESH_SECRET', '');
      const secret = service.getRefreshTokenSecret();
      expect(secret).toBe('simple-pos-refresh-secret-dev-only');
    });

    it('should return env var when set', () => {
      vi.stubEnv('JWT_REFRESH_SECRET', 'my-custom-secret');
      const secret = service.getRefreshTokenSecret();
      expect(secret).toBe('my-custom-secret');
    });
  });
});
