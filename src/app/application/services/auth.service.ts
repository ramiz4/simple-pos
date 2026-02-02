import { Injectable } from '@angular/core';
import * as bcrypt from 'bcryptjs';
import { User } from '../../domain/entities/user.interface';
import { UserRoleEnum } from '../../domain/enums';
import { IndexedDBUserRepository } from '../../infrastructure/repositories/indexeddb-user.repository';
import { SQLiteUserRepository } from '../../infrastructure/repositories/sqlite-user.repository';
import { InputSanitizerService } from '../../shared/utilities/input-sanitizer.service';
import { PlatformService } from '../../shared/utilities/platform.service';
import { ValidationUtils } from '../../shared/utilities/validation.utils';
import { EnumMappingService } from './enum-mapping.service';
import { OrganizationService } from './organization.service';

export interface UserSession {
  user: User;
  roleCode: string;
  organizationId: number;
  organizationName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentSession: UserSession | null = null;
  private readonly SALT_ROUNDS = 10;

  constructor(
    private platformService: PlatformService,
    private sqliteUserRepo: SQLiteUserRepository,
    private indexedDBUserRepo: IndexedDBUserRepository,
    private enumMappingService: EnumMappingService,
    private organizationService: OrganizationService,
    private inputSanitizer: InputSanitizerService,
  ) {
    this.loadSessionFromStorage();
  }

  async login(username: string, pin: string): Promise<UserSession> {
    // Sanitize inputs
    const sanitizedUsername = this.inputSanitizer.sanitizeUsername(username);
    const sanitizedPin = this.inputSanitizer.sanitizePin(pin);

    if (!sanitizedUsername || !sanitizedPin) {
      throw new Error('Invalid username or PIN');
    }

    const userRepo = this.getUserRepo();
    const user = await userRepo.findByName(sanitizedUsername);

    if (!user) {
      // Use generic error message to prevent username enumeration
      throw new Error('Invalid username or PIN');
    }

    if (!user.active) {
      throw new Error('User account is inactive');
    }

    const isValid = await bcrypt.compare(sanitizedPin, user.pinHash);
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
    return roles.some((role) => this.currentSession!.roleCode === role);
  }

  async hashPin(pin: string): Promise<string> {
    return await bcrypt.hash(pin, this.SALT_ROUNDS);
  }

  async register(
    organizationName: string,
    organizationEmail: string,
    ownerUsername: string,
    ownerPin: string,
  ): Promise<{ user: User; organization: any }> {
    // Sanitize inputs
    const sanitizedOrgName = this.inputSanitizer.sanitizeName(organizationName);
    const sanitizedEmail = this.inputSanitizer.sanitizeEmail(organizationEmail);
    const sanitizedUsername = this.inputSanitizer.sanitizeUsername(ownerUsername);
    const sanitizedPin = this.inputSanitizer.sanitizePin(ownerPin);

    // Validate inputs
    if (!ValidationUtils.isValidName(sanitizedOrgName)) {
      throw new Error('Organization name must be between 2 and 100 characters');
    }

    if (!ValidationUtils.isValidEmail(sanitizedEmail)) {
      throw new Error('Invalid email address');
    }

    if (!ValidationUtils.isValidUsername(sanitizedUsername)) {
      throw new Error('Username must be 3-30 characters (letters, numbers, - and _ only)');
    }

    const pinValidation = ValidationUtils.validatePin(sanitizedPin);
    if (!pinValidation.valid) {
      throw new Error(pinValidation.errors[0]);
    }

    // Create organization first (organizationService handles duplicate email check)
    const organization = await this.organizationService.createOrganization(
      sanitizedOrgName,
      sanitizedEmail,
    );

    // Get ADMIN role ID
    const adminRole = await this.enumMappingService.getEnumFromCode(UserRoleEnum.ADMIN);

    // Create owner user
    const userRepo = this.getUserRepo();
    const pinHash = await this.hashPin(sanitizedPin);

    const user = await userRepo.create({
      name: sanitizedUsername,
      email: sanitizedEmail,
      roleId: adminRole.id,
      pinHash,
      active: true,
      organizationId: organization.id,
      isOwner: true,
    });

    return { user, organization };
  }

  async createUser(
    name: string,
    pin: string,
    roleId: number,
    organizationId: number,
    email?: string,
  ): Promise<User> {
    const userRepo = this.getUserRepo();
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
    return this.platformService.isTauri() ? this.sqliteUserRepo : this.indexedDBUserRepo;
  }
}
