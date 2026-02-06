import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      [class]="
        buttonClasses +
        ' relative overflow-hidden transition-all active:scale-95 group inline-flex items-center justify-center cursor-pointer min-h-4'
      "
      [class.opacity-50]="isDisabled || isLoading"
      [class.cursor-not-allowed]="isDisabled || isLoading"
    >
      @if (routerLink) {
        <a [routerLink]="routerLink" class="absolute inset-0 z-20"></a>
      } @else {
        <button
          [type]="type"
          [attr.form]="form"
          [disabled]="isDisabled || isLoading"
          class="absolute inset-0 z-20 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
        ></button>
      }

      <!-- Loading Spinner Overlay -->
      @if (isLoading) {
        <div
          class="absolute inset-0 flex items-center justify-center bg-inherit z-10 rounded-inherit"
        >
          <svg
            class="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      }

      <!-- Content -->
      <div
        class="flex items-center justify-center gap-2 pointer-events-none"
        [class.opacity-0]="isLoading"
      >
        <ng-content select="[leftIcon], [lefticon], .left-icon"></ng-content>
        <span class="whitespace-nowrap">{{ label }}</span>
        <ng-content select="[rightIcon], [righticon], .right-icon"></ng-content>
      </div>

      <!-- Hover Effect Overlay for Neo -->
      @if (variant === 'neo') {
        <div
          class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        ></div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() form: string | null = null;
  @Input() variant: 'neo' | 'glass' | 'danger' | 'ghost' = 'neo';
  @Input() isLoading: boolean = false;
  @Input() isDisabled: boolean = false;
  @Input() hasLeftIcon: boolean = false;
  @Input() hasRightIcon: boolean = false;
  @Input() routerLink: string | any[] | null = null;

  get buttonClasses(): string {
    const base = 'rounded-2xl font-bold uppercase tracking-widest text-xs py-3';

    // Padding logic
    let padding = 'px-6';
    if (this.hasLeftIcon && !this.hasRightIcon) {
      padding = 'pl-5 pr-8';
    } else if (this.hasRightIcon && !this.hasLeftIcon) {
      padding = 'pl-8 pr-5';
    }

    const variants = {
      neo: 'text-white shadow-lg shadow-primary-500/20 bg-linear-to-r from-primary-600 to-primary-500',
      glass:
        'backdrop-blur-lg bg-white/40 border border-white/60 text-surface-800 hover:bg-white/60',
      danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100',
      ghost: 'bg-transparent text-surface-500 hover:bg-surface-50',
    };

    return `${base} ${padding} ${variants[this.variant]}`;
  }
}
