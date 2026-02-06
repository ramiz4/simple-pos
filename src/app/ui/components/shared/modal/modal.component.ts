import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-surface-900/40 backdrop-blur-sm flex items-center justify-center p-0 sm:p-6 z-50 animate-fade-in"
      (click)="onBackdropClick()"
      role="dialog"
      aria-modal="true"
    >
      <div
        [class]="
          'glass-card w-full flex flex-col animate-slide-up overflow-hidden max-h-[90vh] relative ' +
          containerClass
        "
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="px-6 py-6 sm:px-8 sm:py-8 bg-white/60 border-b border-transparent">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1 min-w-0">
              @if (title) {
                <h2 class="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight truncate">
                  {{ title }}
                </h2>
              }
              @if (subtitle) {
                <p class="text-sm text-gray-500 font-medium truncate mt-1">
                  {{ subtitle }}
                </p>
              }
            </div>

            <!-- Close Button (Mobile & Desktop) -->
            <button
              (click)="close.emit()"
              class="p-2 -mt-1 -me-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-full transition-colors shrink-0"
              aria-label="Close modal"
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
        </div>

        <!-- Scrollable Body Content -->
        <div class="overflow-y-auto min-h-0 custom-scrollbar p-6 sm:p-8">
          <ng-content></ng-content>
        </div>

        <!-- Optional Footer -->
        <div
          class="flex px-6 py-4 sm:px-8 sm:py-6 bg-white/60 backdrop-blur-md border-t border-gray-100 empty:hidden justify-between"
        >
          <ng-content select="[footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      .animate-slide-up {
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes slideUp {
        from {
          transform: translateY(20px) scale(0.95);
          opacity: 0;
        }
        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
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
    `,
  ],
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() containerClass: string = 'max-w-lg';
  @Input() closeOnBackdrop: boolean = true;
  @Output() close = new EventEmitter<void>();

  onBackdropClick() {
    if (this.closeOnBackdrop) {
      this.close.emit();
    }
  }
}
