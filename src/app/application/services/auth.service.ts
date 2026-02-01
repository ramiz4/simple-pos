import { Injectable } from '@angular/core';
import * as bcrypt from 'bcryptjs';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteUserRepository } from '../../infrastructure/repositories/sqlite-user.repository';
import { IndexedDBUserRepository } from '../../infrastructure/repositories/indexeddb-user.repository';
import { User } from '../../domain/entities/user.interface';
import { EnumMappingService } from './enum-mapping.service';
import { UserRoleEnum } from '../../domain/enums';

export interface UserSession {
  user: User;
  roleCode: string;
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
    private enumMappingService: EnumMappingService
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
    const session: UserSession = {
      user,
      roleCode: roleInfo.code
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

  async createUser(name: string, pin: string, roleId: number): Promise<User> {
    const userRepo = this.getUserRepo();
    const pinHash = await this.hashPin(pin);

    return await userRepo.create({
      name,
      roleId,
      pinHash,
      active: true
    });
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
