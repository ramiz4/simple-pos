import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Extra } from '../../../../domain/entities/extra.interface';
import { ExtraService } from '../../../../application/services/extra.service';

@Component({
  selector: 'app-extras-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './extras-management.component.html',
  styleUrls: ['./extras-management.component.css']
})
export class ExtrasManagementComponent implements OnInit {
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

  constructor(
    private extraService: ExtraService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private initializeFormData() {
    return {
      name: '',
      price: 0
    };
  }

  async loadData() {
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      const extras = await this.extraService.getAll();
      this.extras = extras.sort((a, b) => a.name.localeCompare(b.name));
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to load extras data';
      console.error('Load error:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
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
    this.cdr.detectChanges();
  }

  closeForm() {
    this.isFormOpen = false;
    this.editingId = null;
    this.formData = this.initializeFormData();
    this.cdr.detectChanges();
  }

  openDeleteConfirm(extra: Extra) {
    this.deleteConfirmId = extra.id;
    this.deleteConfirmName = extra.name;
    this.isDeleteConfirmOpen = true;
    this.cdr.detectChanges();
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen = false;
    this.deleteConfirmId = null;
    this.deleteConfirmName = '';
    this.cdr.detectChanges();
  }

  async saveExtra() {
    if (!this.formData.name || this.formData.price < 0) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    try {
      if (this.editingId) {
        await this.extraService.update(this.editingId, this.formData);
        this.successMessage = 'Extra updated successfully';
      } else {
        await this.extraService.create(this.formData);
        this.successMessage = 'Extra created successfully';
      }
      await this.loadData();
      this.closeForm();
      setTimeout(() => (this.successMessage = ''), 3000);
    } catch (error) {
      this.errorMessage = 'Failed to save extra';
      console.error('Save error:', error);
    }
  }

  async confirmDelete() {
    if (!this.deleteConfirmId) return;

    try {
      await this.extraService.delete(this.deleteConfirmId);
      this.successMessage = 'Extra deleted successfully';
      await this.loadData();
      this.closeDeleteConfirm();
      setTimeout(() => (this.successMessage = ''), 3000);
    } catch (error) {
      this.errorMessage = 'Failed to delete extra';
      console.error('Delete error:', error);
    }
  }

  onBackToDashboard() {
    this.router.navigate(['/admin']);
  }
}
