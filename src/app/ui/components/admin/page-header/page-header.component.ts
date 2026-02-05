import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../application/services/auth.service';

@Component({
  selector: 'app-admin-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="backdrop-blur-md bg-white/40 border-b border-white/20 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div>
              <h1
                class="text-2xl lg:text-3xl font-black bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate tracking-tight"
              >
                {{ title }}
              </h1>
              @if (subtitle) {
                <p
                  class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mt-1"
                >
                  {{ subtitle }}
                </p>
              }
            </div>
          </div>
          <div class="flex items-center gap-3">
            <ng-content select="[actions]"></ng-content>

            <button
              (click)="onPortal()"
              class="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-gray-700 rounded-xl transition-all shadow-sm border border-white/40 text-sm font-bold active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Portal
            </button>

            <button
              (click)="onLock()"
              class="w-10 h-10 flex items-center justify-center hover:bg-white/60 text-gray-500 rounded-xl transition-all active:scale-90 border border-transparent hover:border-white/40"
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
    </nav>
  `,
  styles: [],
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
}
