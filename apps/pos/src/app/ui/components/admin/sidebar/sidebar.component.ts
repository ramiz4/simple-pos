import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../application/services/auth.service';
import { AdminNavItemComponent, NavItem } from './nav-item.component';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, AdminNavItemComponent],
  template: `
    <!-- Mobile Scrim -->
    @if (isOpen) {
      <div
        class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        (click)="closeSidebar()"
        aria-hidden="true"
      ></div>
    }

    <aside
      [id]="'admin-sidebar'"
      [class.translate-x-0]="isOpen"
      [class.-translate-x-full]="!isOpen"
      class="fixed top-0 left-0 z-50 w-72 h-dvh transition-transform duration-300 transform lg:translate-x-0 bg-white/70 backdrop-blur-xl border-r border-white/40 shadow-2xl flex flex-col"
      role="navigation"
      aria-label="Admin Navigation Menu"
    >
      <!-- Logo/Brand Area -->
      <div
        class="p-6 flex items-center justify-between border-b border-surface-200"
        style="padding-top: max(1.5rem, calc(1.5rem + env(safe-area-inset-top)))"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-linear-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04l-.002.001C2.427 7.152 2 8.514 2 10c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.486-.427-2.848-1.382-4.014l-.002-.001z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-black tracking-tight text-gray-900 leading-none">Admin</h2>
            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Management</p>
          </div>
        </div>
        <button
          (click)="closeSidebar()"
          class="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Close Sidebar"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Navigation Menu -->
      <div class="flex-1 overflow-y-auto py-6 px-2 custom-scrollbar min-h-0">
        <ul class="space-y-1" role="list">
          @for (item of menuItems; track item.label) {
            <app-admin-nav-item
              [item]="item"
              [onLinkClick]="closeSidebar.bind(this)"
            ></app-admin-nav-item>
          }
        </ul>
      </div>

      <!-- Footer / Lower Actions -->
      <div class="p-4 shrink-0 border-t border-surface-200 space-y-2">
        <a
          routerLink="/dashboard"
          class="flex items-center p-3 text-gray-600 rounded-2xl transition-all duration-300 hover:bg-white/60 hover:text-blue-600 group border border-transparent hover:border-white/40 active:scale-95"
          (click)="closeSidebar()"
        >
          <span class="shrink-0 w-5 h-5 transition duration-75 group-hover:text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
              />
            </svg>
          </span>
          <span class="ms-3 text-sm font-bold tracking-tight">Portal Home</span>
        </a>

        <button
          (click)="onLock()"
          class="w-full flex items-center p-3 text-red-600 rounded-2xl transition-all duration-300 hover:bg-red-50 group border border-transparent hover:border-red-100 active:scale-95"
        >
          <span class="shrink-0 w-5 h-5 transition duration-75 group-hover:text-red-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </span>
          <span class="ms-3 text-sm font-bold tracking-tight">Lock Terminal</span>
        </button>
      </div>
    </aside>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
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
export class AdminSidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  closeSidebar() {
    this.isOpenChange.emit(false);
  }

  onLock() {
    this.authService.setStaffActive(false);
    this.router.navigate(['/staff-select']);
    this.closeSidebar();
  }

  menuItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: 'dashboard' },
    {
      label: 'Products & Catalog',
      path: '#',
      children: [
        { label: 'Categories', path: '/admin/categories' },
        { label: 'Products', path: '/admin/products' },
        { label: 'Variants', path: '/admin/variants' },
        { label: 'Extras', path: '/admin/extras' },
        { label: 'Ingredients', path: '/admin/ingredients' },
      ],
    },
    {
      label: 'Store Operations',
      path: '#',
      children: [
        { label: 'Tables', path: '/admin/tables' },
        { label: 'Order Settings', path: '/admin/order-settings' },
        { label: 'Printer Settings', path: '/admin/printer' },
      ],
    },
    {
      label: 'System & Security',
      path: '#',
      children: [
        { label: 'Users', path: '/admin/users' },
        { label: 'Backup & Restore', path: '/admin/backup' },
        { label: 'Backup Settings', path: '/admin/backup-settings' },
        { label: 'Error Logs', path: '/admin/error-log' },
      ],
    },
  ];
}
