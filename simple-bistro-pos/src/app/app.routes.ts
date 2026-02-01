import { Routes } from '@angular/router';
import { LoginComponent } from './ui/pages/login/login.component';
import { DashboardComponent } from './ui/pages/dashboard/dashboard.component';
import { UnauthorizedComponent } from './ui/pages/unauthorized/unauthorized.component';
import { SeedUserComponent } from './ui/pages/seed-user/seed-user.component';
import { AdminDashboardComponent } from './ui/pages/admin/admin-dashboard.component';
import { TablesManagementComponent } from './ui/pages/admin/tables-management/tables-management.component';
import { CategoriesManagementComponent } from './ui/pages/admin/categories-management/categories-management.component';
import { ProductsManagementComponent } from './ui/pages/admin/products-management/products-management.component';
import { VariantsManagementComponent } from './ui/pages/admin/variants-management/variants-management.component';
import { ExtrasManagementComponent } from './ui/pages/admin/extras-management/extras-management.component';
import { IngredientsManagementComponent } from './ui/pages/admin/ingredients-management/ingredients-management.component';
import { Phase2TestComponent } from './ui/pages/phase2-test/phase2-test.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/seed-user', pathMatch: 'full' },
  { path: 'seed-user', component: SeedUserComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'phase2-test', component: Phase2TestComponent, canActivate: [authGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/tables', component: TablesManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/categories', component: CategoriesManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/products', component: ProductsManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/variants', component: VariantsManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/extras', component: ExtrasManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/ingredients', component: IngredientsManagementComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '/seed-user' }
];
