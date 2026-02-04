import { Injectable } from '@angular/core';
import { User } from '../../domain/entities/user.interface';
import { UserRoleEnum } from '../../domain/enums';
import { AuthService } from './auth.service';
import { EnumMappingService } from './enum-mapping.service';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  constructor(
    private authService: AuthService,
    private enumMappingService: EnumMappingService,
  ) {}

  async addAdminUser(name: string, pin: string, accountId: number): Promise<User> {
    const adminRole = await this.enumMappingService.getEnumFromCode(UserRoleEnum.ADMIN);
    return await this.authService.createUser(name, pin, adminRole.id, accountId);
  }

  async addCashierUser(name: string, pin: string, accountId: number): Promise<User> {
    const cashierRole = await this.enumMappingService.getEnumFromCode(UserRoleEnum.CASHIER);
    return await this.authService.createUser(name, pin, cashierRole.id, accountId);
  }

  async addKitchenUser(name: string, pin: string, accountId: number): Promise<User> {
    const kitchenRole = await this.enumMappingService.getEnumFromCode(UserRoleEnum.KITCHEN);
    return await this.authService.createUser(name, pin, kitchenRole.id, accountId);
  }

  async getAccountUsers(accountId: number): Promise<User[]> {
    return await this.authService.getUsersByAccount(accountId);
  }

  async updateUserProfile(userId: number, name?: string, email?: string): Promise<void> {
    await this.authService.updateUserProfile(userId, name, email);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.authService.deleteUser(userId);
  }
}
