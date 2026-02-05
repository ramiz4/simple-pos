import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../../application/services/product.service';
import { VariantService } from '../../../../application/services/variant.service';
import { Product } from '../../../../domain/entities/product.interface';
import { Variant } from '../../../../domain/entities/variant.interface';
import { ConfirmDeleteModalComponent } from '../../../components/admin/confirm-delete/confirm-delete.component';
import { ManagementListComponent } from '../../../components/admin/management-list/management-list.component';
import { AdminPageHeaderComponent } from '../../../components/admin/page-header/page-header.component';
import { AlertComponent } from '../../../components/shared/alert/alert.component';
import { ModalComponent } from '../../../components/shared/modal/modal.component';

@Component({
  selector: 'app-variants-management',
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
  templateUrl: './variants-management.component.html',
  styleUrls: ['./variants-management.component.css'],
})
export class VariantsManagementComponent implements OnInit, OnDestroy {
  variants: (Variant & { productName?: string; basePrice?: number; calculatedPrice?: number })[] =
    [];
  products: Product[] = [];
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
    private variantService: VariantService,
    private productService: ProductService,
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
      productId: 0,
      name: '',
      priceModifier: 0,
    };
  }

  async loadData() {
    this.isLoading = true;
    try {
      const [variants, products] = await Promise.all([
        this.variantService.getAll(),
        this.productService.getAll(),
      ]);

      this.products = products;

      // Enrich variants with product data
      this.variants = variants.map((v: Variant) => {
        const product = products.find((p: Product) => p.id === v.productId);
        return {
          ...v,
          productName: product?.name || 'Unknown Product',
          basePrice: product?.price || 0,
          calculatedPrice: (product?.price || 0) + v.priceModifier,
        };
      });

      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Failed to load variants data';
      console.error('Load error:', error);
    } finally {
      this.isLoading = false;
      if (!this.destroyed) {
        this.cdr.detectChanges();
      }
    }
  }

  openForm(
    variant?: Variant & { productName?: string; basePrice?: number; calculatedPrice?: number },
  ) {
    if (variant) {
      this.editingId = variant.id;
      this.formData = {
        productId: variant.productId,
        name: variant.name,
        priceModifier: variant.priceModifier,
      };
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

  openDeleteConfirm(variant: Variant) {
    this.deleteConfirmId = variant.id;
    this.deleteConfirmName = variant.name;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm() {
    this.isDeleteConfirmOpen = false;
    this.deleteConfirmId = null;
    this.deleteConfirmName = '';
  }

  async saveVariant() {
    if (!this.formData.productId || !this.formData.name) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    try {
      const isUpdate = !!this.editingId;
      if (this.editingId) {
        await this.variantService.update(this.editingId, this.formData);
      } else {
        await this.variantService.create(this.formData);
      }
      await this.loadData();
      this.closeForm();

      setTimeout(() => {
        if (this.destroyed) return;
        this.successMessage = isUpdate
          ? 'Variant updated successfully'
          : 'Variant created successfully';
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.destroyed) return;
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }, 0);
    } catch (error) {
      this.errorMessage = 'Failed to save variant';
      console.error('Save error:', error);
    }
  }

  async confirmDelete() {
    if (!this.deleteConfirmId) return;

    try {
      await this.variantService.delete(this.deleteConfirmId);
      await this.loadData();
      this.closeDeleteConfirm();

      setTimeout(() => {
        if (this.destroyed) return;
        this.successMessage = 'Variant deleted successfully';
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.destroyed) return;
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      }, 0);
    } catch (error) {
      this.errorMessage = 'Failed to delete variant';
      console.error('Delete error:', error);
    }
  }

  getGroupedVariants(): Map<
    number,
    (Variant & { productName?: string; basePrice?: number; calculatedPrice?: number })[]
  > {
    const grouped = new Map<
      number,
      (Variant & { productName?: string; basePrice?: number; calculatedPrice?: number })[]
    >();
    for (const variant of this.variants) {
      const group = grouped.get(variant.productId) || [];
      group.push(variant);
      grouped.set(variant.productId, group);
    }
    return grouped;
  }

  getProductName(productId: number): string {
    const product = this.products.find((p: Product) => p.id === productId);
    return product ? product.name : 'Unknown Product';
  }

  getCalculatedPrice(productId: number, priceModifier: number): number {
    const product = this.products.find((p: Product) => p.id === productId);
    return (product?.price || 0) + priceModifier;
  }
}
