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
  ownerNameValid = computed(() => ValidationUtils.isValidName(this.ownerName()));
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

    // Sanitize inputs
    const sanitizedOrgName = this.inputSanitizer.sanitizeName(this.organizationName());
    const sanitizedEmail = this.inputSanitizer.sanitizeEmail(this.organizationEmail());
    const sanitizedOwnerName = this.inputSanitizer.sanitizeName(this.ownerName());

    // Check rate limiting
    const rateLimitKey = `register:${sanitizedEmail}`;
    if (!this.rateLimiter.isAllowed(rateLimitKey)) {
      const remainingTime = this.rateLimiter.getBlockedTimeRemaining(rateLimitKey);
      this.errorMessage.set(
        `Too many registration attempts. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`,
      );
      return;
    }

    // Validation
    if (!sanitizedOrgName || !sanitizedEmail || !sanitizedOwnerName || !this.ownerPin()) {
      this.errorMessage.set('All fields are required');
      return;
    }

    if (!ValidationUtils.isValidName(sanitizedOrgName)) {
      this.errorMessage.set('Organization name must be between 2 and 100 characters');
      return;
    }

    if (!ValidationUtils.isValidEmail(sanitizedEmail)) {
      this.errorMessage.set('Invalid email format');
      return;
    }

    if (!ValidationUtils.isValidName(sanitizedOwnerName)) {
      this.errorMessage.set('Owner name must be between 2 and 100 characters');
      return;
    }

    const pinValidation = ValidationUtils.validatePin(this.ownerPin());
    if (!pinValidation.valid) {
      this.errorMessage.set(pinValidation.errors.join('. '));
      return;
    }

    if (this.ownerPin() !== this.confirmPin()) {
      this.errorMessage.set('PINs do not match');
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.register(
        sanitizedOrgName,
        sanitizedEmail,
        sanitizedOwnerName,
        this.ownerPin(),
      );

      // Reset rate limiter on success
      this.rateLimiter.reset(rateLimitKey);

      // Auto-login after registration
      await this.authService.login(sanitizedOwnerName, this.ownerPin());

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
