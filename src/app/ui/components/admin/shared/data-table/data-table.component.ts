import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-data-table',
  standalone: true,
  imports: [],
  template: `
    <div
      class="glass-card shadow-2xl shadow-purple-500/5 overflow-hidden border-white/40 rounded-3xl"
    >
      <!-- Table Header (Optional if needed for custom toolbar) -->
      @if (tableTitle) {
        <div class="px-6 py-4 border-b border-white/20 bg-white/30">
          <h3 class="text-lg font-bold text-surface-900">{{ tableTitle }}</h3>
        </div>
      }

      <!-- Loading Overlay -->
      @if (isLoading) {
        <div
          class="absolute inset-0 z-10 backdrop-blur-sm bg-white/30 flex items-center justify-center rounded-3xl"
        >
          <div class="flex flex-col items-center gap-3">
            <div
              class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"
            ></div>
            <span class="text-sm font-bold text-primary-600 uppercase tracking-widest"
              >Loading...</span
            >
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading && isEmpty) {
        <div class="p-12 text-center">
          <div
            class="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 text-purple-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-surface-900 mb-2">{{ emptyTitle }}</h3>
          <p class="text-surface-600 max-w-sm mx-auto">{{ emptyMessage }}</p>
        </div>
      }

      @if (!isEmpty) {
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr
                class="bg-linear-to-r from-surface-50 to-purple-50/30 border-b-2 border-purple-100"
              >
                <ng-content select="[headers]"></ng-content>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/20 bg-white/20">
              <ng-content select="[rows]"></ng-content>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden divide-y divide-white/20">
          <ng-content select="[mobileCards]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }
    `,
  ],
})
export class AdminDataTableComponent {
  @Input() tableTitle?: string;
  @Input() isLoading: boolean = false;
  @Input() isEmpty: boolean = false;
  @Input() emptyTitle: string = 'No Data Found';
  @Input() emptyMessage: string = 'There are no items to display at this time.';
}
