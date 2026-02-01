import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserSession } from '../../../application/services/auth.service';
import { UserRoleEnum } from '../../../domain/enums';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  session: UserSession | null = null;
  UserRoleEnum = UserRoleEnum;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.session = this.authService.getCurrentSession();
  }

  isAdmin(): boolean {
    return this.authService.hasAnyRole([UserRoleEnum.ADMIN]);
  }

  isKitchen(): boolean {
    return this.authService.hasAnyRole([UserRoleEnum.KITCHEN]);
  }

  isCashier(): boolean {
    return this.authService.hasAnyRole([UserRoleEnum.CASHIER, UserRoleEnum.ADMIN]);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
