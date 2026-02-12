import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-search-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="relative w-full group" [class]="maxWidth">
      <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-surface-400 group-focus-within:text-primary-500 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </span>
      <input
        type="text"
        [placeholder]="placeholder"
        [(ngModel)]="searchValue"
        (ngModelChange)="onSearchChange($event)"
        class="w-full pl-14 pr-4 py-3 bg-white/50 border border-white/60 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm font-semibold text-surface-900 placeholder:text-surface-400"
      />
    </div>
  `,
})
export class AdminSearchInputComponent {
  @Input() placeholder = 'Search...';
  @Input() maxWidth = 'max-w-md';
  @Output() search = new EventEmitter<string>();

  searchValue = '';

  onSearchChange(value: string) {
    this.search.emit(value);
  }
}
