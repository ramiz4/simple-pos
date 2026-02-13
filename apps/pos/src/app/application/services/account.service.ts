import { Inject, Injectable } from '@angular/core';
import { Account } from '@simple-pos/shared/types';
import { AccountRepository } from '../../core/interfaces/account-repository.interface';
import { ACCOUNT_REPOSITORY } from '../../infrastructure/tokens/repository.tokens';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private accountRepo: AccountRepository;

  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    repo: AccountRepository,
  ) {
    this.accountRepo = repo;
  }

  async createAccount(name: string, email: string): Promise<Account> {
    // Check if account with email already exists
    const existing = await this.accountRepo.findByEmail(email);
    if (existing) {
      throw new Error(
        'An account is already registered with this email address. Please use a different email or contact support if you believe this is an error.',
      );
    }

    return await this.accountRepo.create({
      name,
      email,
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  async getAccountById(id: number): Promise<Account | null> {
    return await this.accountRepo.findById(id);
  }

  async getAccountByEmail(email: string): Promise<Account | null> {
    return await this.accountRepo.findByEmail(email);
  }

  async getAllAccounts(): Promise<Account[]> {
    return await this.accountRepo.findAll();
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account> {
    return await this.accountRepo.update(id, updates);
  }

  async deleteAccount(id: number): Promise<void> {
    await this.accountRepo.delete(id);
  }
}
