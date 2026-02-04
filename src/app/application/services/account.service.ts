import { Injectable } from '@angular/core';
import { Account } from '../../domain/entities/account.interface';
import { IndexedDBAccountRepository } from '../../infrastructure/repositories/indexeddb-account.repository';
import { SQLiteAccountRepository } from '../../infrastructure/repositories/sqlite-account.repository';
import { PlatformService } from '../../shared/utilities/platform.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(
    private platformService: PlatformService,
    private sqliteOrgRepo: SQLiteAccountRepository,
    private indexedDBOrgRepo: IndexedDBAccountRepository,
  ) {}

  async createAccount(name: string, email: string): Promise<Account> {
    const orgRepo = this.getAccountRepo();

    // Check if account with email already exists
    const existing = await orgRepo.findByEmail(email);
    if (existing) {
      throw new Error(
        'An account is already registered with this email address. Please use a different email or contact support if you believe this is an error.',
      );
    }

    return await orgRepo.create({
      name,
      email,
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  async getAccountById(id: number): Promise<Account | null> {
    const orgRepo = this.getAccountRepo();
    return await orgRepo.findById(id);
  }

  async getAccountByEmail(email: string): Promise<Account | null> {
    const orgRepo = this.getAccountRepo();
    return await orgRepo.findByEmail(email);
  }

  async getAllAccounts(): Promise<Account[]> {
    const orgRepo = this.getAccountRepo();
    return await orgRepo.findAll();
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account> {
    const orgRepo = this.getAccountRepo();
    return await orgRepo.update(id, updates);
  }

  async deleteAccount(id: number): Promise<void> {
    const orgRepo = this.getAccountRepo();
    await orgRepo.delete(id);
  }

  private getAccountRepo() {
    return this.platformService.isTauri() ? this.sqliteOrgRepo : this.indexedDBOrgRepo;
  }
}
