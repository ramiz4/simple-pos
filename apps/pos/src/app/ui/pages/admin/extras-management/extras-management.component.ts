import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Extra } from '@simple-pos/shared/types';
import { ExtraService } from '../../../../application/services/extra.service';
import { ConfirmDeleteModalComponent } from '../../../components/admin/confirm-delete/confirm-delete.component';
import { AdminDataTableComponent } from '../../../components/admin/shared/data-table/data-table.component';
import { AdminPageLayoutComponent } from '../../../components/admin/shared/page-layout/page-layout.component';
import { AdminSearchInputComponent } from '../../../components/admin/shared/search-input/search-input.component';
import { AlertComponent } from '../../../components/shared/alert/alert.component';
import { ButtonComponent } from '../../../components/shared/button/button.component';
import { ModalComponent } from '../../../components/shared/modal/modal.component';

@Component({
  selector: 'app-extras-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AlertComponent,
    ModalComponent,
    AdminPageLayoutComponent,
    AdminDataTableComponent,
    AdminSearchInputComponent,
    ButtonComponent,
    ConfirmDeleteModalComponent,
  ],
  templateUrl: './extras-management.component.html',
  styleUrls: ['./extras-management.component.css'],
})
export class ExtrasManagementComponent implements OnInit, OnDestroy {
  extras: Extra[] = [];
  isLoading = false;
  isFormOpen = false;
  isDeleteConfirmOpen = false;
  successMessage = '';
  errorMessage = '';

  editingId: number | null = null;
  formData = this.initializeFormData();

  deleteConfirmId: number | null = null;
  deleteConfirmName = '';

  private destroyed = false;

  constructor(
    private extraService: ExtraService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroyed = true;
  }

  private initializeFormData() {
    return {
      name: '',
      price: 0,
    };
  }

  async loadData() {
    this.isLoading = true;
    try {
      const extras = await this.extraService.getAll();
      this.extras = extras.sort((a, b) => a.name.localeCompare(b.name));
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to load extras data';
      console.error('Load error:', error);
    } finally {
      this.isLoading = false;
      if (!this.destroyed) {
        this.cdr.detectChanges();
      }
    }
  }

  openForm(extra?: Extra) {
    if (extra) {
      this.editingId = extra.id;
      this.formData = { ...extra };
    } else {
      this.editingId = null;
      this.formData = this.initializeFormData();
    }
    this.isFormOpen = true;
    this.errorMessage = '';
  }

  closeForm() {
    this.isFormOpen = false;
    this.editingId = null;
    this.formData = this.initializeFormData();
  }

  openDeleteConfirm(extra: Extra) {
    this.deleteConfirmId = extra.id;
    this.deleteConfirmName = extra.name;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen = false;
    this.deleteConfirmId = null;
    this.deleteConfirmName = '';
  }

  async saveExtra() {
    if (!this.formData.name || this.formData.price < 0) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    try {
      const isUpdate = !!this.editingId;
      if (this.editingId) {
        await this.extraService.update(this.editingId, this.formData);
      } else {
        await this.extraService.create(this.formData);
      }
      await this.loadData();
      this.closeForm();

      setTimeout(() => {
        if (this.destroyed) return;
        this.successMessage = isUpdate
          ? 'Extra updated successfully'
          : 'Extra created successfully';
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.destroyed) return;
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }, 0);
    } catch (error) {
      this.errorMessage = 'Failed to save extra';
      console.error('Save error:', error);
    }
  }

  async confirmDelete() {
    if (!this.deleteConfirmId) return;

    try {
      await this.extraService.delete(this.deleteConfirmId);
      await this.loadData();
      this.closeDeleteConfirm();

      setTimeout(() => {
        if (this.destroyed) return;
        this.successMessage = 'Extra deleted successfully';
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.destroyed) return;
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }, 0);
    } catch (error) {
      this.errorMessage = 'Failed to delete extra';
      console.error('Delete error:', error);
    }
  }
}
