import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div
      class="fixed bottom-20 md:bottom-0 left-0 md:left-20 lg:left-64 right-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-8 pointer-events-none transition-all duration-300"
    >
      <div class="max-w-4xl mx-auto pointer-events-auto">
        <div
          class="glass-card bg-surface-900/90! backdrop-blur-2xl! border-white/10 p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-2 sm:gap-6 translate-y-0 animate-slide-up"
        >
          <div class="flex items-center gap-2 sm:gap-4 min-w-0">
            <div
              class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl primary-gradient flex items-center justify-center text-white relative shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              @if (itemCount > 0) {
                <span
                  class="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 border-2 border-surface-900 text-[9px] sm:text-[10px] font-black flex items-center justify-center text-white"
                >
                  {{ itemCount }}
                </span>
              }
            </div>
            <div class="min-w-0">
              <div
                class="text-surface-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-0.5 sm:mb-0 truncate"
              >
                Subtotal
              </div>
              <div class="text-lg sm:text-2xl font-black text-white leading-none truncate">
                €{{ subtotal.toFixed(2) }}
              </div>
            </div>
          </div>

          <app-button
            (click)="action.emit()"
            [isDisabled]="itemCount === 0 && !canBeEmpty"
            [label]="buttonLabel"
            [hasRightIcon]="true"
            class="scale-90 sm:scale-100 origin-right shrink-0"
          >
            <svg
              rightIcon
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </app-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class StatusBarComponent {
  @Input() itemCount = 0;
  @Input() subtotal = 0;
  @Input() buttonLabel = 'View Cart';
  @Input() canBeEmpty = false;
  @Output() action = new EventEmitter<void>();
}
