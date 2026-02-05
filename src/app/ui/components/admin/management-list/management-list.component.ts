import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-management-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl p-6 border border-white/20">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">{{ title }}</h2>
        <button
          (click)="add.emit()"
          class="px-6 py-2 min-h-[44px] bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition shadow-md"
        >
          + Add {{ itemLabel }}
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-12">
        <div class="inline-block animate-spin text-4xl">⏳</div>
        <p class="text-gray-600 mt-4">Loading {{ title.toLowerCase() }}...</p>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="!isLoading && isEmpty"
        class="text-center py-12 backdrop-blur-md bg-blue-50/50 rounded-xl border border-blue-200 p-8"
      >
        <p class="text-gray-600 text-lg">
          No {{ title.toLowerCase() }} found. Create your first {{ itemLabel.toLowerCase() }} to get
          started.
        </p>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading && !isEmpty" class="space-y-3">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class ManagementListComponent {
  @Input() title: string = '';
  @Input() itemLabel: string = '';
  @Input() isLoading: boolean = false;
  @Input() isEmpty: boolean = false;
  @Output() add = new EventEmitter<void>();
}
