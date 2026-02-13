import { Account } from '@simple-pos/shared/types';
import { BaseRepository } from './base-repository.interface';

export interface AccountRepository extends BaseRepository<Account> {
  findByEmail(email: string): Promise<Account | null>;
}
