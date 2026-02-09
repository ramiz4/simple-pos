import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed',
    role: 'ADMIN',
    accountId: 1,
    active: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: {
            validatePayload: vi.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data for valid payload', async () => {
      vi.spyOn(authService, 'validatePayload').mockResolvedValue(mockUser);

      const result = await strategy.validate({
        sub: 1,
        email: 'test@example.com',
        role: 'ADMIN',
        accountId: 1,
      });

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'ADMIN',
        accountId: 1,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      vi.spyOn(authService, 'validatePayload').mockResolvedValue(null);

      await expect(
        strategy.validate({
          sub: 999,
          email: 'unknown@example.com',
          role: 'ADMIN',
          accountId: 1,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      vi.spyOn(authService, 'validatePayload').mockResolvedValue({
        ...mockUser,
        active: false,
      });

      await expect(
        strategy.validate({
          sub: 1,
          email: 'test@example.com',
          role: 'ADMIN',
          accountId: 1,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
