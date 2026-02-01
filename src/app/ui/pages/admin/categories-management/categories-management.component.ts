import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Category } from '../../../../domain/entities/category.interface';
import { CategoryService } from '../../../../application/services/category.service';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './categories-management.component.html',
  styleUrls: ['./categories-management.component.css']
})
export class CategoriesManagementComponent implements OnInit {
  categories: Category[] = [];
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
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private initializeFormData() {
    return {
      name: '',
      sortOrder: 0,
      isActive: true
    };
  }

  async loadData() {
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      let categories = await this.categoryService.getAll();
      categories = categories.sort((a, b) => a.sortOrder - b.sortOrder);
      this.categories = categories;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to load categories data';
      console.error('Load error:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  openForm(category?: Category) {
    if (category) {
      this.editingId = category.id;
      this.formData = { ...category };
    } else {
      this.editingId = null;
      this.formData = this.initializeFormData();
      this.formData.sortOrder = this.categories.length + 1;
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

  openDeleteConfirm(category: Category) {
    this.deleteConfirmId = category.id;
    this.deleteConfirmName = category.name;
    this.isDeleteConfirmOpen = true;
    this.cdr.detectChanges();
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen = false;
    this.deleteConfirmId = null;
    this.deleteConfirmName = '';
    this.cdr.detectChanges();
  }

  async saveCategory() {
    if (!this.formData.name) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    try {
      if (this.editingId) {
        await this.categoryService.update(this.editingId, this.formData);
        this.successMessage = 'Category updated successfully';
      } else {
        await this.categoryService.create(this.formData);
        this.successMessage = 'Category created successfully';
      }
      await this.loadData();
      this.closeForm();
      setTimeout(() => (this.successMessage = ''), 3000);
    } catch (error) {
      this.errorMessage = 'Failed to save category';
      console.error('Save error:', error);
    }
  }

  async confirmDelete() {
    if (!this.deleteConfirmId) return;

    try {
      await this.categoryService.delete(this.deleteConfirmId);
      this.successMessage = 'Category deleted successfully';
      await this.loadData();
      this.closeDeleteConfirm();
      setTimeout(() => (this.successMessage = ''), 3000);
    } catch (error) {
      this.errorMessage = 'Failed to delete category';
      console.error('Delete error:', error);
    }
  }

  async moveUp(category: Category) {
    const index = this.categories.findIndex(c => c.id === category.id);
    if (index > 0) {
      const prev = this.categories[index - 1];
      // Optimistic UI update for better UX
      const tempCategories = [...this.categories];
      [tempCategories[index], tempCategories[index - 1]] = [tempCategories[index - 1], tempCategories[index]];
      this.categories = tempCategories;
      
      try {
        // Swap sortOrder values
        const tempSortOrder = category.sortOrder;
        await Promise.all([
          this.categoryService.update(category.id, { sortOrder: prev.sortOrder }),
          this.categoryService.update(prev.id, { sortOrder: tempSortOrder })
        ]);
      } catch (error) {
        this.errorMessage = 'Failed to reorder categories';
        console.error('Reorder error:', error);
        // Reload on error to restore consistency
        await this.loadData();
      }
    }
  }

  async moveDown(category: Category) {
    const index = this.categories.findIndex(c => c.id === category.id);
    if (index < this.categories.length - 1) {
      const next = this.categories[index + 1];
      // Optimistic UI update for better UX
      const tempCategories = [...this.categories];
      [tempCategories[index], tempCategories[index + 1]] = [tempCategories[index + 1], tempCategories[index]];
      this.categories = tempCategories;
      
      try {
        // Swap sortOrder values
        const tempSortOrder = category.sortOrder;
        await Promise.all([
          this.categoryService.update(category.id, { sortOrder: next.sortOrder }),
          this.categoryService.update(next.id, { sortOrder: tempSortOrder })
        ]);
      } catch (error) {
        this.errorMessage = 'Failed to reorder categories';
        console.error('Reorder error:', error);
        // Reload on error to restore consistency
        await this.loadData();
      }
    }
  }

  onBackToDashboard() {
    this.router.navigate(['/admin']);
  }
}
