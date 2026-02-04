export interface User {
  id: number;
  name: string;
  email?: string;
  roleId: number;
  pinHash: string;
  /**
   * Optional password hash used for password-based authentication.
   *
   * - Owner users (isOwner === true) are expected to always have a passwordHash,
   *   enabling password login in addition to PIN.
   * - Staff users (isOwner === false) may omit passwordHash and use PIN-only login.
   *
   * When this field is undefined, the user does not support password-based login
   * and must authenticate using their PIN (pinHash) only.
   */
  passwordHash?: string;
  active: boolean;
  accountId: number;
  isOwner: boolean;
}
