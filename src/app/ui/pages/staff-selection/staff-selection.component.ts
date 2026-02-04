import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { User } from '../../../domain/entities/user.interface';
import { UserRoleEnum } from '../../../domain/enums';

@Component({
  selector: 'app-staff-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-selection.component.html',
})
export class StaffSelectionComponent implements OnInit {
  users = signal<User[]>([]);
  selectedUser = signal<User | null>(null);

  showPinModal = signal(false);
  pinInput = signal('');

  showSetPinModal = signal(false);
  newPin = signal('');
  confirmNewPin = signal('');

  showPasswordModal = signal(false);
  passwordInput = signal('');

  errorMessage = signal('');
  isLoading = signal(false);
  currentUserName = signal('');

  rolesMap = new Map<number, string>();

  constructor(
    public authService: AuthService,
    private enumMappingService: EnumMappingService,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.loadRoles();
    await this.loadUsers();
  }

  async loadRoles() {
    const roles = [
      UserRoleEnum.ADMIN,
      UserRoleEnum.CASHIER,
      UserRoleEnum.KITCHEN,
      UserRoleEnum.DRIVER,
    ];

    for (const code of roles) {
      try {
        const role = await this.enumMappingService.getEnumFromCode(code);
        this.rolesMap.set(role.id, code);
      } catch (e) {
        // Ignore if role not found
      }
    }
  }

  async loadUsers() {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.currentUserName.set(session.user.name);
      const users = await this.authService.getUsersByAccount(session.accountId);
      this.users.set(users);

      // Check if current user has default PIN and force setup
      const currentUser = users.find((u: User) => u.id === session.user.id);
      if (currentUser) {
        const isDefault = await this.authService.checkHasDefaultPin(currentUser);
        if (isDefault) {
          this.showSetPinModal.set(true);
        }
      }
    }
  }

  getRoleName(roleId: number): string {
    return this.rolesMap.get(roleId) || 'Unknown';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onSelectUser(user: User) {
    this.selectedUser.set(user);
    this.errorMessage.set('');
    this.pinInput.set('');
    this.showPinModal.set(true);
  }

  openAddUserModal() {
    this.errorMessage.set('');
    this.passwordInput.set('');
    this.showPasswordModal.set(true);
  }

  closeModals() {
    this.showPinModal.set(false);
    this.showPasswordModal.set(false);
    this.showSetPinModal.set(false);
    this.selectedUser.set(null);
    this.pinInput.set('');
    this.passwordInput.set('');
    this.newPin.set('');
    this.confirmNewPin.set('');
  }

  async verifyPin() {
    if (!this.selectedUser() || !this.pinInput()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const session = this.authService.getCurrentSession();
      const newSession = await this.authService.login(
        this.selectedUser()!.name,
        this.pinInput(),
        session?.accountId,
      );
      this.navigateBasedOnRole(newSession.roleCode);
    } catch (e: any) {
      this.errorMessage.set('Invalid PIN');
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyAdminPin() {
    if (!this.pinInput()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const isValid = await this.authService.verifyAdminPin(this.pinInput());
      if (isValid) {
        this.authService.setStaffActive(true);
        this.closeModals();
        this.router.navigate(['/admin/users']);
      } else {
        this.errorMessage.set('Invalid PIN');
      }
    } catch (e: any) {
      this.errorMessage.set('Verification Failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveNewPin() {
    if (!this.newPin() || !this.confirmNewPin()) return;
    if (this.newPin() !== this.confirmNewPin()) {
      this.errorMessage.set('PINs do not match');
      return;
    }
    if (this.newPin().length < 4) {
      this.errorMessage.set('PIN must be at least 4 digits');
      return;
    }

    this.isLoading.set(true);
    const session = this.authService.getCurrentSession();
    if (!session) return;

    try {
      await this.authService.updateUserPin(session.user.id, this.newPin());
      this.authService.setStaffActive(true); // Mark session as active after initialization
      this.showSetPinModal.set(false);

      // Since they just initialized their PIN, we consider them active.
      // They are still on the selection screen. They can now click their tile.
      await this.loadUsers();
    } catch (e: any) {
      this.errorMessage.set('Failed to update PIN');
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateBasedOnRole(role: string) {
    switch (role) {
      case UserRoleEnum.ADMIN:
        this.router.navigate(['/admin']);
        break;
      case UserRoleEnum.CASHIER:
        this.router.navigate(['/pos/order-type']);
        break;
      case UserRoleEnum.KITCHEN:
        this.router.navigate(['/kitchen']);
        break;
      default:
        this.router.navigate(['/unauthorized']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
