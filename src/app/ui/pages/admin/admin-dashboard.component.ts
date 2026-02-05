import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService, UserSession } from '../../../application/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent {
  session: UserSession | null = null;

  adminMenuItems = [
    {
      name: 'Users',
      icon: '👥',
      route: '/admin/users',
      description: 'Manage cashier & kitchen users',
    },
    { name: 'Tables', icon: '🪑', route: '/admin/tables', description: 'Manage restaurant tables' },
    {
      name: 'Categories',
      icon: '📁',
      route: '/admin/categories',
      description: 'Manage product categories',
    },
    {
      name: 'Products',
      icon: '🍽️',
      route: '/admin/products',
      description: 'Manage products and pricing',
    },
    {
      name: 'Variants',
      icon: '📏',
      route: '/admin/variants',
      description: 'Manage size variants (S/M/L)',
    },
    { name: 'Extras', icon: '➕', route: '/admin/extras', description: 'Manage product extras' },
    {
      name: 'Ingredients',
      icon: '🥬',
      route: '/admin/ingredients',
      description: 'Manage ingredients & stock',
    },
    {
      name: 'Printers',
      icon: '🖨️',
      route: '/admin/printer',
      description: 'Configure thermal printers',
    },
    {
      name: 'Backups',
      icon: '💾',
      route: '/admin/backup',
      description: 'Backup & Restore Data',
    },
    {
      name: 'Backup Settings',
      icon: '⚙️',
      route: '/admin/backup-settings',
      description: 'Configure Auto-Backups',
    },
    {
      name: 'Error Logs',
      icon: '🪵',
      route: '/admin/error-log',
      description: 'System Health & Logs',
    },
  ];

  constructor(private authService: AuthService) {
    this.session = this.authService.getCurrentSession();
  }
}
