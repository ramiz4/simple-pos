import { Routes } from '@angular/router';
import { LandingComponent } from './ui/pages/landing/landing.component';

import { authGuard } from './core/guards/auth.guard';
import { desktopLandingGuard } from './core/guards/desktop-landing.guard';
import { adminGuard, kitchenGuard } from './core/guards/role.guard';
import { setupGuard } from './core/guards/setup.guard';
import { staffGuard } from './core/guards/staff.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, canActivate: [desktopLandingGuard] },
  { path: 'landing', redirectTo: '', pathMatch: 'full' },
  {
    path: 'initial-setup',
    loadComponent: () =>
      import('./ui/pages/initial-setup/initial-setup.component').then(
        (m) => m.InitialSetupComponent,
      ),
    canActivate: [setupGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./ui/pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./ui/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'staff-select',
    loadComponent: () =>
      import('./ui/pages/staff-selection/staff-selection.component').then(
        (m) => m.StaffSelectionComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./ui/pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [staffGuard],
  },
  {
    path: 'active-orders',
    loadComponent: () =>
      import('./ui/pages/active-orders/active-orders.component').then(
        (m) => m.ActiveOrdersComponent,
      ),
    canActivate: [staffGuard],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./ui/pages/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },

  // Lazy Loaded Admin Routes
  {
    path: 'admin',
    loadChildren: () => import('./ui/routes/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [adminGuard],
  },

  // Lazy Loaded POS Routes
  {
    path: 'pos',
    loadChildren: () => import('./ui/routes/pos.routes').then((m) => m.POS_ROUTES),
    canActivate: [staffGuard],
  },

  {
    path: 'reports',
    loadComponent: () =>
      import('./ui/pages/reports/reports.component').then((m) => m.ReportsComponent),
    canActivate: [staffGuard],
  },
  {
    path: 'kitchen',
    loadComponent: () =>
      import('./ui/pages/kitchen/kitchen-view.component').then((m) => m.KitchenViewComponent),
    canActivate: [kitchenGuard],
  },
  { path: '**', redirectTo: '' },
];
