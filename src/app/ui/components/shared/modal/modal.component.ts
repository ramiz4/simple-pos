import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in"
      (click)="onBackdropClick()"
    >
      <div
        [class]="
          'bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl w-full flex flex-col animate-slide-up ' +
          containerClass
        "
        (click)="$event.stopPropagation()"
      >
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.2s ease-out;
      }
      .animate-slide-up {
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ModalComponent {
  @Input() containerClass: string = 'max-w-lg';
  @Input() closeOnBackdrop: boolean = true;
  @Output() close = new EventEmitter<void>();

  onBackdropClick() {
    if (this.closeOnBackdrop) {
      this.close.emit();
    }
  }
}
