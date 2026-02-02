import { Injectable } from '@angular/core';
import * as bcrypt from 'bcryptjs';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteUserRepository } from '../../infrastructure/repositories/sqlite-user.repository';
import { IndexedDBUserRepository } from '../../infrastructure/repositories/indexeddb-user.repository';
import { User } from '../../domain/entities/user.interface';
import { Organization } from '../../domain/entities/organization.interface';
import { EnumMappingService } from './enum-mapping.service';
import { UserRoleEnum } from '../../domain/enums';
import { OrganizationService } from './organization.service';

export interface UserSession {
  user: User;
  roleCode: string;
  organizationId: number;
  organizationName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentSession: UserSession | null = null;
  private readonly SALT_ROUNDS = 10;

  constructor(
    private platformService: PlatformService,
    private sqliteUserRepo: SQLiteUserRepository,
    private indexedDBUserRepo: IndexedDBUserRepository,
    private enumMappingService: EnumMappingService,
    private organizationService: OrganizationService
  ) {
    this.loadSessionFromStorage();
  }

  async login(username: string, pin: string): Promise<UserSession> {
    const userRepo = this.getUserRepo();
    const user = await userRepo.findByName(username);

    if (!user) {
      throw new Error('Invalid username or PIN');
    }

    if (!user.active) {
      throw new Error('User account is inactive');
    }

    const isValid = await bcrypt.compare(pin, user.pinHash);
    if (!isValid) {
      throw new Error('Invalid username or PIN');
    }

    const roleInfo = await this.enumMappingService.getEnumFromId(user.roleId);
    const organization = await this.organizationService.getOrganizationById(user.organizationId);
    
    if (!organization) {
      throw new Error('Organization not found. Please contact support.');
    }
    
    const session: UserSession = {
      user,
      roleCode: roleInfo.code,
      organizationId: user.organizationId,
      organizationName: organization.name,
    };

    this.currentSession = session;
    this.saveSessionToStorage(session);

    return session;
  }

  logout(): void {
    this.currentSession = null;
    this.clearSessionFromStorage();
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  isLoggedIn(): boolean {
    return this.currentSession !== null;
  }

  hasRole(role: UserRoleEnum): boolean {
    return this.currentSession?.roleCode === role;
  }

  hasAnyRole(roles: UserRoleEnum[]): boolean {
    if (!this.currentSession) return false;
    return roles.some(role => this.currentSession!.roleCode === role);
  }

  async hashPin(pin: string): Promise<string> {
    return await bcrypt.hash(pin, this.SALT_ROUNDS);
  }

  async register(
    organizationName: string,
    organizationEmail: string,
    ownerName: string,
    ownerPin: string
  ): Promise<{ user: User; organization: Organization }> {
    // Validate inputs
    if (!organizationEmail || !organizationEmail.includes('@')) {
      throw new Error('Valid organization email is required.');
    }

    // Create organization first
    const organization = await this.organizationService.createOrganization(
      organizationName,
      organizationEmail
    );

    try {
      // Get ADMIN role ID
      const adminRole = await this.enumMappingService.getEnumFromCode(UserRoleEnum.ADMIN, 'USER_ROLE');

      // Create owner user
      const userRepo = this.getUserRepo();
      const pinHash = await this.hashPin(ownerPin);

      const user = await userRepo.create({
        name: ownerName,
        email: organizationEmail, // Owner must have email
        roleId: adminRole.id,
        pinHash,
        active: true,
        organizationId: organization.id,
        isOwner: true,
      });

      return { user, organization };
    } catch (error) {
      // Best-effort rollback: try to remove the created organization if user creation fails
      try {
        await this.organizationService.deleteOrganization(organization.id);
      } catch (rollbackError) {
        // Log rollback failure but throw original error
        console.error('Failed to rollback organization creation:', rollbackError);
      }
      throw error;
    }
  }

  async createUser(
    name: string,
    pin: string,
    roleId: number,
    organizationId: number,
    email?: string
  ): Promise<User> {
    const userRepo = this.getUserRepo();
    
    // Check if user with same name already exists in this organization
    const existingUsers = await userRepo.findByOrganizationId(organizationId);
    if (existingUsers.some(u => u.name === name)) {
      throw new Error(`User with name "${name}" already exists in this organization.`);
    }
    
    const pinHash = await this.hashPin(pin);

    return await userRepo.create({
      name,
      email,
      roleId,
      pinHash,
      active: true,
      organizationId,
      isOwner: false,
    });
  }

  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    const userRepo = this.getUserRepo();
    return await userRepo.findByOrganizationId(organizationId);
  }

  private saveSessionToStorage(session: UserSession): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('userSession', JSON.stringify(session));
    }
  }

  private loadSessionFromStorage(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = sessionStorage.getItem('userSession');
      if (stored) {
        try {
          this.currentSession = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse stored session', e);
          this.clearSessionFromStorage();
        }
      }
    }
  }

  private clearSessionFromStorage(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('userSession');
    }
  }

  private getUserRepo() {
    return this.platformService.isTauri() 
      ? this.sqliteUserRepo 
      : this.indexedDBUserRepo;
  }
}
