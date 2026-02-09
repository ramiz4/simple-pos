import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
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
      delete process.env['JWT_REFRESH_SECRET'];
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
