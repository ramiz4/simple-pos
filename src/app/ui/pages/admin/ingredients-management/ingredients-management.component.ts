import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Ingredient } from '../../../../domain/entities/ingredient.interface';
import { IngredientService } from '../../../../application/services/ingredient.service';

@Component({
  selector: 'app-ingredients-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ingredients-management.component.html',
  styleUrls: ['./ingredients-management.component.css']
})
export class IngredientsManagementComponent implements OnInit, OnDestroy {
  ingredients: Ingredient[] = [];
  isLoading = false;
  isFormOpen = false;
  isDeleteConfirmOpen = false;
  successMessage = '';
  errorMessage = '';

  editingId: number | null = null;
  formData = this.initializeFormData();

  deleteConfirmId: number | null = null;
  deleteConfirmName = '';

  readonly LOW_STOCK_THRESHOLD = 5;

  private destroyed = false;

  constructor(
    private ingredientService: IngredientService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
      stockQuantity: 0,
      unit: ''
    };
  }

  async loadData() {
    this.isLoading = true;
    try {
      const ingredients = await this.ingredientService.getAll();
      this.ingredients = ingredients.sort((a, b) => a.name.localeCompare(b.name));
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to load ingredients data';
      console.error('Load error:', error);
    } finally {
      this.isLoading = false;
      if (!this.destroyed) {
        this.cdr.detectChanges();
      }
    }
  }

  openForm(ingredient?: Ingredient) {
    if (ingredient) {
      this.editingId = ingredient.id;
      this.formData = { ...ingredient };
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

  openDeleteConfirm(ingredient: Ingredient) {
    this.deleteConfirmId = ingredient.id;
    this.deleteConfirmName = ingredient.name;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen = false;
    this.deleteConfirmId = null;
    this.deleteConfirmName = '';
  }

  async saveIngredient() {
    if (!this.formData.name || this.formData.stockQuantity < 0 || !this.formData.unit) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    try {
      if (this.editingId) {
        await this.ingredientService.update(this.editingId, this.formData);
        this.successMessage = 'Ingredient updated successfully';
      } else {
        await this.ingredientService.create(this.formData);
        this.successMessage = 'Ingredient created successfully';
      }
      await this.loadData();
      this.closeForm();
      setTimeout(() => (this.successMessage = ''), 3000);
    } catch (error) {
      this.errorMessage = 'Failed to save ingredient';
      console.error('Save error:', error);
    }
  }

  async confirmDelete() {
    if (!this.deleteConfirmId) return;

    try {
      await this.ingredientService.delete(this.deleteConfirmId);
      this.successMessage = 'Ingredient deleted successfully';
      await this.loadData();
      this.closeDeleteConfirm();
      setTimeout(() => (this.successMessage = ''), 3000);
    } catch (error) {
      this.errorMessage = 'Failed to delete ingredient';
      console.error('Delete error:', error);
    }
  }

  isLowStock(ingredient: Ingredient): boolean {
    return ingredient.stockQuantity <= this.LOW_STOCK_THRESHOLD;
  }

  getStockStatusIcon(ingredient: Ingredient): string {
    if (ingredient.stockQuantity <= 0) {
      return '⚠️'; // Out of stock
    } else if (ingredient.stockQuantity <= this.LOW_STOCK_THRESHOLD) {
      return '⚡'; // Low stock
    }
    return '✓'; // Good stock
  }

  getStockStatusLabel(ingredient: Ingredient): string {
    if (ingredient.stockQuantity <= 0) {
      return 'Out of Stock';
    } else if (ingredient.stockQuantity <= this.LOW_STOCK_THRESHOLD) {
      return 'Low Stock';
    }
    return 'In Stock';
  }

  onBackToDashboard() {
    this.router.navigate(['/admin']);
  }
}
