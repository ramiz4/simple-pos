import { Routes } from '@angular/router';
import { AdminShellComponent } from '../layouts/admin-shell/admin-shell.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../pages/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        data: { title: 'Admin Dashboard' },
      },
      {
        path: 'tables',
        loadComponent: () =>
          import('../pages/admin/tables-management/tables-management.component').then(
            (m) => m.TablesManagementComponent,
          ),
        data: { title: 'Manage Tables' },
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('../pages/admin/categories-management/categories-management.component').then(
            (m) => m.CategoriesManagementComponent,
          ),
        data: { title: 'Manage Categories' },
      },
      {
        path: 'products',
        loadComponent: () =>
          import('../pages/admin/products-management/products-management.component').then(
            (m) => m.ProductsManagementComponent,
          ),
        data: { title: 'Manage Products' },
      },
      {
        path: 'variants',
        loadComponent: () =>
          import('../pages/admin/variants-management/variants-management.component').then(
            (m) => m.VariantsManagementComponent,
          ),
        data: { title: 'Manage Variants' },
      },
      {
        path: 'extras',
        loadComponent: () =>
          import('../pages/admin/extras-management/extras-management.component').then(
            (m) => m.ExtrasManagementComponent,
          ),
        data: { title: 'Manage Extras' },
      },
      {
        path: 'ingredients',
        loadComponent: () =>
          import('../pages/admin/ingredients-management/ingredients-management.component').then(
            (m) => m.IngredientsManagementComponent,
          ),
        data: { title: 'Manage Ingredients' },
      },
      {
        path: 'printer',
        loadComponent: () =>
          import('../pages/admin/printer-settings/printer-settings.component').then(
            (m) => m.PrinterSettingsComponent,
          ),
        data: { title: 'Printer Settings' },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('../pages/admin/users-management/users-management.component').then(
            (m) => m.UsersManagementComponent,
          ),
        data: { title: 'Manage Users' },
      },
      {
        path: 'backup',
        loadComponent: () =>
          import('../pages/admin/backup/backup.component').then((m) => m.BackupComponent),
        data: { title: 'Backup & Restore' },
      },
      {
        path: 'backup-settings',
        loadComponent: () =>
          import('../pages/admin/backup-settings/backup-settings.component').then(
            (m) => m.BackupSettingsComponent,
          ),
        data: { title: 'Backup Settings' },
      },
      {
        path: 'error-log',
        loadComponent: () =>
          import('../pages/admin/error-log/error-log.component').then((m) => m.ErrorLogComponent),
        data: { title: 'Error Logs' },
      },
    ],
  },
];
