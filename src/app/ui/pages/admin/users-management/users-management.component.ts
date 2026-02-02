import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserManagementService } from '../../../../application/services/user-management.service';
import { AuthService } from '../../../../application/services/auth.service';
import { User } from '../../../../domain/entities/user.interface';
import { UserRoleEnum } from '../../../../domain/enums';

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
  
  newUserName = signal('');
  newUserEmail = signal('');
  newUserPin = signal('');
  newUserRole = signal<'CASHIER' | 'KITCHEN'>('CASHIER');
  
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  organizationId: number = 0;

  constructor(
    private userManagementService: UserManagementService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    const session = this.authService.getCurrentSession();
    if (!session) {
      this.router.navigate(['/login']);
      return;
    }

    this.organizationId = session.organizationId;
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      const allUsers = await this.userManagementService.getOrganizationUsers(
        this.organizationId
      );
      this.users.set(allUsers);
    } catch (error: any) {
      this.errorMessage.set('Failed to load users');
    }
  }

  openAddUserModal() {
    this.showAddUserModal.set(true);
    this.newUserName.set('');
    this.newUserEmail.set('');
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
      this.errorMessage.set('Name and PIN are required');
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
          this.organizationId,
          this.newUserEmail() || undefined
        );
      } else {
        await this.userManagementService.addKitchenUser(
          this.newUserName(),
          this.newUserPin(),
          this.organizationId,
          this.newUserEmail() || undefined
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

  getRoleDisplay(roleId: number): string {
    // This is a simplified version - in production you'd use EnumMappingService
    const roleMap: { [key: number]: string } = {
      1: 'Admin',
      2: 'Cashier',
      3: 'Kitchen',
      4: 'Driver',
    };
    return roleMap[roleId] || 'Unknown';
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
