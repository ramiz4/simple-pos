import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../shared/button/button.component';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
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

      <ng-container footer>
        <app-button (click)="cancel.emit()" variant="glass" label="Cancel"></app-button>
        <app-button (click)="confirm.emit()" variant="danger" label="Delete"></app-button>
      </ng-container>
    </app-modal>
  `,
})
export class ConfirmDeleteModalComponent {
  @Input() itemName = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
