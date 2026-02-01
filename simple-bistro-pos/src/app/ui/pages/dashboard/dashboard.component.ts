import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserSession } from '../../../application/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  session: UserSession | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.session = this.authService.getCurrentSession();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
