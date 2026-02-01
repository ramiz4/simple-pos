import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = signal('');
  pin = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onLogin() {
    this.errorMessage.set('');
    
    if (!this.username() || !this.pin()) {
      this.errorMessage.set('Please enter username and PIN');
      return;
    }

    this.isLoading.set(true);

    try {
      const session = await this.authService.login(this.username(), this.pin());
      console.log('Login successful', session);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Login failed', error);
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
