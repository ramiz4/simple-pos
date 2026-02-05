import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-admin-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="backdrop-blur-md bg-white/80 shadow-lg border-b border-white/20 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <h1
              class="text-xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            >
              {{ title }}
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <button
              (click)="back.emit()"
              class="px-4 py-2 min-h-[44px] backdrop-blur-md bg-white/80 hover:bg-white text-gray-700 rounded-lg transition shadow-sm border border-gray-200"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class AdminPageHeaderComponent {
  @Input() title: string = '';
  @Output() back = new EventEmitter<void>();
}
