import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './ui/pages/admin/admin-dashboard.component';
import { CategoriesManagementComponent } from './ui/pages/admin/categories-management/categories-management.component';
import { ExtrasManagementComponent } from './ui/pages/admin/extras-management/extras-management.component';
import { IngredientsManagementComponent } from './ui/pages/admin/ingredients-management/ingredients-management.component';
import { PrinterSettingsComponent } from './ui/pages/admin/printer-settings/printer-settings.component';
import { ProductsManagementComponent } from './ui/pages/admin/products-management/products-management.component';
import { TablesManagementComponent } from './ui/pages/admin/tables-management/tables-management.component';
import { UsersManagementComponent } from './ui/pages/admin/users-management/users-management.component';
import { VariantsManagementComponent } from './ui/pages/admin/variants-management/variants-management.component';
import { DashboardComponent } from './ui/pages/dashboard/dashboard.component';
import { LoginComponent } from './ui/pages/login/login.component';
import { RegisterComponent } from './ui/pages/register/register.component';
import { UnauthorizedComponent } from './ui/pages/unauthorized/unauthorized.component';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard, kitchenGuard } from './core/guards/role.guard';
import { KitchenViewComponent } from './ui/pages/kitchen/kitchen-view.component';
import { CartViewComponent } from './ui/pages/pos/cart-view.component';
import { OrderTypeSelectionComponent } from './ui/pages/pos/order-type-selection.component';
import { PaymentComponent } from './ui/pages/pos/payment.component';
import { ProductSelectionComponent } from './ui/pages/pos/product-selection.component';
import { TableSelectionComponent } from './ui/pages/pos/table-selection.component';

import { LandingComponent } from './ui/pages/landing/landing.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/tables', component: TablesManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/categories', component: CategoriesManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/products', component: ProductsManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/variants', component: VariantsManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/extras', component: ExtrasManagementComponent, canActivate: [adminGuard] },
  {
    path: 'admin/ingredients',
    component: IngredientsManagementComponent,
    canActivate: [adminGuard],
  },
  { path: 'admin/printer', component: PrinterSettingsComponent, canActivate: [adminGuard] },
  { path: 'admin/users', component: UsersManagementComponent, canActivate: [adminGuard] },
  {
    path: 'admin/backup',
    loadComponent: () =>
      import('./ui/pages/admin/backup/backup.component').then((m) => m.BackupComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/error-log',
    loadComponent: () =>
      import('./ui/pages/admin/error-log/error-log.component').then((m) => m.ErrorLogComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/backup-settings',
    loadComponent: () =>
      import('./ui/pages/admin/backup-settings/backup-settings.component').then(
        (m) => m.BackupSettingsComponent,
      ),
    canActivate: [adminGuard],
  },
  { path: 'pos/order-type', component: OrderTypeSelectionComponent, canActivate: [authGuard] },
  { path: 'pos/table-selection', component: TableSelectionComponent, canActivate: [authGuard] },
  { path: 'pos/product-selection', component: ProductSelectionComponent, canActivate: [authGuard] },
  { path: 'pos/cart', component: CartViewComponent, canActivate: [authGuard] },
  { path: 'pos/payment', component: PaymentComponent, canActivate: [authGuard] },
  {
    path: 'reports',
    loadComponent: () =>
      import('./ui/pages/reports/reports.component').then((m) => m.ReportsComponent),
    canActivate: [authGuard],
  },
  { path: 'kitchen', component: KitchenViewComponent, canActivate: [kitchenGuard] },
  { path: '**', redirectTo: '' },
];
