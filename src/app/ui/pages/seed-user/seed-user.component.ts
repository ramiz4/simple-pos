import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { UserRoleEnum } from '../../../domain/enums';

@Component({
  selector: 'app-seed-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seed-user.component.html',
  styleUrls: ['./seed-user.component.css'],
})
export class SeedUserComponent {
  message = signal('');
  isLoading = signal(false);
  isError = signal(false);

  constructor(
    private authService: AuthService,
    private enumMappingService: EnumMappingService,
    private router: Router,
  ) {}

  async createTestUsers() {
    this.isLoading.set(true);
    this.message.set('Creating test users...');

    try {
      this.isError.set(false);
      const adminRoleId = await this.enumMappingService.getCodeTableId(
        'USER_ROLE',
        UserRoleEnum.ADMIN,
      );
      const cashierRoleId = await this.enumMappingService.getCodeTableId(
        'USER_ROLE',
        UserRoleEnum.CASHIER,
      );
      const kitchenRoleId = await this.enumMappingService.getCodeTableId(
        'USER_ROLE',
        UserRoleEnum.KITCHEN,
      );

      const usersToCreate = [
        { name: 'admin', roleId: adminRoleId },
        { name: 'cashier', roleId: cashierRoleId },
        { name: 'kitchen', roleId: kitchenRoleId },
      ];

      for (const userData of usersToCreate) {
        try {
          await this.authService.createUser(userData.name, '1234', userData.roleId);
        } catch (err: any) {
          // If error is because user already exists, we can ignore it
          if (err.name === 'ConstraintError' || err.message?.includes('already exists')) {
            console.log(`User ${userData.name} already exists, skipping.`);
          } else {
            throw err;
          }
        }
      }

      this.message.set('Test users ready! Redirecting to login...');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error: any) {
      console.error('Failed to create test users', error);
      this.isError.set(true);
      this.message.set(`Error: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
