import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../application/services/category.service';
import { ProductService } from '../../../application/services/product.service';
import { VariantService } from '../../../application/services/variant.service';
import { ExtraService } from '../../../application/services/extra.service';
import { ProductExtraService } from '../../../application/services/product-extra.service';
import { CartService } from '../../../application/services/cart.service';
import { Category } from '../../../domain/entities/category.interface';
import { Product } from '../../../domain/entities/product.interface';
import { Variant } from '../../../domain/entities/variant.interface';
import { Extra } from '../../../domain/entities/extra.interface';
import { CartItem } from '../../../domain/dtos/cart.dto';

interface ProductWithExtras extends Product {
  availableExtras: Extra[];
}

@Component({
  selector: 'app-product-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 pb-32">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Select Products
          </h1>
          <p class="text-gray-600">Choose items for your order</p>
        </div>

        <!-- Category Tabs -->
        <div class="mb-6 overflow-x-auto pb-2">
          <div class="flex gap-2 min-w-max">
            @for (category of activeCategories(); track category.id) {
              <button
                (click)="selectCategory(category.id)"
                [class]="getCategoryButtonClass(category.id)"
              >
                {{ category.name }}
              </button>
            }
          </div>
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          @for (product of filteredProducts(); track product.id) {
            <button
              (click)="openProductModal(product)"
              class="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-purple-200 hover:border-purple-400"
            >
              <div class="flex flex-col items-center">
                <!-- Image Placeholder -->
                <div class="w-full aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl mb-3 flex items-center justify-center">
                  <span class="text-5xl">🍽️</span>
                </div>
                <!-- Product Info -->
                <h3 class="text-lg font-bold text-gray-800 mb-1 text-center line-clamp-2">{{ product.name }}</h3>
                <p class="text-xl font-bold text-purple-600">€{{ product.price.toFixed(2) }}</p>
              </div>
            </button>
          }
        </div>

        @if (filteredProducts().length === 0) {
          <div class="text-center py-12">
            <p class="text-gray-500 text-lg">No products available in this category</p>
          </div>
        }

        <!-- Back Button -->
        <div class="mt-8 text-center">
          <button
            (click)="goBack()"
            class="px-6 py-3 rounded-xl bg-white/80 backdrop-blur-md text-gray-700 hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg"
          >
            ← Back
          </button>
        </div>
      </div>

      <!-- Cart Summary Bar (Fixed Bottom) -->
      <div class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t-2 border-purple-200 shadow-2xl p-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div class="flex-1">
            <div class="text-sm text-gray-600">{{ cartSummary().itemCount }} items</div>
            <div class="text-2xl font-bold text-purple-600">€{{ cartSummary().subtotal.toFixed(2) }}</div>
          </div>
          <button
            (click)="viewCart()"
            [disabled]="cartSummary().itemCount === 0"
            class="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            View Cart →
          </button>
        </div>
      </div>

      <!-- Product Configuration Modal -->
      @if (isModalOpen) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" (click)="closeModal()">
          <div class="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-6">
              <!-- Modal Header -->
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h2 class="text-2xl font-bold text-gray-800 mb-1">{{ selectedProduct()?.name }}</h2>
                  <p class="text-lg text-purple-600 font-semibold">Base: €{{ (selectedProduct()?.price ?? 0).toFixed(2) }}</p>
                </div>
                <button
                  (click)="closeModal()"
                  class="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              <!-- Variants Selection -->
              @if (productVariants().length > 0) {
                <div class="mb-6">
                  <label class="block text-sm font-semibold text-gray-700 mb-3">Select Variant</label>
                  <div class="space-y-2">
                    @for (variant of productVariants(); track variant.id) {
                      <label class="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                        [class.border-purple-500]="selectedVariantId() === variant.id"
                        [class.bg-purple-50]="selectedVariantId() === variant.id"
                        [class.border-gray-200]="selectedVariantId() !== variant.id"
                        [class.hover:border-purple-300]="selectedVariantId() !== variant.id"
                      >
                        <input
                          type="radio"
                          [value]="variant.id"
                          [checked]="selectedVariantId() === variant.id"
                          (change)="selectVariant(variant.id)"
                          class="w-4 h-4 text-purple-600"
                        />
                        <span class="flex-1 font-medium text-gray-800">{{ variant.name }}</span>
                        <span class="text-purple-600 font-semibold">
                          {{ variant.priceModifier >= 0 ? '+' : '' }}€{{ variant.priceModifier.toFixed(2) }}
                        </span>
                      </label>
                    }
                  </div>
                </div>
              }

              <!-- Extras Selection -->
              @if (productExtras().length > 0) {
                <div class="mb-6">
                  <label class="block text-sm font-semibold text-gray-700 mb-3">Add Extras</label>
                  <div class="space-y-2">
                    @for (extra of productExtras(); track extra.id) {
                      <label class="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                        [class.border-purple-500]="isExtraSelected(extra.id)"
                        [class.bg-purple-50]="isExtraSelected(extra.id)"
                        [class.border-gray-200]="!isExtraSelected(extra.id)"
                        [class.hover:border-purple-300]="!isExtraSelected(extra.id)"
                      >
                        <input
                          type="checkbox"
                          [checked]="isExtraSelected(extra.id)"
                          (change)="toggleExtra(extra.id)"
                          class="w-4 h-4 text-purple-600 rounded"
                        />
                        <span class="flex-1 font-medium text-gray-800">{{ extra.name }}</span>
                        <span class="text-purple-600 font-semibold">+€{{ extra.price.toFixed(2) }}</span>
                      </label>
                    }
                  </div>
                </div>
              }

              <!-- Quantity Input -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-3">Quantity</label>
                <div class="flex items-center gap-4">
                  <button
                    (click)="decrementQuantity()"
                    class="w-12 h-12 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-600 font-bold text-xl transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    [(ngModel)]="quantity"
                    min="1"
                    class="flex-1 text-center text-2xl font-bold py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    (click)="incrementQuantity()"
                    class="w-12 h-12 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-600 font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Notes Textarea -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-3">Special Instructions (Optional)</label>
                <textarea
                  [(ngModel)]="notes"
                  rows="3"
                  placeholder="Add any special requests..."
                  class="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                ></textarea>
              </div>

              <!-- Price Summary -->
              <div class="mb-6 p-4 bg-purple-50 rounded-xl">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-gray-600">Unit Price:</span>
                  <span class="font-semibold text-gray-800">€{{ calculatedUnitPrice().toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center text-lg font-bold">
                  <span class="text-gray-800">Total:</span>
                  <span class="text-purple-600">€{{ (calculatedUnitPrice() * quantity).toFixed(2) }}</span>
                </div>
              </div>

              <!-- Add to Cart Button -->
              <button
                (click)="addToCart()"
                class="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductSelectionComponent implements OnInit {
  // Query params
  private typeId?: number;
  private tableId?: number;

  // Data signals
  categories = signal<Category[]>([]);
  products = signal<ProductWithExtras[]>([]);
  allExtras = signal<Extra[]>([]);
  
  // UI state signals
  selectedCategoryId = signal<number | null>(null);
  isModalOpen = false;
  selectedProduct = signal<ProductWithExtras | null>(null);
  productVariants = signal<Variant[]>([]);
  productExtras = signal<Extra[]>([]);
  
  // Modal form state
  selectedVariantId = signal<number | null>(null);
  selectedExtraIds = signal<number[]>([]);
  quantity = 1;
  notes = '';

  // Computed signals
  activeCategories = computed(() => 
    this.categories()
      .filter(c => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  );

  filteredProducts = computed(() => {
    const categoryId = this.selectedCategoryId();
    const products = this.products();
    
    if (!categoryId) return [];
    
    return products.filter(p => 
      p.categoryId === categoryId && p.isAvailable
    );
  });

  calculatedUnitPrice = computed(() => {
    const product = this.selectedProduct();
    if (!product) return 0;

    let price = product.price;

    // Add variant modifier
    const variantId = this.selectedVariantId();
    if (variantId) {
      const variant = this.productVariants().find(v => v.id === variantId);
      if (variant) {
        price += variant.priceModifier;
      }
    }

    // Add extras
    const extraIds = this.selectedExtraIds();
    const extras = this.productExtras().filter(e => extraIds.includes(e.id));
    price += extras.reduce((sum, extra) => sum + extra.price, 0);

    return price;
  });

  cartSummary = computed(() => this.cartService.getSummary());

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private productService: ProductService,
    private variantService: VariantService,
    private extraService: ExtraService,
    private productExtraService: ProductExtraService,
    private cartService: CartService
  ) {}

  async ngOnInit(): Promise<void> {
    // Get query params
    this.route.queryParams.subscribe(params => {
      this.typeId = params['typeId'] ? +params['typeId'] : undefined;
      this.tableId = params['tableId'] ? +params['tableId'] : undefined;
    });

    await this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      // Load all data
      const [categories, products, extras] = await Promise.all([
        this.categoryService.getAll(),
        this.productService.getAll(),
        this.extraService.getAll()
      ]);

      this.categories.set(categories);
      this.allExtras.set(extras);

      // Load extras for each product
      const productsWithExtras = await Promise.all(
        products.map(async (product) => {
          const productExtras = await this.productExtraService.getByProduct(product.id);
          const availableExtras = extras.filter(extra => 
            productExtras.some(pe => pe.extraId === extra.id)
          );
          return { ...product, availableExtras };
        })
      );

      this.products.set(productsWithExtras);

      // Select first active category by default
      const firstCategory = this.activeCategories()[0];
      if (firstCategory) {
        this.selectedCategoryId.set(firstCategory.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  selectCategory(categoryId: number): void {
    this.selectedCategoryId.set(categoryId);
  }

  getCategoryButtonClass(categoryId: number): string {
    const isSelected = this.selectedCategoryId() === categoryId;
    const baseClass = 'px-6 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap';
    
    if (isSelected) {
      return `${baseClass} bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg`;
    }
    return `${baseClass} bg-white/80 backdrop-blur-md text-gray-700 hover:bg-white shadow-md hover:shadow-lg`;
  }

  async openProductModal(product: ProductWithExtras): Promise<void> {
    this.selectedProduct.set(product);
    this.productExtras.set(product.availableExtras);
    
    // Load variants for the product
    const variants = await this.variantService.getByProduct(product.id);
    this.productVariants.set(variants);
    
    // Reset form state
    this.selectedVariantId.set(null);
    this.selectedExtraIds.set([]);
    this.quantity = 1;
    this.notes = '';
    
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct.set(null);
    this.productVariants.set([]);
    this.productExtras.set([]);
  }

  selectVariant(variantId: number): void {
    this.selectedVariantId.set(variantId);
  }

  toggleExtra(extraId: number): void {
    const currentIds = this.selectedExtraIds();
    if (currentIds.includes(extraId)) {
      this.selectedExtraIds.set(currentIds.filter(id => id !== extraId));
    } else {
      this.selectedExtraIds.set([...currentIds, extraId]);
    }
  }

  isExtraSelected(extraId: number): boolean {
    return this.selectedExtraIds().includes(extraId);
  }

  incrementQuantity(): void {
    this.quantity++;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    const product = this.selectedProduct();
    if (!product) return;

    const variantId = this.selectedVariantId();
    const variant = variantId ? this.productVariants().find(v => v.id === variantId) : null;
    
    const extraIds = this.selectedExtraIds();
    const extras = this.productExtras().filter(e => extraIds.includes(e.id));

    const unitPrice = this.calculatedUnitPrice();
    const lineTotal = unitPrice * this.quantity;

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      variantPriceModifier: variant?.priceModifier ?? 0,
      quantity: this.quantity,
      extraIds: extras.map(e => e.id),
      extraNames: extras.map(e => e.name),
      extraPrices: extras.map(e => e.price),
      unitPrice,
      lineTotal,
      notes: this.notes.trim() || null
    };

    this.cartService.addItem(cartItem);
    this.closeModal();
  }

  viewCart(): void {
    this.router.navigate(['/pos/cart'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId
      }
    });
  }

  goBack(): void {
    if (this.typeId) {
      this.router.navigate(['/pos/table-selection'], {
        queryParams: { typeId: this.typeId }
      });
    } else {
      this.router.navigate(['/pos/order-type']);
    }
  }
}
