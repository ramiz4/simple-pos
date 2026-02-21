import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, mergeMap, take } from 'rxjs/operators';
import { AuthService } from '../../../application/services/auth.service';
import { AdminSidebarComponent } from '../../components/admin/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AdminSidebarComponent],
  template: `
    <div class="min-h-screen bg-linear-to-br from-purple-50 to-blue-50 flex">
      <!-- Sidebar Navigation -->
      <app-admin-sidebar [(isOpen)]="isSidebarOpen" class="shrink-0"></app-admin-sidebar>

      <!-- Main Content Area (With left padding on large screens to accommodate fixed sidebar) -->
      <div class="flex-1 flex flex-col min-w-0 h-screen lg:pl-72">
        <!-- Top Header (Mobile Toggle + Page Title) - Fixed at top -->
        <header
          class="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white backdrop-blur-md border-b border-white/20 pt-[env(safe-area-inset-top)]"
        >
          <div class="flex items-center justify-between p-4 gap-4">
            <div class="flex items-center gap-4 min-w-0">
              <button
                (click)="isSidebarOpen = true"
                class="p-2 text-gray-600 hover:bg-white/50 rounded-xl transition-colors shrink-0"
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
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </button>
              <div class="truncate">
                <h1 class="text-sm font-black tracking-tight text-gray-900 leading-none truncate">
                  {{ title() }}
                </h1>
                @if (subtitle()) {
                  <p
                    class="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1 truncate"
                  >
                    {{ subtitle() }}
                  </p>
                }
              </div>
            </div>
            <!-- Portal Home + Lock buttons (mobile) -->
            <div class="flex items-center gap-1 shrink-0">
              <a
                routerLink="/dashboard"
                class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                aria-label="Portal home"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 22V12h6v10"
                  />
                </svg>
              </a>
              <button
                (click)="onLock()"
                class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                aria-label="Lock terminal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
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
        </header>

        <!-- Action row (desktop only) -->
        <div
          class="hidden lg:flex items-center justify-end gap-2 px-8 shrink-0 bg-white backdrop-blur-md border-b border-white/20 pt-[env(safe-area-inset-top)] md:py-2"
        >
          <a
            routerLink="/dashboard"
            class="flex items-center gap-2 px-4 py-4 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all active:scale-95"
            aria-label="Portal home"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 22V12h6v10"
              />
            </svg>
            Portal Home
          </a>
          <button
            (click)="onLock()"
            class="flex items-center gap-2 px-4 py-4 text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all active:scale-95"
            aria-label="Lock terminal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Lock Terminal
          </button>
        </div>

        <!-- Main Dynamic Content - Add top padding on mobile to account for fixed header -->
        <main
          class="flex-1 overflow-y-auto pb-4 px-4 pt-[calc(6rem+env(safe-area-inset-top))] lg:pt-6 lg:px-8 lg:pb-8 custom-scrollbar relative"
        >
          <div class="max-w-7xl mx-auto pb-12">
            <!-- Page Title Area (Moved from Header) -->
            <div class="mb-8">
              <h1
                class="text-3xl lg:text-4xl font-black bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight"
              >
                {{ title() }}
              </h1>
              @if (subtitle()) {
                <p
                  class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mt-2"
                >
                  {{ subtitle() }}
                </p>
              }
            </div>

            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 20px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class AdminShellComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);

  title = signal('');
  subtitle = signal('');
  isSidebarOpen = false;

  constructor() {
    // Listen for future navigation events
    // Setup in constructor to satisfy takeUntilDestroyed injection context
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
    // Handle initial state manually as NavigationEnd already happened
    let currentRoute = this.activatedRoute;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    // We only need the first emission for the initial load
    currentRoute.data.pipe(take(1)).subscribe((data) => this.updateHeader(data));
  }

  private updateHeader(data: Record<string, unknown>) {
    this.title.set((data?.['title'] as string) || 'Admin Portal');
    this.subtitle.set((data?.['subtitle'] as string) || '');
  }

  onLock() {
    this.authService.setStaffActive(false);
    this.router.navigate(['/staff-select']);
  }
}
