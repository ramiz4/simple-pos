import { TestBed } from '@angular/core/testing';
import { Account, User, UserRoleEnum } from '@simple-pos/shared/types';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { CloudAuthClientService } from '../../infrastructure/http/cloud-auth-client.service';
import { USER_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';
import { InputSanitizerService } from '../../shared/utilities/input-sanitizer.service';
import { AccountService } from './account.service';
import { AuthService, UserSession } from './auth.service';
import { EnumMappingService } from './enum-mapping.service';

// Mock bcrypt module
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: {
    findByName: Mock;
    findByNameAndAccount: Mock;
    findByEmail: Mock;
    findById: Mock;
    findByAccountId: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
    findAll: Mock;
  };
  let mockEnumMappingService: {
    getEnumFromId: Mock;
    getEnumFromCode: Mock;
    getRoleByCode?: Mock;
    getRoleById?: Mock;
    init?: Mock;
  };
  let mockAccountService: { getAccountById: Mock; createAccount: Mock };
  let mockInputSanitizer: {
    sanitizeUsername: Mock;
    sanitizePin: Mock;
    sanitizeEmail: Mock;
    sanitizeName: Mock;
  };
  let sessionStorageMock: Record<string, string>;
  let bcrypt: { hash: Mock; compare: Mock };

  const mockUser: User = {
    id: 1,
    name: 'testuser',
    email: 'test@example.com',
    roleId: 1,
    pinHash: '$2a$10$abcdefghijklmnopqrstuv', // bcrypt hash placeholder
    passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
    active: true,
    accountId: 1,
    isOwner: true,
  };

  const mockAccount: Account = {
    id: 1,
    name: 'Test Account',
    email: 'account@example.com',
    active: true,
    createdAt: new Date().toISOString(),
  };

  const mockRoleInfo = {
    id: 1,
    code: UserRoleEnum.ADMIN,
    name: 'Administrator',
  };

  beforeEach(async () => {
    // Import bcrypt for mocking
    bcrypt = (await import('bcryptjs')) as unknown as typeof bcrypt;

    // Reset bcrypt mocks
    vi.mocked(bcrypt.hash).mockReset();
    vi.mocked(bcrypt.compare).mockReset();
    vi.mocked(bcrypt.hash).mockResolvedValue('hashedvalue' as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    // Mock sessionStorage
    sessionStorageMock = {};
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key: string) => sessionStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          sessionStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete sessionStorageMock[key];
        }),
        clear: vi.fn(() => {
          sessionStorageMock = {};
        }),
      },
      writable: true,
    });

    // Mock user repository
    mockUserRepo = {
      findByName: vi.fn(),
      findByNameAndAccount: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findByAccountId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findAll: vi.fn(),
    };

    // Mock EnumMappingService
    mockEnumMappingService = {
      getEnumFromId: vi.fn().mockResolvedValue(mockRoleInfo),
      getEnumFromCode: vi.fn().mockResolvedValue(mockRoleInfo),
    };

    // Mock AccountService
    mockAccountService = {
      getAccountById: vi.fn().mockResolvedValue(mockAccount),
      createAccount: vi.fn().mockResolvedValue(mockAccount),
    };

    // Mock InputSanitizerService
    mockInputSanitizer = {
      sanitizeUsername: vi.fn((val: string) => val.trim()),
      sanitizePin: vi.fn((val: string) => val.trim()),
      sanitizeEmail: vi.fn((val: string) => val.trim().toLowerCase()),
      sanitizeName: vi.fn((val: string) => val.trim()),
    };

    // Mock CloudAuthClientService
    const mockCloudAuthClientService = {
      login: vi.fn(),
      refresh: vi.fn(),
    };

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
        { provide: EnumMappingService, useValue: mockEnumMappingService },
        { provide: AccountService, useValue: mockAccountService },
        { provide: InputSanitizerService, useValue: mockInputSanitizer },
        { provide: CloudAuthClientService, useValue: mockCloudAuthClientService },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should load session from storage on initialization', () => {
      const mockSession: UserSession = {
        user: mockUser,
        roleCode: UserRoleEnum.ADMIN,
        accountId: 1,
        accountName: 'Test Account',
        isStaffActive: true,
      };

      sessionStorageMock['userSession'] = JSON.stringify(mockSession);

      // Create new service instance to trigger constructor
      const newService = new AuthService(
        mockUserRepo as any,
        mockEnumMappingService as unknown as EnumMappingService,
        mockAccountService as unknown as AccountService,
        mockInputSanitizer as unknown as InputSanitizerService,
      );

      expect(newService.getCurrentSession()).toEqual(mockSession);
    });

    it('should handle invalid session data in storage', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        /* intentional empty for test */
      });
      sessionStorageMock['userSession'] = 'invalid json';

      // Create new service instance to trigger constructor
      const newService = new AuthService(
        mockUserRepo as any,
        mockEnumMappingService as unknown as EnumMappingService,
        mockAccountService as unknown as AccountService,
        mockInputSanitizer as unknown as InputSanitizerService,
      );

      expect(newService.getCurrentSession()).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Login with Username and PIN', () => {
    it('should successfully login with valid credentials', async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);

      const session = await service.login('testuser', '1234');

      expect(session).toBeDefined();
      expect(session.user).toEqual(mockUser);
      expect(session.roleCode).toBe(UserRoleEnum.ADMIN);
      expect(session.accountId).toBe(1);
      expect(session.accountName).toBe('Test Account');
      expect(session.isStaffActive).toBe(true);
    });

    it('should successfully login with accountId specified', async () => {
      mockUserRepo.findByNameAndAccount.mockResolvedValue(mockUser);

      const session = await service.login('testuser', '1234', 1);

      expect(mockUserRepo.findByNameAndAccount).toHaveBeenCalledWith('testuser', 1);
      expect(session.user).toEqual(mockUser);
    });

    it('should sanitize username and pin inputs', async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);

      await service.login(' testuser ', ' 1234 ');

      expect(mockInputSanitizer.sanitizeUsername).toHaveBeenCalledWith(' testuser ');
      expect(mockInputSanitizer.sanitizePin).toHaveBeenCalledWith(' 1234 ');
    });

    it('should throw error for invalid username', async () => {
      mockInputSanitizer.sanitizeUsername.mockReturnValue('');

      await expect(service.login('', '1234')).rejects.toThrow('Invalid username or PIN');
    });

    it('should throw error for invalid PIN', async () => {
      mockInputSanitizer.sanitizePin.mockReturnValue('');

      await expect(service.login('testuser', '')).rejects.toThrow('Invalid username or PIN');
    });

    it('should throw error for non-existent user', async () => {
      mockUserRepo.findByName.mockResolvedValue(null);

      await expect(service.login('nonexistent', '1234')).rejects.toThrow('Invalid username or PIN');
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, active: false };
      mockUserRepo.findByName.mockResolvedValue(inactiveUser);

      await expect(service.login('testuser', '1234')).rejects.toThrow('User account is inactive');
    });

    it('should throw error for incorrect PIN', async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      await expect(service.login('testuser', 'wrongpin')).rejects.toThrow(
        'Invalid username or PIN',
      );
    });

    it('should throw error when account not found', async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);
      mockAccountService.getAccountById.mockResolvedValue(null);

      await expect(service.login('testuser', '1234')).rejects.toThrow(
        'Account not found. Please contact support.',
      );
    });

    it('should save session to storage after successful login', async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);

      await service.login('testuser', '1234');

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('userSession', expect.any(String));
    });

    it('should set current session after successful login', async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);

      await service.login('testuser', '1234');

      expect(service.getCurrentSession()).toBeTruthy();
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('Login with Email and Password', () => {
    it('should successfully login with valid email and password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      const session = await service.loginWithEmail('test@example.com', 'password123');

      expect(session).toBeDefined();
      expect(session.user).toEqual(mockUser);
      expect(session.roleCode).toBe(UserRoleEnum.ADMIN);
      expect(session.isStaffActive).toBe(false); // Email login sets to false
    });

    it('should sanitize email input', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      await service.loginWithEmail(' TEST@EXAMPLE.COM ', 'password123');

      expect(mockInputSanitizer.sanitizeEmail).toHaveBeenCalledWith(' TEST@EXAMPLE.COM ');
    });

    it('should throw error for invalid email', async () => {
      mockInputSanitizer.sanitizeEmail.mockReturnValue('');

      await expect(service.loginWithEmail('', 'password123')).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw error for empty password', async () => {
      await expect(service.loginWithEmail('test@example.com', '')).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw error for non-existent user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(service.loginWithEmail('unknown@example.com', 'password123')).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, active: false };
      mockUserRepo.findByEmail.mockResolvedValue(inactiveUser);

      await expect(service.loginWithEmail('test@example.com', 'password123')).rejects.toThrow(
        'User account is inactive',
      );
    });

    it('should throw error when user has no password hash', async () => {
      const userWithoutPassword = { ...mockUser, passwordHash: undefined };
      mockUserRepo.findByEmail.mockResolvedValue(userWithoutPassword);

      await expect(service.loginWithEmail('test@example.com', 'password123')).rejects.toThrow(
        'Password login not enabled for this user',
      );
    });

    it('should throw error for incorrect password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      await expect(service.loginWithEmail('test@example.com', 'wrongpass')).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw error when account not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      mockAccountService.getAccountById.mockResolvedValue(null);

      await expect(service.loginWithEmail('test@example.com', 'password123')).rejects.toThrow(
        'Account not found',
      );
    });
  });

  describe('Logout', () => {
    it('should clear current session on logout', async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);

      await service.login('testuser', '1234');
      expect(service.isLoggedIn()).toBe(true);

      service.logout();

      expect(service.getCurrentSession()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should clear session from storage on logout', () => {
      service.logout();

      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('userSession');
    });
  });

  describe('Session Management', () => {
    it('should return current session', async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);

      const session = await service.login('testuser', '1234');

      expect(service.getCurrentSession()).toEqual(session);
    });

    it('should return null when not logged in', () => {
      expect(service.getCurrentSession()).toBeNull();
    });

    it('should correctly report login status', async () => {
      expect(service.isLoggedIn()).toBe(false);

      mockUserRepo.findByName.mockResolvedValue(mockUser);
      await service.login('testuser', '1234');

      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('Staff Active Status', () => {
    beforeEach(async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);
      await service.login('testuser', '1234');
    });

    it('should return staff active status', () => {
      expect(service.isStaffActive()).toBe(true);
    });

    it('should set staff active status', () => {
      service.setStaffActive(false);

      expect(service.isStaffActive()).toBe(false);
    });

    it('should persist staff active status to storage', () => {
      service.setStaffActive(false);

      const stored = sessionStorageMock['userSession'];
      const session = JSON.parse(stored);

      expect(session.isStaffActive).toBe(false);
    });

    it('should return false when not logged in', () => {
      service.logout();

      expect(service.isStaffActive()).toBe(false);
    });

    it('should not throw error when setting staff active without session', () => {
      service.logout();

      expect(() => service.setStaffActive(true)).not.toThrow();
    });
  });

  describe('Role Checking', () => {
    beforeEach(async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);
      await service.login('testuser', '1234');
    });

    it('should return true for matching role', () => {
      expect(service.hasRole(UserRoleEnum.ADMIN)).toBe(true);
    });

    it('should return false for non-matching role', () => {
      expect(service.hasRole(UserRoleEnum.CASHIER)).toBe(false);
    });

    it('should return true if user has any of the specified roles', () => {
      expect(service.hasAnyRole([UserRoleEnum.ADMIN, UserRoleEnum.CASHIER])).toBe(true);
    });

    it('should return false if user has none of the specified roles', () => {
      expect(service.hasAnyRole([UserRoleEnum.CASHIER, UserRoleEnum.KITCHEN])).toBe(false);
    });

    it('should return false when not logged in', () => {
      service.logout();

      expect(service.hasRole(UserRoleEnum.ADMIN)).toBe(false);
      expect(service.hasAnyRole([UserRoleEnum.ADMIN])).toBe(false);
    });
  });

  describe('Password and PIN Hashing', () => {
    it('should hash password using bcrypt', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed' as never);

      const result = await service.hashPassword('mypassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 10);
      expect(result).toBe('hashed');
    });

    it('should hash PIN using bcrypt', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed' as never);

      const result = await service.hashPin('1234');

      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
      expect(result).toBe('hashed');
    });
  });

  describe('User Registration', () => {
    beforeEach(() => {
      mockUserRepo.create.mockResolvedValue({
        ...mockUser,
        id: 1,
      });
    });

    it('should register new user with account', async () => {
      const result = await service.register(
        'owner@example.com',
        'owneruser',
        '135790',
        'password123',
      );

      expect(result.user).toBeDefined();
      expect(result.account).toBeDefined();
      expect(mockAccountService.createAccount).toHaveBeenCalled();
      expect(mockUserRepo.create).toHaveBeenCalled();
    });

    it('should derive username from email when not provided', async () => {
      await service.register('john@example.com');

      expect(mockInputSanitizer.sanitizeUsername).toHaveBeenCalledWith('john');
    });

    it('should use provided username', async () => {
      await service.register('owner@example.com', 'customuser');

      expect(mockInputSanitizer.sanitizeUsername).toHaveBeenCalledWith('customuser');
    });

    it('should use default PIN when not provided', async () => {
      await service.register('owner@example.com');

      const createCall = mockUserRepo.create.mock.calls[0][0];
      expect(createCall.pinHash).toBe('hashedvalue');
      expect(bcrypt.hash).toHaveBeenCalledWith('0000', 10);
    });

    it('should hash provided PIN', async () => {
      await service.register('owner@example.com', 'user', '579135');

      expect(bcrypt.hash).toHaveBeenCalledWith('579135', 10);
    });

    it('should hash provided password', async () => {
      await service.register('owner@example.com', 'user', '135790', 'securepass');

      const createCall = mockUserRepo.create.mock.calls[0][0];
      expect(createCall.passwordHash).toBe('hashedvalue');
    });

    it('should handle local setup domain email', async () => {
      await service.register('owner_123@local.pos');

      expect(mockInputSanitizer.sanitizeName).toHaveBeenCalledWith('Owner Account');
    });

    it('should handle username collision by appending suffix', async () => {
      mockUserRepo.create
        .mockRejectedValueOnce(new Error('UNIQUE constraint failed'))
        .mockResolvedValueOnce({ ...mockUser, name: 'testuser1' });

      const result = await service.register('test@example.com', 'testuser', '135790');

      expect(mockUserRepo.create).toHaveBeenCalledTimes(2);
      expect(result.user.name).toBe('testuser1');
    });

    it('should throw error after max collision attempts', async () => {
      mockUserRepo.create.mockRejectedValue(new Error('UNIQUE constraint failed'));

      await expect(service.register('test@example.com', 'testuser', '135790')).rejects.toThrow(
        'Unable to create user. Please try a different username.',
      );

      expect(mockUserRepo.create).toHaveBeenCalledTimes(10);
    });

    it('should throw error for invalid account name', async () => {
      mockInputSanitizer.sanitizeName.mockReturnValue('x'); // Too short

      await expect(service.register('test@example.com')).rejects.toThrow(
        'Account name must be between 2 and 100 characters',
      );
    });

    it('should throw error for invalid email', async () => {
      mockInputSanitizer.sanitizeEmail.mockReturnValue('invalid-email');

      await expect(service.register('invalid-email')).rejects.toThrow('Invalid email address');
    });

    it('should create user with ADMIN role', async () => {
      await service.register('test@example.com');

      const createCall = mockUserRepo.create.mock.calls[0][0];
      expect(createCall.roleId).toBe(mockRoleInfo.id);
      expect(mockEnumMappingService.getEnumFromCode).toHaveBeenCalledWith(UserRoleEnum.ADMIN);
    });

    it('should mark user as owner', async () => {
      await service.register('test@example.com');

      const createCall = mockUserRepo.create.mock.calls[0][0];
      expect(createCall.isOwner).toBe(true);
    });

    it('should set user as active', async () => {
      await service.register('test@example.com');

      const createCall = mockUserRepo.create.mock.calls[0][0];
      expect(createCall.active).toBe(true);
    });
  });

  describe('User Creation', () => {
    it('should create user with specified parameters', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashedpin' as never);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const result = await service.createUser('newuser', '1234', 2, 1, 'user@example.com');

      expect(mockUserRepo.create).toHaveBeenCalledWith({
        name: 'newuser',
        email: 'user@example.com',
        roleId: 2,
        pinHash: 'hashedpin',
        active: true,
        accountId: 1,
        isOwner: false,
      });
      expect(result).toEqual(mockUser);
    });

    it('should create user without email', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashedpin' as never);
      mockUserRepo.create.mockResolvedValue(mockUser);

      await service.createUser('newuser', '1234', 2, 1);

      const createCall = mockUserRepo.create.mock.calls[0][0];
      expect(createCall.email).toBeUndefined();
    });

    it('should hash PIN before creating user', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashedpin' as never);
      mockUserRepo.create.mockResolvedValue(mockUser);

      await service.createUser('newuser', '9876', 2, 1);

      expect(bcrypt.hash).toHaveBeenCalledWith('9876', 10);
    });
  });

  describe('Get Users by Account', () => {
    it('should return users for specified account', async () => {
      const users = [mockUser, { ...mockUser, id: 2, name: 'user2' }];
      mockUserRepo.findByAccountId.mockResolvedValue(users);

      const result = await service.getUsersByAccount(1);

      expect(mockUserRepo.findByAccountId).toHaveBeenCalledWith(1);
      expect(result).toEqual(users);
    });

    it('should return empty array when no users found', async () => {
      mockUserRepo.findByAccountId.mockResolvedValue([]);

      const result = await service.getUsersByAccount(999);

      expect(result).toEqual([]);
    });
  });

  describe('Setup Completion Check', () => {
    it('should return true when users exist', async () => {
      mockUserRepo.count.mockResolvedValue(5);

      const result = await service.isSetupComplete();

      expect(result).toBe(true);
    });

    it('should return false when no users exist', async () => {
      mockUserRepo.count.mockResolvedValue(0);

      const result = await service.isSetupComplete();

      expect(result).toBe(false);
    });
  });

  describe('Owner Password Verification', () => {
    beforeEach(async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);
      await service.login('testuser', '1234');
    });

    it('should return true for correct owner password', async () => {
      const ownerUser = { ...mockUser, isOwner: true, passwordHash: 'ownerpasshash' };
      mockUserRepo.findByAccountId.mockResolvedValue([ownerUser]);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await service.verifyOwnerPassword('correctpassword');

      expect(result).toBe(true);
    });

    it('should return false for incorrect owner password', async () => {
      const ownerUser = { ...mockUser, isOwner: true, passwordHash: 'ownerpasshash' };
      mockUserRepo.findByAccountId.mockResolvedValue([ownerUser]);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      const result = await service.verifyOwnerPassword('wrongpassword');

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      service.logout();

      const result = await service.verifyOwnerPassword('password');

      expect(result).toBe(false);
    });

    it('should return false when no owners found', async () => {
      mockUserRepo.findByAccountId.mockResolvedValue([]);

      const result = await service.verifyOwnerPassword('password');

      expect(result).toBe(false);
    });

    it('should skip owners without password hash', async () => {
      const ownerWithoutPassword = { ...mockUser, isOwner: true, passwordHash: undefined };
      const ownerWithPassword = { ...mockUser, id: 2, isOwner: true, passwordHash: 'hash' };
      mockUserRepo.findByAccountId.mockResolvedValue([ownerWithoutPassword, ownerWithPassword]);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await service.verifyOwnerPassword('password');

      expect(result).toBe(true);
    });

    it('should check multiple owners', async () => {
      const owner1 = { ...mockUser, id: 1, isOwner: true, passwordHash: 'hash1' };
      const owner2 = { ...mockUser, id: 2, isOwner: true, passwordHash: 'hash2' };
      mockUserRepo.findByAccountId.mockResolvedValue([owner1, owner2]);
      vi.mocked(bcrypt.compare)
        .mockResolvedValueOnce(false as never)
        .mockResolvedValueOnce(true as never);

      const result = await service.verifyOwnerPassword('password');

      expect(result).toBe(true);
    });
  });

  describe('Default PIN Check', () => {
    it('should return true for default PIN', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await service.checkHasDefaultPin(mockUser);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('0000', mockUser.pinHash);
    });

    it('should return false for non-default PIN', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      const result = await service.checkHasDefaultPin(mockUser);

      expect(result).toBe(false);
    });
  });

  describe('Update User PIN', () => {
    it('should update user PIN with new hash', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('newhash' as never);
      mockUserRepo.update.mockResolvedValue(undefined);

      await service.updateUserPin(1, '5678');

      expect(bcrypt.hash).toHaveBeenCalledWith('5678', 10);
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, { pinHash: 'newhash' });
    });
  });

  describe('Update User Profile', () => {
    beforeEach(async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);
      await service.login('testuser', '1234');
    });

    it('should update user name', async () => {
      mockUserRepo.findById.mockResolvedValue({ ...mockUser, id: 2 });

      await service.updateUserProfile(2, 'New Name');

      expect(mockUserRepo.update).toHaveBeenCalledWith(2, { name: 'New Name' });
    });

    it('should update user email', async () => {
      mockUserRepo.findById.mockResolvedValue({ ...mockUser, id: 2 });

      await service.updateUserProfile(2, undefined, 'new@example.com');

      expect(mockUserRepo.update).toHaveBeenCalledWith(2, { email: 'new@example.com' });
    });

    it('should update both name and email', async () => {
      mockUserRepo.findById.mockResolvedValue({ ...mockUser, id: 2 });

      await service.updateUserProfile(2, 'New Name', 'new@example.com');

      expect(mockUserRepo.update).toHaveBeenCalledWith(2, {
        name: 'New Name',
        email: 'new@example.com',
      });
    });

    it('should allow empty email', async () => {
      mockUserRepo.findById.mockResolvedValue({ ...mockUser, id: 2 });

      await service.updateUserProfile(2, undefined, '  ');

      expect(mockUserRepo.update).toHaveBeenCalledWith(2, { email: undefined });
    });

    it('should throw error for non-existent user', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.updateUserProfile(999, 'Name')).rejects.toThrow('User not found');
    });

    it('should throw error when not owner', async () => {
      service.logout();
      const nonOwnerUser = { ...mockUser, isOwner: false };
      mockUserRepo.findByName.mockResolvedValue(nonOwnerUser);
      await service.login('testuser', '1234');

      mockUserRepo.findById.mockResolvedValue({ ...mockUser, id: 2 });

      await expect(service.updateUserProfile(2, 'Name')).rejects.toThrow(
        'Only the account owner can update user profiles',
      );
    });

    it('should throw error when no session', async () => {
      service.logout();
      mockUserRepo.findById.mockResolvedValue(mockUser);

      await expect(service.updateUserProfile(1, 'Name')).rejects.toThrow(
        'Only the account owner can update user profiles',
      );
    });

    it('should throw error for user from different account', async () => {
      const differentAccountUser = { ...mockUser, id: 2, accountId: 999 };
      mockUserRepo.findById.mockResolvedValue(differentAccountUser);

      await expect(service.updateUserProfile(2, 'Name')).rejects.toThrow(
        'User does not belong to your account',
      );
    });

    it('should throw error for invalid name', async () => {
      mockUserRepo.findById.mockResolvedValue({ ...mockUser, id: 2 });
      mockInputSanitizer.sanitizeName.mockReturnValue('x'); // Too short

      await expect(service.updateUserProfile(2, 'x')).rejects.toThrow('Invalid name');
    });

    it('should throw error for invalid email', async () => {
      mockUserRepo.findById.mockResolvedValue({ ...mockUser, id: 2 });
      mockInputSanitizer.sanitizeEmail.mockReturnValue('invalid');

      await expect(service.updateUserProfile(2, undefined, 'invalid')).rejects.toThrow(
        'Invalid email address',
      );
    });

    it('should sanitize inputs', async () => {
      mockUserRepo.findById.mockResolvedValue({ ...mockUser, id: 2 });

      await service.updateUserProfile(2, ' Name ', ' EMAIL@EXAMPLE.COM ');

      expect(mockInputSanitizer.sanitizeName).toHaveBeenCalledWith(' Name ');
      expect(mockInputSanitizer.sanitizeEmail).toHaveBeenCalledWith(' EMAIL@EXAMPLE.COM ');
    });
  });

  describe('Verify Admin PIN', () => {
    beforeEach(async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);
      await service.login('testuser', '1234');
    });

    it('should return true for correct admin PIN', async () => {
      const adminUser = { ...mockUser, roleId: mockRoleInfo.id };
      mockUserRepo.findByAccountId.mockResolvedValue([adminUser]);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await service.verifyAdminPin('1234');

      expect(result).toBe(true);
    });

    it('should return false for incorrect admin PIN', async () => {
      const adminUser = { ...mockUser, roleId: mockRoleInfo.id };
      mockUserRepo.findByAccountId.mockResolvedValue([adminUser]);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      const result = await service.verifyAdminPin('9999');

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      service.logout();

      const result = await service.verifyAdminPin('1234');

      expect(result).toBe(false);
    });

    it('should return false when no admins found', async () => {
      mockUserRepo.findByAccountId.mockResolvedValue([]);

      const result = await service.verifyAdminPin('1234');

      expect(result).toBe(false);
    });

    it('should check multiple admins', async () => {
      const admin1 = { ...mockUser, id: 1, roleId: mockRoleInfo.id };
      const admin2 = { ...mockUser, id: 2, roleId: mockRoleInfo.id };
      mockUserRepo.findByAccountId.mockResolvedValue([admin1, admin2]);
      vi.mocked(bcrypt.compare)
        .mockResolvedValueOnce(false as never)
        .mockResolvedValueOnce(true as never);

      const result = await service.verifyAdminPin('1234');

      expect(result).toBe(true);
    });
  });

  describe('Delete User', () => {
    beforeEach(async () => {
      mockUserRepo.findByName.mockResolvedValue(mockUser);
      await service.login('testuser', '1234');
    });

    it('should delete user successfully', async () => {
      const userToDelete = { ...mockUser, id: 2, isOwner: false };
      mockUserRepo.findById.mockResolvedValue(userToDelete);
      mockUserRepo.delete.mockResolvedValue(undefined);

      await service.deleteUser(2);

      expect(mockUserRepo.delete).toHaveBeenCalledWith(2);
    });

    it('should throw error for non-existent user', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.deleteUser(999)).rejects.toThrow('User not found');
    });

    it('should throw error when not owner', async () => {
      service.logout();
      const nonOwnerUser = { ...mockUser, isOwner: false };
      mockUserRepo.findByName.mockResolvedValue(nonOwnerUser);
      await service.login('testuser', '1234');

      const userToDelete = { ...mockUser, id: 2, isOwner: false };
      mockUserRepo.findById.mockResolvedValue(userToDelete);

      await expect(service.deleteUser(2)).rejects.toThrow(
        'Only the account owner can delete users',
      );
    });

    it('should throw error when no session', async () => {
      service.logout();
      mockUserRepo.findById.mockResolvedValue(mockUser);

      await expect(service.deleteUser(1)).rejects.toThrow(
        'Only the account owner can delete users',
      );
    });

    it('should throw error for user from different account', async () => {
      const differentAccountUser = { ...mockUser, id: 2, accountId: 999, isOwner: false };
      mockUserRepo.findById.mockResolvedValue(differentAccountUser);

      await expect(service.deleteUser(2)).rejects.toThrow('User does not belong to your account');
    });

    it('should throw error when trying to delete owner', async () => {
      const ownerUser = { ...mockUser, id: 2, isOwner: true };
      mockUserRepo.findById.mockResolvedValue(ownerUser);

      await expect(service.deleteUser(2)).rejects.toThrow('Account owner cannot be deleted');
    });

    it('should throw error when trying to delete own profile', async () => {
      const userToDelete = { ...mockUser, id: 1, isOwner: false };
      mockUserRepo.findById.mockResolvedValue(userToDelete);

      await expect(service.deleteUser(1)).rejects.toThrow('You cannot delete your own profile');
    });
  });

  describe('Storage Edge Cases', () => {
    it('should handle missing sessionStorage gracefully in save', () => {
      const originalSessionStorage = window.sessionStorage;
      Object.defineProperty(window, 'sessionStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Service should handle this gracefully
      expect(() => service.logout()).not.toThrow();

      // Restore
      Object.defineProperty(window, 'sessionStorage', {
        value: originalSessionStorage,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user lifecycle', async () => {
      mockUserRepo.create.mockResolvedValue(mockUser);

      // Register - use valid PIN that passes all validation
      const { user } = await service.register('test@example.com', 'testuser', '791357', 'password');
      expect(user).toBeDefined();

      // Login
      mockUserRepo.findByName.mockResolvedValue(user);
      const session = await service.login('testuser', '791357');
      expect(session.user).toEqual(user);

      // Check role
      expect(service.hasRole(UserRoleEnum.ADMIN)).toBe(true);

      // Logout
      service.logout();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should enforce security by preventing unauthorized actions', async () => {
      // Verify no password works without login
      const result = await service.verifyOwnerPassword('password');
      expect(result).toBe(false);

      // Try to delete user without login
      mockUserRepo.findById.mockResolvedValue(mockUser);
      await expect(service.deleteUser(1)).rejects.toThrow(
        'Only the account owner can delete users',
      );

      // Try to update profile without login
      await expect(service.updateUserProfile(1, 'Name')).rejects.toThrow(
        'Only the account owner can update user profiles',
      );
    });
  });
});
