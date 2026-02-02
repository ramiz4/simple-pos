import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  organizationName = signal('');
  organizationEmail = signal('');
  ownerName = signal('');
  ownerPin = signal('');
  confirmPin = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onRegister() {
    this.errorMessage.set('');

    // Validation
    if (
      !this.organizationName() ||
      !this.organizationEmail() ||
      !this.ownerName() ||
      !this.ownerPin()
    ) {
      this.errorMessage.set('All fields are required');
      return;
    }

    if (this.ownerPin() !== this.confirmPin()) {
      this.errorMessage.set('PINs do not match');
      return;
    }

    if (this.ownerPin().length < 4) {
      this.errorMessage.set('PIN must be at least 4 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.organizationEmail())) {
      this.errorMessage.set('Invalid email format');
      return;
    }

    this.isLoading.set(true);

    try {
      const result = await this.authService.register(
        this.organizationName(),
        this.organizationEmail(),
        this.ownerName(),
        this.ownerPin()
      );

      // Auto-login after registration
      await this.authService.login(this.ownerName(), this.ownerPin());

      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error?.message || 'Registration failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
