import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputSanitizerService } from '@simple-pos/shared/utils';
import { AuthService } from '../../../application/services/auth.service';
import { RateLimiterService } from '../../../core/services/rate-limiter.service';

import { ButtonComponent } from '../../components/shared/button/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  // Form Inputs
  email = signal('');
  password = signal('');

  // UI State
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private rateLimiter: RateLimiterService,
    private inputSanitizer: InputSanitizerService,
  ) {}

  async onLogin() {
    this.errorMessage.set('');

    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please enter email and password');
      return;
    }

    const sanitizedEmail = this.inputSanitizer.sanitizeEmail(this.email());
    const rateLimitKey = `login:email:${sanitizedEmail}`;

    if (!this.checkRateLimit(rateLimitKey)) return;

    this.isLoading.set(true);

    try {
      await this.authService.loginWithEmail(sanitizedEmail, this.password());
      this.rateLimiter.reset(rateLimitKey);
      this.router.navigate(['/staff-select']);
    } catch (error: unknown) {
      this.rateLimiter.recordAttempt(rateLimitKey);
      const message =
        error instanceof Error ? error.message || 'Login failed' : String(error || 'Login failed');
      this.errorMessage.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  checkRateLimit(key: string): boolean {
    if (!this.rateLimiter.isAllowed(key)) {
      const remainingTime = this.rateLimiter.getBlockedTimeRemaining(key);
      this.errorMessage.set(
        `Too many login attempts. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`,
      );
      return false;
    }
    return true;
  }

  onEmailInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.email.set(input.value);
  }

  onPasswordInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
