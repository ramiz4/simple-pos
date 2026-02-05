import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal (close)="cancel.emit()">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Confirm Delete</h2>
        <p class="text-gray-700 mb-6">
          Are you sure you want to delete <span class="font-semibold">{{ itemName }}</span
          >? This action cannot be undone.
        </p>

        <div class="flex gap-3">
          <button
            (click)="confirm.emit()"
            class="flex-1 px-4 py-2 min-h-[44px] bg-red-500 hover:bg-red-600 text-white rounded-lg transition shadow-md"
          >
            Delete
          </button>
          <button
            (click)="cancel.emit()"
            class="flex-1 px-4 py-2 min-h-[44px] backdrop-blur-md bg-gray-100/80 hover:bg-gray-200 text-gray-800 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class ConfirmDeleteModalComponent {
  @Input() itemName: string = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
