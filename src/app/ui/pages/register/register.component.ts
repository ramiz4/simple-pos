import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { InputSanitizerService } from '../../../shared/utilities/input-sanitizer.service';
import { RateLimiterService } from '../../../shared/utilities/rate-limiter.service';
import { ValidationUtils } from '../../../shared/utilities/validation.utils';

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
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // Computed signals for validation
  pinStrength = computed(() => ValidationUtils.calculatePinStrength(this.ownerPin()));
  pinStrengthLabel = computed(() => ValidationUtils.getPinStrengthLabel(this.pinStrength()));
  pinStrengthColor = computed(() => ValidationUtils.getPinStrengthColor(this.pinStrength()));
  pinStrengthTextColor = computed(() => {
    const strength = this.pinStrength();
    if (strength < 30) return 'text-red-500';
    if (strength < 60) return 'text-yellow-500';
    if (strength < 80) return 'text-blue-500';
    return 'text-green-500';
  });

  // Validation states
  orgNameValid = computed(() => ValidationUtils.isValidName(this.organizationName()));
  emailValid = computed(() => ValidationUtils.isValidEmail(this.organizationEmail()));
  ownerNameValid = computed(() => ValidationUtils.isValidUsername(this.ownerName()));
  pinValid = computed(() => ValidationUtils.validatePin(this.ownerPin()).valid);
  pinsMatch = computed(() => this.ownerPin() === this.confirmPin() && this.confirmPin().length > 0);

  constructor(
    private authService: AuthService,
    private router: Router,
    private inputSanitizer: InputSanitizerService,
    private rateLimiter: RateLimiterService,
  ) {}

  async onRegister() {
    this.errorMessage.set('');

    // Basic empty field check only
    if (
      !this.organizationName() ||
      !this.organizationEmail() ||
      !this.ownerName() ||
      !this.ownerPin() ||
      !this.confirmPin()
    ) {
      this.errorMessage.set('All fields are required');
      return;
    }

    // PIN match check (client-side UX only)
    if (this.ownerPin() !== this.confirmPin()) {
      this.errorMessage.set('PINs do not match');
      return;
    }

    // Sanitize email for rate limiting key
    const sanitizedEmail = this.inputSanitizer.sanitizeEmail(this.organizationEmail());

    // Check rate limiting
    const rateLimitKey = `register:${sanitizedEmail}`;
    if (!this.rateLimiter.isAllowed(rateLimitKey)) {
      const remainingTime = this.rateLimiter.getBlockedTimeRemaining(rateLimitKey);
      this.errorMessage.set(
        `Too many registration attempts. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`,
      );
      return;
    }

    this.isLoading.set(true);

    try {
      // Auth service will handle all sanitization and validation
      await this.authService.register(
        this.organizationName(),
        this.organizationEmail(),
        this.ownerName(),
        this.ownerPin(),
      );

      // Reset rate limiter on success
      this.rateLimiter.reset(rateLimitKey);

      // Auto-login after registration
      await this.authService.login(this.ownerName(), this.ownerPin());

      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.rateLimiter.recordAttempt(rateLimitKey);
      this.errorMessage.set(error?.message || 'Registration failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
