import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../../../domain/entities/product.interface';
import { Category } from '../../../../domain/entities/category.interface';
import { ProductService } from '../../../../application/services/product.service';
import { CategoryService } from '../../../../application/services/category.service';

@Component({
  selector: 'app-products-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products-management.component.html',
  styleUrls: ['./products-management.component.css']
})
export class ProductsManagementComponent implements OnInit {
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

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private initializeFormData() {
    return {
      name: '',
      categoryId: 0,
      price: 0,
      stock: 0,
      isAvailable: true
    };
  }

  async loadData() {
    this.isLoading = true;
    try {
      const [products, categories] = await Promise.all([
        this.productService.getAll(),
        this.categoryService.getAll()
      ]);
      this.products = products;
      this.categories = categories;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to load products data';
      console.error('Load error:', error);
    } finally {
      this.isLoading = false;
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
      if (this.editingId) {
        await this.productService.update(this.editingId, this.formData);
        this.successMessage = 'Product updated successfully';
      } else {
        await this.productService.create(this.formData);
        this.successMessage = 'Product created successfully';
      }
      await this.loadData();
      this.closeForm();
      setTimeout(() => (this.successMessage = ''), 3000);
    } catch (error) {
      this.errorMessage = 'Failed to save product';
      console.error('Save error:', error);
    }
  }

  async confirmDelete() {
    if (!this.deleteConfirmId) return;

    try {
      await this.productService.delete(this.deleteConfirmId);
      this.successMessage = 'Product deleted successfully';
      await this.loadData();
      this.closeDeleteConfirm();
      setTimeout(() => (this.successMessage = ''), 3000);
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
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  onBackToDashboard() {
    this.router.navigate(['/admin']);
  }
}
