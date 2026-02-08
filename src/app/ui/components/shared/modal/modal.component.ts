import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #modalBackdrop
      class="fixed inset-0 bg-surface-900/40 backdrop-blur-sm flex items-center justify-center p-0 sm:p-6 z-50 animate-fade-in"
      (click)="onBackdropClick()"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="title ? modalId + '-title' : null"
      [attr.aria-describedby]="subtitle ? modalId + '-subtitle' : null"
    >
      <div
        #modalContent
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
                <h2
                  [id]="modalId + '-title'"
                  class="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight truncate"
                >
                  {{ title }}
                </h2>
              }
              @if (subtitle) {
                <p
                  [id]="modalId + '-subtitle'"
                  class="text-sm text-gray-500 font-medium truncate mt-1"
                >
                  {{ subtitle }}
                </p>
              }
            </div>

            <!-- Close Button (Mobile & Desktop) -->
            <button
              type="button"
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
                aria-hidden="true"
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
export class ModalComponent implements AfterViewInit, OnDestroy {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() containerClass: string = 'max-w-lg';
  @Input() closeOnBackdrop: boolean = true;
  @Output() close = new EventEmitter<void>();

  @ViewChild('modalContent') modalContent?: ElementRef<HTMLDivElement>;

  // Generate unique ID for this modal instance
  modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;
  private previouslyFocusedElement: HTMLElement | null = null;

  @HostListener('document:keydown.escape')
  handleEscape() {
    this.close.emit();
  }

  ngAfterViewInit() {
    // Store the previously focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus the modal content after a brief delay to ensure animation
    setTimeout(() => {
      this.focusModal();
    }, 100);

    // Trap focus within modal
    this.trapFocus();
  }

  ngOnDestroy() {
    // Restore focus to previously focused element
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }

  private focusModal() {
    if (this.modalContent) {
      const focusableElements = this.getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        // If no focusable elements, focus the modal container
        this.modalContent.nativeElement.setAttribute('tabindex', '-1');
        this.modalContent.nativeElement.focus();
      }
    }
  }

  private trapFocus() {
    if (!this.modalContent) return;

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = this.getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    this.modalContent.nativeElement.addEventListener('keydown', handleFocusTrap);
  }

  private getFocusableElements(): HTMLElement[] {
    if (!this.modalContent) return [];

    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(this.modalContent.nativeElement.querySelectorAll(selector));
  }

  onBackdropClick() {
    if (this.closeOnBackdrop) {
      this.close.emit();
    }
  }
}
