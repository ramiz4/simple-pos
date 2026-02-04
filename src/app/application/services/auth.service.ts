import { Injectable } from '@angular/core';
import * as bcrypt from 'bcryptjs';
import { Account } from '../../domain/entities/account.interface';
import { User } from '../../domain/entities/user.interface';
import { UserRoleEnum } from '../../domain/enums';
import { IndexedDBUserRepository } from '../../infrastructure/repositories/indexeddb-user.repository';
import { SQLiteUserRepository } from '../../infrastructure/repositories/sqlite-user.repository';
import { InputSanitizerService } from '../../shared/utilities/input-sanitizer.service';
import { PlatformService } from '../../shared/utilities/platform.service';
import { ValidationUtils } from '../../shared/utilities/validation.utils';
import { AccountService } from './account.service';
import { EnumMappingService } from './enum-mapping.service';

export interface UserSession {
  user: User;
  roleCode: string;
  accountId: number;
  accountName?: string;
  isStaffActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentSession: UserSession | null = null;
  private readonly SALT_ROUNDS = 10;
  private readonly DEFAULT_PIN = '0000';

  constructor(
    private platformService: PlatformService,
    private sqliteUserRepo: SQLiteUserRepository,
    private indexedDBUserRepo: IndexedDBUserRepository,
    private enumMappingService: EnumMappingService,
    private accountService: AccountService,
    private inputSanitizer: InputSanitizerService,
  ) {
    this.loadSessionFromStorage();
  }

  async login(username: string, pin: string, accountId?: number): Promise<UserSession> {
    // Sanitize inputs
    const sanitizedUsername = this.inputSanitizer.sanitizeUsername(username);
    const sanitizedPin = this.inputSanitizer.sanitizePin(pin);

    if (!sanitizedUsername || !sanitizedPin) {
      throw new Error('Invalid username or PIN');
    }

    const userRepo = this.getUserRepo();
    let user: User | null;

    if (accountId) {
      user = await userRepo.findByNameAndAccount(sanitizedUsername, accountId);
    } else {
      user = await userRepo.findByName(sanitizedUsername);
    }

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
    const account = await this.accountService.getAccountById(user.accountId);

    if (!account) {
      throw new Error('Account not found. Please contact support.');
    }

    const session: UserSession = {
      user,
      roleCode: roleInfo.code,
      accountId: user.accountId,
      accountName: account.name,
      isStaffActive: true,
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

  isStaffActive(): boolean {
    return this.currentSession?.isStaffActive === true;
  }

  setStaffActive(active: boolean): void {
    if (this.currentSession) {
      this.currentSession.isStaffActive = active;
      this.saveSessionToStorage(this.currentSession);
    }
  }

  hasRole(role: UserRoleEnum): boolean {
    return this.currentSession?.roleCode === role;
  }

  hasAnyRole(roles: UserRoleEnum[]): boolean {
    if (!this.currentSession) return false;
    return roles.some((role) => this.currentSession!.roleCode === role);
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async hashPin(pin: string): Promise<string> {
    return await bcrypt.hash(pin, this.SALT_ROUNDS);
  }

  async loginWithEmail(email: string, password: string): Promise<UserSession> {
    const sanitizedEmail = this.inputSanitizer.sanitizeEmail(email);

    if (!sanitizedEmail || !password) {
      throw new Error('Invalid email or password');
    }

    const userRepo = this.getUserRepo();
    const user = await userRepo.findByEmail(sanitizedEmail);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.active) {
      throw new Error('User account is inactive');
    }

    if (!user.passwordHash) {
      throw new Error('Password login not enabled for this user');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const roleInfo = await this.enumMappingService.getEnumFromId(user.roleId);
    const account = await this.accountService.getAccountById(user.accountId);

    if (!account) {
      throw new Error('Account not found');
    }

    const session: UserSession = {
      user,
      roleCode: roleInfo.code,
      accountId: user.accountId,
      accountName: account.name,
      isStaffActive: false,
    };

    this.currentSession = session;
    this.saveSessionToStorage(session);

    return session;
  }

  async register(
    accountEmail: string,
    ownerUsername?: string,
    ownerPin?: string,
    ownerPassword?: string,
  ): Promise<{ user: User; account: Account }> {
    // Sanitize inputs
    const sanitizedEmail = this.inputSanitizer.sanitizeEmail(accountEmail);

    // Derive account name from email with special handling for local setup emails
    const [emailLocalPart, emailDomain] = sanitizedEmail.split('@');
    let baseAccountNamePart = emailLocalPart;

    if (emailDomain === 'local.pos') {
      // For local setup emails like owner_1234567890@local.pos, derive a friendlier name
      const ownerPattern = /^owner(_\d+)?$/i;
      if (ownerPattern.test(emailLocalPart)) {
        baseAccountNamePart = 'Owner';
      } else {
        const cleanedLocalPart = emailLocalPart.replace(/_/g, ' ').replace(/\d+$/u, '').trim();
        baseAccountNamePart = cleanedLocalPart || 'Account';
      }
    }

    const accountName =
      emailDomain === 'local.pos'
        ? `${baseAccountNamePart} Account`
        : `${emailLocalPart}'s Account`;
    const sanitizedAccountName = this.inputSanitizer.sanitizeName(accountName);

    // Derive username from email if not provided (e.g. john@example.com -> john)
    const derivedUsername = ownerUsername ? ownerUsername : sanitizedEmail.split('@')[0];
    const sanitizedUsername = this.inputSanitizer.sanitizeUsername(derivedUsername);
    // Default PIN to DEFAULT_PIN if not provided (Web registration flow)
    const sanitizedPin = ownerPin ? this.inputSanitizer.sanitizePin(ownerPin) : this.DEFAULT_PIN;

    // Validate inputs
    if (!ValidationUtils.isValidName(sanitizedAccountName)) {
      throw new Error('Account name must be between 2 and 100 characters');
    }

    if (!ValidationUtils.isValidEmail(sanitizedEmail)) {
      throw new Error('Invalid email address');
    }

    // Validate username (whether provided explicitly or derived from email)
    if (!ValidationUtils.isValidUsername(sanitizedUsername)) {
      throw new Error('Invalid username');
    }

    // Only validate PIN if it was provided by user. 0000 is a valid 4 digit pin technically but might fail strict "strength" checks if applied.
    // But here we just check format.
    if (ownerPin) {
      const pinValidation = ValidationUtils.validatePin(sanitizedPin);
      if (!pinValidation.valid) {
        throw new Error(pinValidation.errors[0]);
      }
    }

    // Create account first (accountService handles duplicate email check)
    const account = await this.accountService.createAccount(sanitizedAccountName, sanitizedEmail);

    // Get ADMIN role ID
    const adminRole = await this.enumMappingService.getEnumFromCode(UserRoleEnum.ADMIN);

    // Create owner user
    const userRepo = this.getUserRepo();
    const pinHash = await this.hashPin(sanitizedPin);
    const passwordHash = ownerPassword ? await this.hashPassword(ownerPassword) : undefined;

    // Check for username collision and resolve by appending suffix
    let finalUsername = sanitizedUsername;
    let suffix = 1;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Try to find existing user with same username in the new account
        // Since account doesn't exist yet, we just try to create and catch unique constraint error
        const user = await userRepo.create({
          name: finalUsername,
          email: sanitizedEmail,
          roleId: adminRole.id,
          pinHash,
          passwordHash,
          active: true,
          accountId: account.id,
          isOwner: true,
        });

        return { user, account };
      } catch (error: any) {
        // Check if it's a uniqueness constraint error
        if (
          error.message &&
          (error.message.includes('UNIQUE constraint') || error.message.includes('unique'))
        ) {
          // Append suffix and try again
          finalUsername = `${sanitizedUsername}${suffix}`;
          suffix++;
        } else {
          // Re-throw if it's a different error
          throw error;
        }
      }
    }

    // If we exhausted all attempts, throw an error
    throw new Error('Unable to create user. Please try a different username.');
  }

  async createUser(
    name: string,
    pin: string,
    roleId: number,
    accountId: number,
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
      accountId,
      isOwner: false,
    });
  }

  async getUsersByAccount(accountId: number): Promise<User[]> {
    const userRepo = this.getUserRepo();
    return await userRepo.findByAccountId(accountId);
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

  async isSetupComplete(): Promise<boolean> {
    const count = await this.getUserRepo().count();
    return count > 0;
  }

  async verifyOwnerPassword(password: string): Promise<boolean> {
    if (!this.currentSession) return false;

    const userRepo = this.getUserRepo();
    // Verify against any owner in the current account
    const users = await userRepo.findByAccountId(this.currentSession.accountId);
    const owners = users.filter((u: User) => u.isOwner);

    if (!owners.length) {
      return false; // No owners found for this account
    }

    for (const owner of owners) {
      if (!owner.passwordHash) {
        continue; // Skip owners without a password set
      }

      const isMatch = await bcrypt.compare(password, owner.passwordHash);
      if (isMatch) {
        return true;
      }
    }

    return false;
  }

  async checkHasDefaultPin(user: User): Promise<boolean> {
    // Check if the user's PIN hash matches the hash for the default PIN
    return await bcrypt.compare(this.DEFAULT_PIN, user.pinHash);
  }

  async updateUserPin(userId: number, newPin: string): Promise<void> {
    const userRepo = this.getUserRepo();
    const pinHash = await this.hashPin(newPin);

    // Use targeted update to only modify the pinHash field
    await userRepo.update(userId, { pinHash } as Partial<User>);
  }

  async verifyAdminPin(pin: string): Promise<boolean> {
    if (!this.currentSession) return false;

    const userRepo = this.getUserRepo();
    const adminRole = await this.enumMappingService.getEnumFromCode(UserRoleEnum.ADMIN);

    const users = await userRepo.findByAccountId(this.currentSession.accountId);
    const admins = users.filter((u: User) => u.roleId === adminRole.id);

    for (const admin of admins) {
      if (await bcrypt.compare(pin, admin.pinHash)) {
        return true;
      }
    }

    return false;
  }

  async deleteUser(userId: number): Promise<void> {
    const userRepo = this.getUserRepo();
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const session = this.getCurrentSession();
    if (!session || !session.user.isOwner) {
      throw new Error('Only the account owner can delete users');
    }

    // Verify user belongs to same account
    if (user.accountId !== session.accountId) {
      throw new Error('User does not belong to your account');
    }

    if (user.isOwner) {
      throw new Error('Account owner cannot be deleted');
    }

    if (session.user.id === userId) {
      throw new Error('You cannot delete your own profile');
    }

    await userRepo.delete(userId);
  }
}
