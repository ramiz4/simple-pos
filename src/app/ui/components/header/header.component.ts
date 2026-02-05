import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserSession } from '../../../application/services/auth.service';
import { UpdateService } from '../../../application/services/update.service';

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
  updateAvailable: any; // Using any temporarily to avoid type issues, or specify Signal<boolean>

  constructor(
    private authService: AuthService,
    private router: Router,
    private updateService: UpdateService,
  ) {
    this.session = this.authService.getCurrentSession();
    this.updateAvailable = this.updateService.updateAvailable;
  }

  onLock() {
    this.authService.setStaffActive(false);
    this.router.navigate(['/staff-select']);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onUpdate() {
    this.updateService.applyUpdate();
  }

  private isNavigatingBack = false;

  onBack() {
    if (this.isNavigatingBack) return;

    this.isNavigatingBack = true;
    setTimeout(() => {
      this.isNavigatingBack = false;
    }, 500);

    if (this.back.observed) {
      this.back.emit();
    } else {
      this.router.navigate([this.backRoute]);
    }
  }
}
