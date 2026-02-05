import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../application/services/auth.service';

@Component({
  selector: 'app-admin-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="backdrop-blur-md bg-white/80 shadow-lg border-b border-white/20 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col">
          <div class="flex justify-between h-16 items-center">
            <div>
              <h1
                class="text-xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate"
              >
                {{ title }}
              </h1>
              @if (subtitle) {
                <p
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none"
                >
                  {{ subtitle }}
                </p>
              }
            </div>
            <div class="flex items-center gap-3">
              <ng-content select="[actions]"></ng-content>

              <button
                (click)="onPortal()"
                class="px-4 py-2 min-h-[44px] backdrop-blur-md bg-white/80 hover:bg-white text-gray-700 rounded-lg transition shadow-sm border border-gray-200 text-sm font-bold"
              >
                Portal
              </button>

              <button
                (click)="onLock()"
                class="p-2 hover:bg-gray-100 text-gray-600 rounded-full transition-colors active:scale-90"
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

          <!-- Quick Navigation Menu -->
          <div class="flex overflow-x-auto no-scrollbar py-2 gap-2 border-t border-gray-100/50">
            @for (item of menuItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-md scale-105"
                [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
                class="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap border border-gray-100 bg-gray-50/50 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                {{ item.label }}
              </a>
            }
          </div>
        </div>
      </div>
    </nav>
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
    `,
  ],
})
export class AdminPageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onPortal() {
    this.router.navigate(['/dashboard']);
  }

  onLock() {
    this.authService.setStaffActive(false);
    this.router.navigate(['/staff-select']);
  }

  menuItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Products', path: '/admin/products' },
    { label: 'Categories', path: '/admin/categories' },
    { label: 'Tables', path: '/admin/tables' },
    { label: 'Variants', path: '/admin/variants' },
    { label: 'Extras', path: '/admin/extras' },
    { label: 'Ingredients', path: '/admin/ingredients' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Printer', path: '/admin/printer' },
    { label: 'Backup', path: '/admin/backup' },
    { label: 'Backup Settings', path: '/admin/backup-settings' },
    { label: 'Error Log', path: '/admin/error-log' },
  ];
}
