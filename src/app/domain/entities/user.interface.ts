export interface User {
  id: number;
  name: string;
  email?: string;
  roleId: number;
  pinHash: string;
  passwordHash?: string;
  active: boolean;
  accountId: number;
  isOwner: boolean;
}
