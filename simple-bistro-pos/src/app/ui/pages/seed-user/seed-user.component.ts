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
  styleUrls: ['./seed-user.component.css']
})
export class SeedUserComponent {
  message = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private enumMappingService: EnumMappingService,
    private router: Router
  ) {}

  async createTestUsers() {
    this.isLoading.set(true);
    this.message.set('Creating test users...');

    try {
      const adminRoleId = await this.enumMappingService.getCodeTableId('USER_ROLE', UserRoleEnum.ADMIN);
      const cashierRoleId = await this.enumMappingService.getCodeTableId('USER_ROLE', UserRoleEnum.CASHIER);
      const kitchenRoleId = await this.enumMappingService.getCodeTableId('USER_ROLE', UserRoleEnum.KITCHEN);

      await this.authService.createUser('admin', '1234', adminRoleId);
      await this.authService.createUser('cashier', '1234', cashierRoleId);
      await this.authService.createUser('kitchen', '1234', kitchenRoleId);

      this.message.set('Test users created successfully! Redirecting to login...');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error: any) {
      console.error('Failed to create test users', error);
      this.message.set(`Error: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
