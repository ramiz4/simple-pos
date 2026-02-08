import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (routerLink && !isDisabled && !isLoading) {
      <a
        [routerLink]="routerLink"
        [class]="
          buttonClasses +
          ' relative overflow-hidden transition-all active:scale-95 group items-center justify-center min-h-4 h-full no-underline ' +
          (fullWidth ? 'flex w-full' : 'inline-flex')
        "
      >
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
              aria-hidden="true"
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
        <span class="flex items-center justify-center gap-2" [class.opacity-0]="isLoading">
          <ng-content select="[leftIcon], [lefticon], .left-icon"></ng-content>
          <span class="whitespace-nowrap">{{ label }}</span>
          <ng-content select="[rightIcon], [righticon], .right-icon"></ng-content>
        </span>

        <!-- Hover Effect Overlay for Neo -->
        @if (variant === 'neo') {
          <span
            class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            aria-hidden="true"
          ></span>
        }
      </a>
    } @else if (routerLink && (isDisabled || isLoading)) {
      <span
        [class]="
          buttonClasses +
          ' relative overflow-hidden group items-center justify-center min-h-4 h-full ' +
          (fullWidth ? 'flex w-full' : 'inline-flex')
        "
        [class.opacity-50]="true"
        role="link"
        aria-disabled="true"
      >
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
              aria-hidden="true"
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
        <span class="flex items-center justify-center gap-2" [class.opacity-0]="isLoading">
          <ng-content select="[leftIcon], [lefticon], .left-icon"></ng-content>
          <span class="whitespace-nowrap">{{ label }}</span>
          <ng-content select="[rightIcon], [righticon], .right-icon"></ng-content>
        </span>

        <!-- Hover Effect Overlay for Neo -->
        @if (variant === 'neo') {
          <span
            class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            aria-hidden="true"
          ></span>
        }
      </span>
    } @else {
      <button
        [type]="type"
        [attr.form]="form"
        [disabled]="isDisabled || isLoading"
        [class]="
          buttonClasses +
          ' relative overflow-hidden transition-all active:scale-95 group items-center justify-center min-h-4 h-full ' +
          (fullWidth ? 'flex w-full' : 'inline-flex')
        "
        [class.opacity-50]="isDisabled || isLoading"
      >
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
              aria-hidden="true"
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
        <span class="flex items-center justify-center gap-2" [class.opacity-0]="isLoading">
          <ng-content select="[leftIcon], [lefticon], .left-icon"></ng-content>
          <span class="whitespace-nowrap">{{ label }}</span>
          <ng-content select="[rightIcon], [righticon], .right-icon"></ng-content>
        </span>

        <!-- Hover Effect Overlay for Neo -->
        @if (variant === 'neo') {
          <span
            class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            aria-hidden="true"
          ></span>
        }
      </button>
    }
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
  @Input() variant: 'neo' | 'glass' | 'danger' | 'ghost' | 'orange' = 'neo';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() isLoading: boolean = false;
  @Input() isDisabled: boolean = false;
  @Input() hasLeftIcon: boolean = false;
  @Input() hasRightIcon: boolean = false;
  @Input() routerLink: string | any[] | null = null;
  @HostBinding('class.w-full')
  @Input()
  fullWidth: boolean = false;

  get buttonClasses(): string {
    const base = 'rounded-2xl font-bold uppercase tracking-widest';

    const sizes = {
      sm: 'text-xs py-1',
      md: 'text-sm py-2',
      lg: 'text-lg py-3',
      xl: 'text-xl py-4',
    };

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
      orange:
        'text-white shadow-lg shadow-orange-500/20 bg-linear-to-r from-orange-500 to-orange-400',
    };

    return `${base} ${sizes[this.size]} ${padding} ${variants[this.variant]}`;
  }
}
