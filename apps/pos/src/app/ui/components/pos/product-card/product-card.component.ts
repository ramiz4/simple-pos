import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '@simple-pos/shared/types';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [],
  template: `
    <button
      (click)="select.emit(product)"
      class="glass-card group flex flex-col items-start overflow-hidden hover:ring-2 hover:ring-primary-400 transition-all duration-300 w-full"
    >
      <div class="w-full aspect-4/3 relative overflow-hidden bg-surface-100">
        <div
          class="absolute inset-0 primary-gradient opacity-10 group-hover:opacity-20 transition-opacity"
        ></div>
        <div
          class="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500"
        >
          {{ icon }}
        </div>
      </div>

      <div class="p-4 w-full text-left">
        <h3 class="font-black text-surface-900 leading-tight mb-1 line-clamp-2">
          {{ product.name }}
        </h3>
        <div class="flex items-center justify-between mt-auto">
          <span class="text-lg font-black text-primary-600"> €{{ product.price.toFixed(2) }} </span>
          <div
            class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
        </div>
      </div>
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() icon = '🍽️';
  @Output() select = new EventEmitter<Product>();
}
