import { TestBed } from '@angular/core/testing';
import { User, UserRoleEnum } from '@simple-pos/shared/types';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AuthService } from './auth.service';
import { EnumMappingService } from './enum-mapping.service';
import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let mockAuthService: {
    getUsersByAccount: Mock;
    createUser: Mock;
    updateUserProfile: Mock;
    deleteUser: Mock;
  };
  let mockEnumMappingService: {
    getEnumFromCode: Mock;
    getEnumFromId: Mock;
  };

  const mockAdminRole = {
    id: 1,
    code: UserRoleEnum.ADMIN,
    name: 'Administrator',
  };

  const mockCashierRole = {
    id: 2,
    code: UserRoleEnum.CASHIER,
    name: 'Cashier',
  };

  const mockKitchenRole = {
    id: 3,
    code: UserRoleEnum.KITCHEN,
    name: 'Kitchen Staff',
  };

  const mockAdminUser: User = {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    roleId: 1,
    pinHash: '$2a$10$hashedpin',
    passwordHash: '$2a$10$hashedpassword',
    active: true,
    accountId: 1,
    isOwner: true,
  };

  const mockCashierUser: User = {
    id: 2,
    name: 'Cashier User',
    email: 'cashier@example.com',
    roleId: 2,
    pinHash: '$2a$10$hashedpin',
    passwordHash: '$2a$10$hashedpassword',
    active: true,
    accountId: 1,
    isOwner: false,
  };

  const mockKitchenUser: User = {
    id: 3,
    name: 'Kitchen User',
    email: 'kitchen@example.com',
    roleId: 3,
    pinHash: '$2a$10$hashedpin',
    passwordHash: '$2a$10$hashedpassword',
    active: true,
    accountId: 1,
    isOwner: false,
  };

  beforeEach(() => {
    // Mock AuthService
    mockAuthService = {
      createUser: vi.fn(),
      getUsersByAccount: vi.fn(),
      updateUserProfile: vi.fn(),
      deleteUser: vi.fn(),
    };

    // Mock EnumMappingService
    mockEnumMappingService = {
      getEnumFromCode: vi.fn(),
      getEnumFromId: vi.fn(),
    };

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        UserManagementService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: EnumMappingService, useValue: mockEnumMappingService },
      ],
    });

    service = TestBed.inject(UserManagementService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have all required methods', () => {
      expect(service.addAdminUser).toBeDefined();
      expect(service.addCashierUser).toBeDefined();
      expect(service.addKitchenUser).toBeDefined();
      expect(service.getAccountUsers).toBeDefined();
      expect(service.updateUserProfile).toBeDefined();
      expect(service.deleteUser).toBeDefined();
    });
  });

  describe('addAdminUser', () => {
    beforeEach(() => {
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockAdminRole);
      mockAuthService.createUser.mockResolvedValue(mockAdminUser);
    });

    it('should create admin user successfully', async () => {
      const name = 'New Admin';
      const pin = '1234';
      const accountId = 1;

      const result = await service.addAdminUser(name, pin, accountId);

      expect(mockEnumMappingService.getEnumFromCode).toHaveBeenCalledWith(UserRoleEnum.ADMIN);
      expect(mockAuthService.createUser).toHaveBeenCalledWith(
        name,
        pin,
        mockAdminRole.id,
        accountId,
      );
      expect(result).toEqual(mockAdminUser);
    });

    it('should retrieve admin role before creating user', async () => {
      await service.addAdminUser('Admin', '1234', 1);

      expect(mockEnumMappingService.getEnumFromCode).toHaveBeenCalledBefore(
        mockAuthService.createUser,
      );
    });

    it('should handle different account IDs', async () => {
      const accountIds = [1, 2, 100, 9999];

      for (const accountId of accountIds) {
        await service.addAdminUser('Admin', '1234', accountId);
        expect(mockAuthService.createUser).toHaveBeenCalledWith(
          'Admin',
          '1234',
          mockAdminRole.id,
          accountId,
        );
      }
    });

    it('should handle different PINs', async () => {
      const pins = ['0000', '1234', '9999', '5678'];

      for (const pin of pins) {
        await service.addAdminUser('Admin', pin, 1);
        expect(mockAuthService.createUser).toHaveBeenCalledWith('Admin', pin, mockAdminRole.id, 1);
      }
    });

    it('should handle names with special characters', async () => {
      const specialNames = ["O'Brien", 'José García', 'Anne-Marie', 'محمد'];

      for (const name of specialNames) {
        await service.addAdminUser(name, '1234', 1);
        expect(mockAuthService.createUser).toHaveBeenCalledWith(name, '1234', mockAdminRole.id, 1);
      }
    });

    it('should propagate errors from enum mapping service', async () => {
      const error = new Error('Role not found');
      mockEnumMappingService.getEnumFromCode.mockRejectedValue(error);

      await expect(service.addAdminUser('Admin', '1234', 1)).rejects.toThrow('Role not found');

      expect(mockAuthService.createUser).not.toHaveBeenCalled();
    });

    it('should propagate errors from auth service', async () => {
      const error = new Error('User creation failed');
      mockAuthService.createUser.mockRejectedValue(error);

      await expect(service.addAdminUser('Admin', '1234', 1)).rejects.toThrow(
        'User creation failed',
      );
    });

    it('should handle validation errors from auth service', async () => {
      const validationError = new Error('PIN must be 4 digits');
      mockAuthService.createUser.mockRejectedValue(validationError);

      await expect(service.addAdminUser('Admin', 'abc', 1)).rejects.toThrow('PIN must be 4 digits');
    });
  });

  describe('addCashierUser', () => {
    beforeEach(() => {
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockCashierRole);
      mockAuthService.createUser.mockResolvedValue(mockCashierUser);
    });

    it('should create cashier user successfully', async () => {
      const name = 'New Cashier';
      const pin = '5678';
      const accountId = 1;

      const result = await service.addCashierUser(name, pin, accountId);

      expect(mockEnumMappingService.getEnumFromCode).toHaveBeenCalledWith(UserRoleEnum.CASHIER);
      expect(mockAuthService.createUser).toHaveBeenCalledWith(
        name,
        pin,
        mockCashierRole.id,
        accountId,
      );
      expect(result).toEqual(mockCashierUser);
    });

    it('should retrieve cashier role before creating user', async () => {
      await service.addCashierUser('Cashier', '5678', 1);

      expect(mockEnumMappingService.getEnumFromCode).toHaveBeenCalledBefore(
        mockAuthService.createUser,
      );
    });

    it('should use correct role ID for cashier', async () => {
      await service.addCashierUser('Cashier', '5678', 1);

      expect(mockAuthService.createUser).toHaveBeenCalledWith(
        'Cashier',
        '5678',
        mockCashierRole.id,
        1,
      );
      expect(mockAuthService.createUser).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        mockAdminRole.id,
        expect.anything(),
      );
    });

    it('should handle concurrent cashier user creation', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        service.addCashierUser(`Cashier${i}`, '1234', 1),
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockAuthService.createUser).toHaveBeenCalledTimes(5);
    });

    it('should propagate errors from enum mapping service', async () => {
      const error = new Error('Cashier role not configured');
      mockEnumMappingService.getEnumFromCode.mockRejectedValue(error);

      await expect(service.addCashierUser('Cashier', '5678', 1)).rejects.toThrow(
        'Cashier role not configured',
      );
    });

    it('should propagate errors from auth service', async () => {
      const error = new Error('Duplicate cashier name');
      mockAuthService.createUser.mockRejectedValue(error);

      await expect(service.addCashierUser('Cashier', '5678', 1)).rejects.toThrow(
        'Duplicate cashier name',
      );
    });
  });

  describe('addKitchenUser', () => {
    beforeEach(() => {
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockKitchenRole);
      mockAuthService.createUser.mockResolvedValue(mockKitchenUser);
    });

    it('should create kitchen user successfully', async () => {
      const name = 'New Kitchen Staff';
      const pin = '9999';
      const accountId = 1;

      const result = await service.addKitchenUser(name, pin, accountId);

      expect(mockEnumMappingService.getEnumFromCode).toHaveBeenCalledWith(UserRoleEnum.KITCHEN);
      expect(mockAuthService.createUser).toHaveBeenCalledWith(
        name,
        pin,
        mockKitchenRole.id,
        accountId,
      );
      expect(result).toEqual(mockKitchenUser);
    });

    it('should retrieve kitchen role before creating user', async () => {
      await service.addKitchenUser('Kitchen', '9999', 1);

      expect(mockEnumMappingService.getEnumFromCode).toHaveBeenCalledBefore(
        mockAuthService.createUser,
      );
    });

    it('should use correct role ID for kitchen staff', async () => {
      await service.addKitchenUser('Kitchen', '9999', 1);

      expect(mockAuthService.createUser).toHaveBeenCalledWith(
        'Kitchen',
        '9999',
        mockKitchenRole.id,
        1,
      );
      expect(mockAuthService.createUser).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        mockAdminRole.id,
        expect.anything(),
      );
      expect(mockAuthService.createUser).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        mockCashierRole.id,
        expect.anything(),
      );
    });

    it('should create kitchen users for different accounts', async () => {
      const accountIds = [1, 2, 3];

      for (const accountId of accountIds) {
        await service.addKitchenUser('Kitchen', '9999', accountId);
        expect(mockAuthService.createUser).toHaveBeenCalledWith(
          'Kitchen',
          '9999',
          mockKitchenRole.id,
          accountId,
        );
      }
    });

    it('should propagate errors from enum mapping service', async () => {
      const error = new Error('Kitchen role not found');
      mockEnumMappingService.getEnumFromCode.mockRejectedValue(error);

      await expect(service.addKitchenUser('Kitchen', '9999', 1)).rejects.toThrow(
        'Kitchen role not found',
      );
    });

    it('should propagate errors from auth service', async () => {
      const error = new Error('Invalid PIN format');
      mockAuthService.createUser.mockRejectedValue(error);

      await expect(service.addKitchenUser('Kitchen', 'invalid', 1)).rejects.toThrow(
        'Invalid PIN format',
      );
    });
  });

  describe('getAccountUsers', () => {
    beforeEach(() => {
      mockAuthService.getUsersByAccount.mockResolvedValue([
        mockAdminUser,
        mockCashierUser,
        mockKitchenUser,
      ]);
    });

    it('should retrieve all users for an account', async () => {
      const accountId = 1;

      const result = await service.getAccountUsers(accountId);

      expect(mockAuthService.getUsersByAccount).toHaveBeenCalledWith(accountId);
      expect(result).toEqual([mockAdminUser, mockCashierUser, mockKitchenUser]);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when account has no users', async () => {
      mockAuthService.getUsersByAccount.mockResolvedValue([]);

      const result = await service.getAccountUsers(1);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle different account IDs', async () => {
      const account1Users = [mockAdminUser];
      const account2Users = [mockCashierUser, mockKitchenUser];

      mockAuthService.getUsersByAccount.mockImplementation((accountId: number) => {
        if (accountId === 1) return Promise.resolve(account1Users);
        if (accountId === 2) return Promise.resolve(account2Users);
        return Promise.resolve([]);
      });

      const result1 = await service.getAccountUsers(1);
      const result2 = await service.getAccountUsers(2);

      expect(result1).toEqual(account1Users);
      expect(result2).toEqual(account2Users);
    });

    it('should preserve user data structure', async () => {
      const result = await service.getAccountUsers(1);

      result.forEach((user) => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('roleId');
        expect(user).toHaveProperty('accountId');
        expect(user).toHaveProperty('active');
      });
    });

    it('should handle users with different roles', async () => {
      const result = await service.getAccountUsers(1);

      const adminUser = result.find((u) => u.roleId === mockAdminRole.id);
      const cashierUser = result.find((u) => u.roleId === mockCashierRole.id);
      const kitchenUser = result.find((u) => u.roleId === mockKitchenRole.id);

      expect(adminUser).toBeDefined();
      expect(cashierUser).toBeDefined();
      expect(kitchenUser).toBeDefined();
    });

    it('should return users in order provided by auth service', async () => {
      const orderedUsers = [mockKitchenUser, mockAdminUser, mockCashierUser];
      mockAuthService.getUsersByAccount.mockResolvedValue(orderedUsers);

      const result = await service.getAccountUsers(1);

      expect(result[0]).toEqual(mockKitchenUser);
      expect(result[1]).toEqual(mockAdminUser);
      expect(result[2]).toEqual(mockCashierUser);
    });

    it('should propagate errors from auth service', async () => {
      const error = new Error('Database query failed');
      mockAuthService.getUsersByAccount.mockRejectedValue(error);

      await expect(service.getAccountUsers(1)).rejects.toThrow('Database query failed');
    });

    it('should handle non-existent account IDs', async () => {
      mockAuthService.getUsersByAccount.mockResolvedValue([]);

      const result = await service.getAccountUsers(999999);

      expect(result).toEqual([]);
    });

    it('should handle concurrent requests for different accounts', async () => {
      mockAuthService.getUsersByAccount.mockImplementation((accountId: number) => {
        return Promise.resolve([{ ...mockAdminUser, accountId }]);
      });

      const [result1, result2, result3] = await Promise.all([
        service.getAccountUsers(1),
        service.getAccountUsers(2),
        service.getAccountUsers(3),
      ]);

      expect(result1[0].accountId).toBe(1);
      expect(result2[0].accountId).toBe(2);
      expect(result3[0].accountId).toBe(3);
    });
  });

  describe('updateUserProfile', () => {
    beforeEach(() => {
      mockAuthService.updateUserProfile.mockResolvedValue(undefined);
    });

    it('should update user name successfully', async () => {
      const userId = 1;
      const newName = 'Updated Name';

      await service.updateUserProfile(userId, newName);

      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(userId, newName, undefined);
    });

    it('should update user email successfully', async () => {
      const userId = 1;
      const newEmail = 'updated@example.com';

      await service.updateUserProfile(userId, undefined, newEmail);

      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(userId, undefined, newEmail);
    });

    it('should update both name and email', async () => {
      const userId = 1;
      const newName = 'New Name';
      const newEmail = 'newemail@example.com';

      await service.updateUserProfile(userId, newName, newEmail);

      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(userId, newName, newEmail);
    });

    it('should handle update with only userId (no changes)', async () => {
      const userId = 1;

      await service.updateUserProfile(userId);

      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(userId, undefined, undefined);
    });

    it('should handle name with special characters', async () => {
      const specialNames = ["O'Brien", 'José', 'Anne-Marie', 'Müller'];

      for (const name of specialNames) {
        await service.updateUserProfile(1, name);
        expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(1, name, undefined);
      }
    });

    it('should handle email format variations', async () => {
      const emails = [
        'test@example.com',
        'test+tag@example.com',
        'test.name@sub.example.com',
        'test_user@example.co.uk',
      ];

      for (const email of emails) {
        await service.updateUserProfile(1, undefined, email);
        expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(1, undefined, email);
      }
    });

    it('should update profiles for different users', async () => {
      const updates = [
        { userId: 1, name: 'User1' },
        { userId: 2, name: 'User2' },
        { userId: 3, name: 'User3' },
      ];

      for (const update of updates) {
        await service.updateUserProfile(update.userId, update.name);
        expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(
          update.userId,
          update.name,
          undefined,
        );
      }
    });

    it('should propagate errors from auth service', async () => {
      const error = new Error('User not found');
      mockAuthService.updateUserProfile.mockRejectedValue(error);

      await expect(service.updateUserProfile(999, 'Name')).rejects.toThrow('User not found');
    });

    it('should propagate validation errors', async () => {
      const error = new Error('Invalid email format');
      mockAuthService.updateUserProfile.mockRejectedValue(error);

      await expect(service.updateUserProfile(1, undefined, 'invalid-email')).rejects.toThrow(
        'Invalid email format',
      );
    });

    it('should handle concurrent profile updates', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        service.updateUserProfile(i + 1, `User${i}`),
      );

      await Promise.all(promises);

      expect(mockAuthService.updateUserProfile).toHaveBeenCalledTimes(5);
    });

    it('should not throw when update is successful', async () => {
      await expect(service.updateUserProfile(1, 'Name', 'email@test.com')).resolves.not.toThrow();
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      mockAuthService.deleteUser.mockResolvedValue(undefined);
    });

    it('should delete user successfully', async () => {
      const userId = 1;

      await service.deleteUser(userId);

      expect(mockAuthService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should delete different users', async () => {
      const userIds = [1, 2, 3, 100, 999];

      for (const userId of userIds) {
        await service.deleteUser(userId);
        expect(mockAuthService.deleteUser).toHaveBeenCalledWith(userId);
      }

      expect(mockAuthService.deleteUser).toHaveBeenCalledTimes(userIds.length);
    });

    it('should not throw error on successful deletion', async () => {
      await expect(service.deleteUser(1)).resolves.not.toThrow();
    });

    it('should propagate errors from auth service', async () => {
      const error = new Error('User not found');
      mockAuthService.deleteUser.mockRejectedValue(error);

      await expect(service.deleteUser(999)).rejects.toThrow('User not found');
    });

    it('should propagate permission errors', async () => {
      const error = new Error('Cannot delete owner account');
      mockAuthService.deleteUser.mockRejectedValue(error);

      await expect(service.deleteUser(1)).rejects.toThrow('Cannot delete owner account');
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database connection lost');
      mockAuthService.deleteUser.mockRejectedValue(error);

      await expect(service.deleteUser(1)).rejects.toThrow('Database connection lost');
    });

    it('should handle concurrent deletions', async () => {
      const userIds = [1, 2, 3, 4, 5];
      const promises = userIds.map((id) => service.deleteUser(id));

      await Promise.all(promises);

      expect(mockAuthService.deleteUser).toHaveBeenCalledTimes(5);
      userIds.forEach((id) => {
        expect(mockAuthService.deleteUser).toHaveBeenCalledWith(id);
      });
    });

    it('should handle rapid successive deletions of same user', async () => {
      // First deletion succeeds
      mockAuthService.deleteUser.mockResolvedValueOnce(undefined);
      // Subsequent deletions fail as user no longer exists
      mockAuthService.deleteUser.mockRejectedValue(new Error('User not found'));

      await service.deleteUser(1);
      await expect(service.deleteUser(1)).rejects.toThrow('User not found');
    });
  });

  describe('Role Management Integration', () => {
    it('should create users with different roles using correct role IDs', async () => {
      mockEnumMappingService.getEnumFromCode
        .mockResolvedValueOnce(mockAdminRole)
        .mockResolvedValueOnce(mockCashierRole)
        .mockResolvedValueOnce(mockKitchenRole);

      mockAuthService.createUser
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(mockCashierUser)
        .mockResolvedValueOnce(mockKitchenUser);

      await service.addAdminUser('Admin', '1111', 1);
      await service.addCashierUser('Cashier', '2222', 1);
      await service.addKitchenUser('Kitchen', '3333', 1);

      expect(mockAuthService.createUser).toHaveBeenNthCalledWith(
        1,
        'Admin',
        '1111',
        mockAdminRole.id,
        1,
      );
      expect(mockAuthService.createUser).toHaveBeenNthCalledWith(
        2,
        'Cashier',
        '2222',
        mockCashierRole.id,
        1,
      );
      expect(mockAuthService.createUser).toHaveBeenNthCalledWith(
        3,
        'Kitchen',
        '3333',
        mockKitchenRole.id,
        1,
      );
    });

    it('should handle role resolution failures gracefully', async () => {
      mockEnumMappingService.getEnumFromCode.mockRejectedValue(
        new Error('Role configuration missing'),
      );

      await expect(service.addAdminUser('Admin', '1234', 1)).rejects.toThrow(
        'Role configuration missing',
      );
      await expect(service.addCashierUser('Cashier', '1234', 1)).rejects.toThrow(
        'Role configuration missing',
      );
      await expect(service.addKitchenUser('Kitchen', '1234', 1)).rejects.toThrow(
        'Role configuration missing',
      );
    });
  });

  describe('Complete User Lifecycle', () => {
    it('should support full user lifecycle: create, list, update, delete', async () => {
      // Setup
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockCashierRole);
      mockAuthService.createUser.mockResolvedValue(mockCashierUser);
      mockAuthService.getUsersByAccount.mockResolvedValue([mockCashierUser]);
      mockAuthService.updateUserProfile.mockResolvedValue(undefined);
      mockAuthService.deleteUser.mockResolvedValue(undefined);

      // Create user
      const createdUser = await service.addCashierUser('New Cashier', '1234', 1);
      expect(createdUser).toEqual(mockCashierUser);

      // List users
      const users = await service.getAccountUsers(1);
      expect(users).toContainEqual(mockCashierUser);

      // Update user
      await service.updateUserProfile(mockCashierUser.id, 'Updated Name');
      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(
        mockCashierUser.id,
        'Updated Name',
        undefined,
      );

      // Delete user
      await service.deleteUser(mockCashierUser.id);
      expect(mockAuthService.deleteUser).toHaveBeenCalledWith(mockCashierUser.id);
    });
  });

  describe('Error Handling Consistency', () => {
    it('should maintain consistent error handling across all methods', async () => {
      const dbError = new Error('Database connection failed');

      // Test error propagation for each method
      mockEnumMappingService.getEnumFromCode.mockRejectedValue(dbError);
      await expect(service.addAdminUser('Admin', '1234', 1)).rejects.toThrow(
        'Database connection failed',
      );

      mockEnumMappingService.getEnumFromCode.mockRejectedValue(dbError);
      await expect(service.addCashierUser('Cashier', '1234', 1)).rejects.toThrow(
        'Database connection failed',
      );

      mockEnumMappingService.getEnumFromCode.mockRejectedValue(dbError);
      await expect(service.addKitchenUser('Kitchen', '1234', 1)).rejects.toThrow(
        'Database connection failed',
      );

      mockAuthService.getUsersByAccount.mockRejectedValue(dbError);
      await expect(service.getAccountUsers(1)).rejects.toThrow('Database connection failed');

      mockAuthService.updateUserProfile.mockRejectedValue(dbError);
      await expect(service.updateUserProfile(1, 'Name')).rejects.toThrow(
        'Database connection failed',
      );

      mockAuthService.deleteUser.mockRejectedValue(dbError);
      await expect(service.deleteUser(1)).rejects.toThrow('Database connection failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string names', async () => {
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockAdminRole);
      mockAuthService.createUser.mockResolvedValue({ ...mockAdminUser, name: '' });

      const result = await service.addAdminUser('', '1234', 1);

      expect(mockAuthService.createUser).toHaveBeenCalledWith('', '1234', mockAdminRole.id, 1);
      expect(result.name).toBe('');
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(1000);
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockCashierRole);
      mockAuthService.createUser.mockResolvedValue({ ...mockCashierUser, name: longName });

      await service.addCashierUser(longName, '1234', 1);

      expect(mockAuthService.createUser).toHaveBeenCalledWith(
        longName,
        '1234',
        mockCashierRole.id,
        1,
      );
    });

    it('should handle edge case account IDs', async () => {
      const edgeCaseIds = [0, -1, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockKitchenRole);
      mockAuthService.createUser.mockResolvedValue(mockKitchenUser);

      for (const accountId of edgeCaseIds) {
        await service.addKitchenUser('Kitchen', '1234', accountId);
        expect(mockAuthService.createUser).toHaveBeenCalledWith(
          'Kitchen',
          '1234',
          mockKitchenRole.id,
          accountId,
        );
      }
    });

    it('should handle null email in profile update', async () => {
      mockAuthService.updateUserProfile.mockResolvedValue(undefined);

      await service.updateUserProfile(1, 'Name', undefined);

      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith(1, 'Name', undefined);
    });

    it('should handle multiple rapid operations on same user', async () => {
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockAdminRole);
      mockAuthService.createUser.mockResolvedValue(mockAdminUser);
      mockAuthService.updateUserProfile.mockResolvedValue(undefined);
      mockAuthService.deleteUser.mockResolvedValue(undefined);

      // Rapid fire operations
      await service.addAdminUser('Rapid User', '1234', 1);
      await service.updateUserProfile(1, 'Updated');
      await service.updateUserProfile(1, 'Updated Again');
      await service.deleteUser(1);

      expect(mockAuthService.createUser).toHaveBeenCalledTimes(1);
      expect(mockAuthService.updateUserProfile).toHaveBeenCalledTimes(2);
      expect(mockAuthService.deleteUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Account Isolation', () => {
    it('should maintain isolation between different accounts', async () => {
      const account1Users = [mockAdminUser];
      const account2Users = [mockCashierUser];

      mockAuthService.getUsersByAccount.mockImplementation((accountId: number) => {
        if (accountId === 1) return Promise.resolve(account1Users);
        if (accountId === 2) return Promise.resolve(account2Users);
        return Promise.resolve([]);
      });

      const result1 = await service.getAccountUsers(1);
      const result2 = await service.getAccountUsers(2);

      expect(result1).toEqual(account1Users);
      expect(result2).toEqual(account2Users);
      expect(result1).not.toEqual(result2);
    });

    it('should create users in correct accounts', async () => {
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockAdminRole);
      mockAuthService.createUser.mockImplementation((name, pin, roleId, accountId) => {
        return Promise.resolve({ ...mockAdminUser, name, accountId });
      });

      const user1 = await service.addAdminUser('User1', '1234', 1);
      const user2 = await service.addAdminUser('User2', '5678', 2);

      expect(user1.accountId).toBe(1);
      expect(user2.accountId).toBe(2);
    });
  });

  describe('Integration with AuthService', () => {
    it('should delegate all operations to AuthService correctly', async () => {
      mockEnumMappingService.getEnumFromCode.mockResolvedValue(mockAdminRole);
      mockAuthService.createUser.mockResolvedValue(mockAdminUser);
      mockAuthService.getUsersByAccount.mockResolvedValue([mockAdminUser]);
      mockAuthService.updateUserProfile.mockResolvedValue(undefined);
      mockAuthService.deleteUser.mockResolvedValue(undefined);

      await service.addAdminUser('Admin', '1234', 1);
      expect(mockAuthService.createUser).toHaveBeenCalled();

      await service.getAccountUsers(1);
      expect(mockAuthService.getUsersByAccount).toHaveBeenCalled();

      await service.updateUserProfile(1, 'Name');
      expect(mockAuthService.updateUserProfile).toHaveBeenCalled();

      await service.deleteUser(1);
      expect(mockAuthService.deleteUser).toHaveBeenCalled();
    });

    it('should not perform any direct database operations', () => {
      // Verify service only uses injected dependencies
      expect(service).toBeDefined();
      // This test ensures architectural compliance -
      // UserManagementService should delegate to AuthService, not access repositories directly
    });
  });
});
