import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserSession } from '../../../application/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  @Input() title: string = 'Simple POS';
  @Input() showBackButton: boolean = false;
  @Input() backRoute: string = '/dashboard';
  @Output() back = new EventEmitter<void>();

  session: UserSession | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.session = this.authService.getCurrentSession();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onBack() {
    if (this.back.observed) {
      this.back.emit();
    } else {
      this.router.navigate([this.backRoute]);
    }
  }
}
