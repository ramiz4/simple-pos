import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, mergeMap, take } from 'rxjs/operators';
import { AuthService, UserSession } from '../../../application/services/auth.service';
import { UpdateService } from '../../../application/services/update.service';
import { UserRoleEnum } from '../../../domain/enums';

@Component({
  selector: 'app-pos-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#F8FAFC] flex flex-col">
      <!-- Navigation Header -->
      <header class="nav-blur sticky top-0 z-50 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <!-- Brand & Context -->
            <div class="flex items-center gap-4">
              <div
                class="flex items-center gap-2 cursor-pointer group"
                (click)="router.navigate(['/dashboard'])"
              >
                <div
                  class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200 group-hover:scale-105 transition-transform"
                >
                  <img src="logo.svg" alt="POS" class="h-6 w-6 brightness-0 invert" />
                </div>
                <div class="hidden sm:flex flex-col leading-tight">
                  <span class="text-xs font-black text-primary-600 uppercase tracking-widest"
                    >Portal</span
                  >
                  <span class="text-surface-900 font-black text-sm">{{ title() }}</span>
                </div>
              </div>
            </div>

            <!-- Desktop Navigation -->
            <nav
              class="hidden lg:flex items-center gap-1 bg-surface-50 p-1 rounded-2xl border border-surface-100"
            >
              @for (item of menuItems(); track item.path) {
                <a
                  [routerLink]="item.path"
                  #rlaDesktop="routerLinkActive"
                  routerLinkActive
                  [routerLinkActiveOptions]="{
                    exact: item.path === '/dashboard' || item.path === '/pos',
                  }"
                  class="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:bg-white/50"
                  [class.bg-white]="rlaDesktop.isActive"
                  [class.text-primary-600]="rlaDesktop.isActive"
                  [class.shadow-sm]="rlaDesktop.isActive"
                  [class.text-surface-600]="!rlaDesktop.isActive"
                  [class.hover:text-surface-900]="!rlaDesktop.isActive"
                >
                  {{ item.label }}
                </a>
              }
            </nav>

            <!-- Actions & Session -->
            <div class="flex items-center gap-3">
              @if (updateAvailable()) {
                <button
                  (click)="onUpdate()"
                  class="flex p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors animate-pulse"
                  title="Update Available"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              }

              <div class="hidden md:flex flex-col items-end leading-none">
                <span
                  class="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1"
                  >{{ session?.roleCode }}</span
                >
                <span class="font-bold text-surface-900 text-sm">{{ session?.user?.name }}</span>
              </div>

              <div class="flex items-center gap-2 pl-3 border-l border-surface-100">
                <button
                  (click)="onLock()"
                  class="p-2 hover:bg-surface-100 text-surface-600 rounded-full transition-all active:scale-95"
                  title="Lock Terminal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Mobile Quick Nav (Scrollable) -->
          <div
            class="lg:hidden flex overflow-x-auto no-scrollbar py-2 px-1 border-t border-surface-50"
          >
            <div
              class="flex items-center gap-1 bg-surface-50 p-1 rounded-2xl border border-surface-100"
            >
              @for (item of menuItems(); track item.path) {
                <a
                  [routerLink]="item.path"
                  #rla="routerLinkActive"
                  routerLinkActive
                  [routerLinkActiveOptions]="{
                    exact: item.path === '/dashboard' || item.path === '/pos',
                  }"
                  class="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:bg-white/50 whitespace-nowrap"
                  [class.bg-white]="rla.isActive"
                  [class.text-primary-600]="rla.isActive"
                  [class.shadow-sm]="rla.isActive"
                  [class.text-surface-600]="!rla.isActive"
                  [class.hover:text-surface-900]="!rla.isActive"
                >
                  {{ item.label }}
                </a>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="grow overflow-y-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .nav-blur {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(241, 245, 249, 1);
      }
    `,
  ],
})
export class PosShellComponent implements OnInit {
  protected router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private updateService = inject(UpdateService);

  title = signal('POS');
  session: UserSession | null = null;
  updateAvailable = this.updateService.updateAvailable;

  menuItems = signal<any[]>([]);

  constructor() {
    this.session = this.authService.getCurrentSession();
    this.setupMenu();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap((route) => route.data),
        takeUntilDestroyed(),
      )
      .subscribe((data) => this.updateHeader(data));
  }

  ngOnInit() {
    let currentRoute = this.activatedRoute;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    currentRoute.data.pipe(take(1)).subscribe((data) => this.updateHeader(data));
  }

  private setupMenu() {
    const items = [
      { label: 'New Order', path: '/pos' },
      { label: 'Active Orders', path: '/active-orders' },
    ];

    if (this.authService.hasAnyRole([UserRoleEnum.KITCHEN, UserRoleEnum.ADMIN])) {
      items.push({ label: 'Kitchen', path: '/kitchen' });
    }

    if (this.authService.hasAnyRole([UserRoleEnum.ADMIN])) {
      items.push({ label: 'Reports', path: '/reports' });
      items.push({ label: 'Admin', path: '/admin' });
    }

    this.menuItems.set(items);
  }

  private updateHeader(data: any) {
    this.title.set(data['title'] || 'POS');
  }

  onLock() {
    this.authService.setStaffActive(false);
    this.router.navigate(['/staff-select']);
  }

  onUpdate() {
    this.updateService.applyUpdate();
  }
}
