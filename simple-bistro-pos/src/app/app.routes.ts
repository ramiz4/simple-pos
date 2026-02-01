import { Routes } from '@angular/router';
import { LoginComponent } from './ui/pages/login/login.component';
import { DashboardComponent } from './ui/pages/dashboard/dashboard.component';
import { UnauthorizedComponent } from './ui/pages/unauthorized/unauthorized.component';
import { SeedUserComponent } from './ui/pages/seed-user/seed-user.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/seed-user', pathMatch: 'full' },
  { path: 'seed-user', component: SeedUserComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: '/seed-user' }
];
