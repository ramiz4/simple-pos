import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { InputSanitizerService } from '../../../shared/utilities/input-sanitizer.service';

@Component({
  selector: 'app-initial-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Welcome</h1>
          <p class="text-gray-600">Let's set up your admin account to get started.</p>
        </div>

        <div class="space-y-6">
          <!-- Username Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              [ngModel]="username()"
              (input)="onUsernameInput($event)"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Admin"
            />
          </div>

          <!-- PIN Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Create PIN</label>
            <input
              type="password"
              inputmode="numeric"
              pattern="[0-9]*"
              [ngModel]="pin()"
              (input)="onPinInput($event)"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="****"
              maxlength="8"
            />
          </div>

          <!-- Confirm PIN Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
            <input
              type="password"
              inputmode="numeric"
              pattern="[0-9]*"
              [ngModel]="confirmPin()"
              (input)="onConfirmPinInput($event)"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="****"
              maxlength="8"
            />
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage()" class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {{ errorMessage() }}
          </div>

          <!-- Submit Button -->
          <button
            (click)="onSubmit()"
            [disabled]="isLoading()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            <span *ngIf="!isLoading()">Create Account</span>
            <span
              *ngIf="isLoading()"
              class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class InitialSetupComponent {
  username = signal('');
  pin = signal('');
  confirmPin = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private inputSanitizer: InputSanitizerService,
  ) {}

  onUsernameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.username.set(input.value);
    this.errorMessage.set('');
  }

  onPinInput(event: Event) {
    const input = event.target as HTMLInputElement;
    // Only allow numbers
    const value = input.value.replace(/[^0-9]/g, '');
    this.pin.set(value);
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
      const accountEmail = 'owner@local.pos'; // Placeholder email

      await this.authService.register(accountEmail, this.username(), this.pin());

      // Successfully registered and logged in (register logs in effectively? No, register just creates).
      // Wait, let's check authService.register implementation.
      // It returns { user, account }. It does NOT set currentSession.
      // So we need to login after register.

      await this.authService.login(this.username(), this.pin());

      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Setup failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
