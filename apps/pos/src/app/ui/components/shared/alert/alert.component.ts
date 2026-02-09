import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [],
  template: `
    @if (message) {
      <div
        class="mb-6 p-4 backdrop-blur-md rounded-xl flex items-center gap-3 animate-fade-in border"
        [class]="
          type === 'success'
            ? 'bg-green-50/80 border-green-200 text-green-700'
            : 'bg-red-50/80 border-red-200 text-red-700'
        "
        [attr.role]="type === 'error' ? 'alert' : 'status'"
        [attr.aria-live]="type === 'error' ? 'assertive' : 'polite'"
      >
        <span class="text-2xl" aria-hidden="true">{{ type === 'success' ? '✓' : '✕' }}</span>
        <p class="grow">{{ message }}</p>
        <button
          type="button"
          (click)="close.emit()"
          class="text-current opacity-50 hover:opacity-100 transition-opacity p-1"
          aria-label="Close alert"
        >
          ×
        </button>
      </div>
    }
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class AlertComponent {
  @Input() message = '';
  @Input() type: 'success' | 'error' = 'success';
  @Output() close = new EventEmitter<void>();
}
