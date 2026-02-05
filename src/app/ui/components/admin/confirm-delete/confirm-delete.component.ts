import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal title="Confirm Delete" (close)="cancel.emit()">
      <p class="text-gray-600 mb-2 font-medium">
        Are you sure you want to delete
        <span class="text-red-600 font-bold underline decoration-red-200 underline-offset-4">{{
          itemName
        }}</span
        >?
      </p>
      <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">
        This action cannot be undone
      </p>

      <div footer class="flex gap-3 w-full">
        <button
          (click)="cancel.emit()"
          class="flex-1 px-4 py-2 min-h-[44px] backdrop-blur-md bg-gray-100/80 hover:bg-gray-200 text-gray-800 rounded-xl transition font-bold active:scale-95"
        >
          Cancel
        </button>
        <button
          (click)="confirm.emit()"
          class="flex-1 px-4 py-2 min-h-[44px] bg-red-500 hover:bg-red-600 text-white rounded-xl transition shadow-lg shadow-red-100 font-bold active:scale-95"
        >
          Delete
        </button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDeleteModalComponent {
  @Input() itemName: string = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
