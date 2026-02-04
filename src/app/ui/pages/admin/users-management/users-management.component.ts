import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../application/services/auth.service';
import { EnumMappingService } from '../../../../application/services/enum-mapping.service';
import { UserManagementService } from '../../../../application/services/user-management.service';
import { User } from '../../../../domain/entities/user.interface';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.css',
})
export class UsersManagementComponent implements OnInit {
  users = signal<User[]>([]);
  showAddUserModal = signal(false);
  showEditUserModal = signal(false);
  editingUser = signal<User | null>(null);

  newUserName = signal('');
  newUserPin = signal('');
  newUserRole = signal<'CASHIER' | 'KITCHEN' | 'ADMIN'>('CASHIER');

  // Re-use logic for edit
  editUserName = signal('');
  editUserEmail = signal('');
  editUserPin = signal(''); // Optional for edit

  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);
  currentUserIsOwner = signal(false);

  accountId: number = 0;
  roleMap = signal<Map<number, string>>(new Map());

  constructor(
    private userManagementService: UserManagementService,
    private authService: AuthService,
    private enumMappingService: EnumMappingService,
    private router: Router,
  ) {}

  async ngOnInit() {
    const session = this.authService.getCurrentSession();
    if (!session) {
      this.router.navigate(['/login']);
      return;
    }

    this.accountId = session.accountId;
    this.currentUserIsOwner.set(session.user.isOwner);
    await this.loadRoleMap();
    await this.loadUsers();
  }

  async loadRoleMap() {
    try {
      const roles = await this.enumMappingService.getCodeTableByType('USER_ROLE');
      const map = new Map<number, string>();
      roles.forEach((role) => {
        map.set(role.id, role.code);
      });
      this.roleMap.set(map);
    } catch (error) {
      console.error('Failed to load role mappings', error);
    }
  }

  async loadUsers() {
    try {
      const allUsers = await this.userManagementService.getAccountUsers(this.accountId);
      this.users.set(allUsers);
    } catch (error: any) {
      this.errorMessage.set('Failed to load users');
    }
  }

  openAddUserModal() {
    this.showAddUserModal.set(true);
    this.newUserName.set('');
    this.newUserPin.set('');
    this.newUserRole.set('CASHIER');
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeAddUserModal() {
    this.showAddUserModal.set(false);
  }

  async onAddUser() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.newUserName() || !this.newUserPin()) {
      this.errorMessage.set('Username and PIN are required');
      return;
    }

    if (this.newUserPin().length < 4) {
      this.errorMessage.set('PIN must be at least 4 characters');
      return;
    }

    this.isLoading.set(true);

    try {
      const role = this.newUserRole();

      if (role === 'CASHIER') {
        await this.userManagementService.addCashierUser(
          this.newUserName(),
          this.newUserPin(),
          this.accountId,
        );
      } else if (role === 'KITCHEN') {
        await this.userManagementService.addKitchenUser(
          this.newUserName(),
          this.newUserPin(),
          this.accountId,
        );
      } else if (role === 'ADMIN') {
        await this.userManagementService.addAdminUser(
          this.newUserName(),
          this.newUserPin(),
          this.accountId,
        );
      }

      this.successMessage.set(`${role} user added successfully!`);
      await this.loadUsers();

      // Close modal after delay
      setTimeout(() => {
        this.closeAddUserModal();
      }, 1500);
    } catch (error: any) {
      this.errorMessage.set(error?.message || 'Failed to add user');
    } finally {
      this.isLoading.set(false);
    }
  }

  openEditUserModal(user: User) {
    this.editingUser.set(user);
    this.editUserName.set(user.name);
    this.editUserEmail.set(user.email || '');
    this.editUserPin.set(''); // Blank means no change
    this.showEditUserModal.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeEditUserModal() {
    this.showEditUserModal.set(false);
    this.editingUser.set(null);
  }

  async onUpdateUser() {
    this.errorMessage.set('');
    this.successMessage.set('');
    const user = this.editingUser();

    if (!user) return;
    if (!this.editUserName()) {
      this.errorMessage.set('Name is required');
      return;
    }

    this.isLoading.set(true);

    try {
      if (this.editUserPin()) {
        if (this.editUserPin().length < 4) {
          throw new Error('PIN must be at least 4 digits');
        }
        await this.authService.updateUserPin(user.id, this.editUserPin());
      }

      // TODO: Implement name/email update via UserManagementService
      // Currently only PIN updates are supported. Future enhancement needed for full user profile editing.

      this.successMessage.set('User updated successfully');
      await this.loadUsers();
      setTimeout(() => this.closeEditUserModal(), 1000);
    } catch (e: any) {
      this.errorMessage.set(e.message || 'Update failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDeleteUser(user: User) {
    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.userManagementService.deleteUser(user.id);
      this.successMessage.set('User deleted successfully');
      await this.loadUsers();
    } catch (e: any) {
      this.errorMessage.set(e.message || 'Deletion failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  getRoleDisplay(roleId: number): string {
    return this.roleMap().get(roleId) || 'Unknown';
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
