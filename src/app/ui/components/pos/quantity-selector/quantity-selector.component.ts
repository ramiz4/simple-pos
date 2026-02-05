import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-quantity-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-3 bg-surface-50 p-2 rounded-2xl">
      <button
        type="button"
        (click)="decrease.emit()"
        class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-primary-600 active:scale-95 transition-transform"
      >
        −
      </button>
      <span class="grow text-center font-black text-xl">{{ quantity }}</span>
      <button
        type="button"
        (click)="increase.emit()"
        class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-primary-600 active:scale-95 transition-transform"
      >
        +
      </button>
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
export class QuantitySelectorComponent {
  @Input() quantity: number = 1;
  @Output() increase = new EventEmitter<void>();
  @Output() decrease = new EventEmitter<void>();
}
