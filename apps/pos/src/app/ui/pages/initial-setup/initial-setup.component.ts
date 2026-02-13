import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { InputSanitizerService } from '@simple-pos/shared/utils';
import { AuthService } from '../../../application/services/auth.service';

import { ButtonComponent } from '../../components/shared/button/button.component';

@Component({
  selector: 'app-initial-setup',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './initial-setup.component.html',
  styles: [],
})
export class InitialSetupComponent {
  // Constants for local setup
  private readonly LOCAL_EMAIL_DOMAIN = 'local.pos';
  private readonly LOCAL_EMAIL_PREFIX = 'owner';

  // Form Inputs
  username = signal('');
  pin = signal('');
  confirmPin = signal('');

  // UI State
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private inputSanitizer: InputSanitizerService,
  ) {}

  onUsernameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    // Basic sanitization or just update signal
    this.username.set(input.value);
    this.errorMessage.set('');
  }

  onPinInput(event: Event) {
    const input = event.target as HTMLInputElement;
    // Only allow numbers
    const value = input.value.replace(/[^0-9]/g, '');
    this.pin.set(value);

    // Force update input value if non-numeric chars were stripped
    if (value !== input.value) {
      input.value = value;
    }
    this.errorMessage.set('');
  }

  onConfirmPinInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    this.confirmPin.set(value);

    if (value !== input.value) {
      input.value = value;
    }
    this.errorMessage.set('');
  }

  async onSubmit() {
    this.errorMessage.set('');

    if (!this.username() || !this.pin() || !this.confirmPin()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    if (this.pin() !== this.confirmPin()) {
      this.errorMessage.set('PINs do not match');
      return;
    }

    if (this.pin().length < 4) {
      this.errorMessage.set('PIN must be at least 4 digits');
      return;
    }

    this.isLoading.set(true);

    try {
      // Create defaults for local setup
      // Generate a unique placeholder email for local POS usage
      // Timestamp ensures uniqueness if data wasn't fully cleared or if retrying
      const timestamp = new Date().getTime();
      const accountEmail = `${this.LOCAL_EMAIL_PREFIX}_${timestamp}@${this.LOCAL_EMAIL_DOMAIN}`;

      // 1. Register the account and user
      await this.authService.register(accountEmail, this.username(), this.pin());

      // 2. Automatically login after registration
      await this.authService.login(this.username(), this.pin());

      // 3. Redirect to staff-select page
      this.router.navigate(['/staff-select']);
    } catch (error: unknown) {
      // Display specific error message from the service
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Setup failed. Please try again.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
