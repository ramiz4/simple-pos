import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-0 left-0 right-0 z-40 px-4 pb-8 sm:pb-4 pointer-events-none">
      <div class="max-w-4xl mx-auto pointer-events-auto">
        <div
          class="glass-card bg-surface-900/90! backdrop-blur-2xl! border-white/10 p-4 shadow-2xl flex items-center justify-between gap-6 translate-y-0 animate-slide-up"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center text-white relative"
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              @if (itemCount > 0) {
                <span
                  class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 border-2 border-surface-900 text-[10px] font-black flex items-center justify-center text-white"
                >
                  {{ itemCount }}
                </span>
              }
            </div>
            <div>
              <div class="text-surface-400 text-[10px] font-black uppercase tracking-widest">
                Subtotal
              </div>
              <div class="text-2xl font-black text-white leading-none">
                €{{ subtotal.toFixed(2) }}
              </div>
            </div>
          </div>

          <button
            (click)="action.emit()"
            [disabled]="itemCount === 0"
            class="neo-button h-14 px-8 disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <span>{{ buttonLabel }}</span>
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
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
  @Input() itemCount: number = 0;
  @Input() subtotal: number = 0;
  @Input() buttonLabel: string = 'View Cart';
  @Output() action = new EventEmitter<void>();
}
