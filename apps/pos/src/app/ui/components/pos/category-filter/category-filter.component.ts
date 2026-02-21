import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Category } from '@simple-pos/shared/types';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      role="tablist"
      aria-label="Product categories"
      class="flex bg-surface-100 p-1 rounded-2xl shadow-inner overflow-x-auto no-scrollbar scroll-smooth"
      style="-webkit-overflow-scrolling: touch"
    >
      @for (category of categories(); track category.id) {
        <button
          role="tab"
          [attr.aria-selected]="selectedId() === category.id"
          [attr.aria-controls]="'panel-' + category.id"
          (click)="categoryChange.emit(category.id)"
          [ngClass]="{
            'bg-white text-primary-600 shadow-sm': selectedId() === category.id,
            'text-surface-500 hover:text-primary-500': selectedId() !== category.id,
          }"
          class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1"
        >
          {{ category.name }}
        </button>
      }
    </div>
  `,
})
export class CategoryFilterComponent {
  categories = input.required<Category[]>();
  selectedId = input<number | null>(null);
  categoryChange = output<number>();
}
