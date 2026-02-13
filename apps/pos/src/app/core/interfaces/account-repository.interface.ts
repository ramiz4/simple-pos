import { Account, BaseRepository } from '@simple-pos/shared/types';

export interface AccountRepository extends BaseRepository<Account> {
  findByEmail(email: string): Promise<Account | null>;
}
