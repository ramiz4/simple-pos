import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { InputSanitizerService } from '../../../shared/utilities/input-sanitizer.service';
import { RateLimiterService } from '../../../shared/utilities/rate-limiter.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username = signal('');
  pin = signal('');
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

    if (!this.username() || !this.pin()) {
      this.errorMessage.set('Please enter username and PIN');
      return;
    }

    // Sanitize inputs for rate limiting and authentication
    const sanitizedUsername = this.inputSanitizer.sanitizeUsername(this.username());
    const sanitizedPin = this.inputSanitizer.sanitizePin(this.pin());

    // Check rate limiting using sanitized username
    const rateLimitKey = `login:${sanitizedUsername}`;
    if (!this.rateLimiter.isAllowed(rateLimitKey)) {
      const remainingTime = this.rateLimiter.getBlockedTimeRemaining(rateLimitKey);
      this.errorMessage.set(
        `Too many login attempts. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`,
      );
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.login(sanitizedUsername, sanitizedPin);
      // Reset rate limiter on success
      this.rateLimiter.reset(rateLimitKey);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.rateLimiter.recordAttempt(rateLimitKey);
      this.errorMessage.set(error.message || 'Login failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPinInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.pin.set(input.value);
  }

  onUsernameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.username.set(input.value);
  }
}
