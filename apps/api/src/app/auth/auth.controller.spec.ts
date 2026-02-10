import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: 'user-uuid-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
      tenantId: 'tenant-uuid-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: vi.fn().mockResolvedValue(mockAuthResponse),
            register: vi.fn().mockResolvedValue(mockAuthResponse),
            refreshToken: vi.fn().mockResolvedValue(mockAuthResponse),
            getProfile: vi.fn().mockResolvedValue(mockAuthResponse.user),
            logout: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password, undefined);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('register', () => {
    it('should call authService.register with correct payload', async () => {
      const dto = {
        businessName: 'Test Business',
        subdomain: 'test-business',
        ownerFirstName: 'Test',
        ownerLastName: 'Owner',
        email: 'owner@test.com',
        password: 'password123',
      };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken with correct parameters', async () => {
      const dto = { refreshToken: 'mock-refresh-token' };

      const result = await controller.refresh(dto);

      expect(authService.refreshToken).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile with user id from request', async () => {
      const req = { user: { id: 'user-uuid-1' } };

      const result = await controller.getProfile(req);

      expect(authService.getProfile).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockAuthResponse.user);
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return success message', () => {
      const body = { refreshToken: 'mock-refresh-token' };

      const result = controller.logout(body);

      expect(authService.logout).toHaveBeenCalledWith('mock-refresh-token');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should handle logout without refresh token', () => {
      const result = controller.logout({});

      expect(authService.logout).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});
