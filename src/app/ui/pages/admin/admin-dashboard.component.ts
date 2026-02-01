import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserSession } from '../../../application/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  session: UserSession | null = null;

  adminMenuItems = [
    { name: 'Tables', icon: '🪑', route: '/admin/tables', description: 'Manage restaurant tables' },
    { name: 'Categories', icon: '📁', route: '/admin/categories', description: 'Manage product categories' },
    { name: 'Products', icon: '🍽️', route: '/admin/products', description: 'Manage products and pricing' },
    { name: 'Variants', icon: '📏', route: '/admin/variants', description: 'Manage size variants (S/M/L)' },
    { name: 'Extras', icon: '➕', route: '/admin/extras', description: 'Manage product extras' },
    { name: 'Ingredients', icon: '🥬', route: '/admin/ingredients', description: 'Manage ingredients & stock' },
  ];

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

  onBackToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
