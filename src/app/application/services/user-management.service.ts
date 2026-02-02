import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../../domain/entities/user.interface';
import { UserRoleEnum } from '../../domain/enums';
import { EnumMappingService } from './enum-mapping.service';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  constructor(
    private authService: AuthService,
    private enumMappingService: EnumMappingService
  ) {}

  async addCashierUser(
    name: string,
    pin: string,
    organizationId: number,
    email?: string
  ): Promise<User> {
    const cashierRole = await this.enumMappingService.getEnumFromCode(UserRoleEnum.CASHIER);
    return await this.authService.createUser(name, pin, cashierRole.id, organizationId, email);
  }

  async addKitchenUser(
    name: string,
    pin: string,
    organizationId: number,
    email?: string
  ): Promise<User> {
    const kitchenRole = await this.enumMappingService.getEnumFromCode(UserRoleEnum.KITCHEN);
    return await this.authService.createUser(name, pin, kitchenRole.id, organizationId, email);
  }

  async getOrganizationUsers(organizationId: number): Promise<User[]> {
    return await this.authService.getUsersByOrganization(organizationId);
  }
}
