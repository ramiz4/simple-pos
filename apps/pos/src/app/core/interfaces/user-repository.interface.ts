import { BaseRepository, User } from '@simple-pos/shared/types';

export interface UserRepository extends BaseRepository<User> {
  findByName(name: string): Promise<User | null>;
  findByNameAndAccount(name: string, accountId: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByAccountId(accountId: number): Promise<User[]>;
}
