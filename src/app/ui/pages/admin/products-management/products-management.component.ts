import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../../../application/services/category.service';
import { ProductService } from '../../../../application/services/product.service';
import { Category } from '../../../../domain/entities/category.interface';
import { Product } from '../../../../domain/entities/product.interface';
import { ConfirmDeleteModalComponent } from '../../../components/admin/confirm-delete/confirm-delete.component';
import { ManagementListComponent } from '../../../components/admin/management-list/management-list.component';
import { AdminPageHeaderComponent } from '../../../components/admin/page-header/page-header.component';
import { AlertComponent } from '../../../components/shared/alert/alert.component';
import { ModalComponent } from '../../../components/shared/modal/modal.component';

@Component({
  selector: 'app-products-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AlertComponent,
    ModalComponent,
    AdminPageHeaderComponent,
    ManagementListComponent,
    ConfirmDeleteModalComponent,
  ],
  templateUrl: './products-management.component.html',
  styleUrls: ['./products-management.component.css'],
})
export class ProductsManagementComponent implements OnInit, OnDestroy {
  products: Product[] = [];
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

  private destroyed = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
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
      categoryId: 0,
      price: 0,
      stock: 0,
      isAvailable: true,
    };
  }

  async loadData() {
    this.isLoading = true;
    try {
      const [products, categories] = await Promise.all([
        this.productService.getAll(),
        this.categoryService.getAll(),
      ]);
      this.products = products;
      this.categories = categories;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to load products data';
      console.error('Load error:', error);
    } finally {
      this.isLoading = false;
      if (!this.destroyed) {
        this.cdr.detectChanges();
      }
    }
  }

  openForm(product?: Product) {
    if (product) {
      this.editingId = product.id;
      this.formData = { ...product };
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

  openDeleteConfirm(product: Product) {
    this.deleteConfirmId = product.id;
    this.deleteConfirmName = product.name;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen = false;
    this.deleteConfirmId = null;
    this.deleteConfirmName = '';
  }

  async saveProduct() {
    if (!this.formData.name || !this.formData.categoryId || this.formData.price < 0) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    try {
      const isUpdate = !!this.editingId;
      if (this.editingId) {
        await this.productService.update(this.editingId, this.formData);
      } else {
        await this.productService.create(this.formData);
      }
      await this.loadData();
      this.closeForm();

      setTimeout(() => {
        if (this.destroyed) return;
        this.successMessage = isUpdate
          ? 'Product updated successfully'
          : 'Product created successfully';
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.destroyed) return;
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }, 0);
    } catch (error) {
      this.errorMessage = 'Failed to save product';
      console.error('Save error:', error);
    }
  }

  async confirmDelete() {
    if (!this.deleteConfirmId) return;

    try {
      await this.productService.delete(this.deleteConfirmId);
      await this.loadData();
      this.closeDeleteConfirm();

      setTimeout(() => {
        if (this.destroyed) return;
        this.successMessage = 'Product deleted successfully';
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.destroyed) return;
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }, 0);
    } catch (error) {
      this.errorMessage = 'Failed to delete product';
      console.error('Delete error:', error);
    }
  }

  async toggleAvailability(product: Product) {
    try {
      await this.productService.toggleAvailability(product.id);
      await this.loadData();
    } catch (error) {
      this.errorMessage = 'Failed to toggle availability';
      console.error('Toggle error:', error);
    }
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }
}
