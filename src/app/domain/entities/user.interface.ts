export interface User {
  id: number;
  name: string;
  email?: string;
  roleId: number;
  pinHash: string;
  active: boolean;
  organizationId: number;
  isOwner: boolean;
}
