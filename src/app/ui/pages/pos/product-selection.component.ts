import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../../application/services/cart.service';
import { CategoryService } from '../../../application/services/category.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { ExtraService } from '../../../application/services/extra.service';
import { ProductExtraService } from '../../../application/services/product-extra.service';
import { ProductService } from '../../../application/services/product.service';
import { TableService } from '../../../application/services/table.service';
import { VariantService } from '../../../application/services/variant.service';
import { CartItem } from '../../../domain/dtos/cart.dto';
import { Category } from '../../../domain/entities/category.interface';
import { Extra } from '../../../domain/entities/extra.interface';
import { Product } from '../../../domain/entities/product.interface';
import { Variant } from '../../../domain/entities/variant.interface';
import { HeaderComponent } from '../../components/header/header.component';

interface ProductWithExtras extends Product {
  availableExtras: Extra[];
}

@Component({
  selector: 'app-product-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <div class="min-h-screen bg-[#F8FAFC]">
      <app-header title="Menu" [showBackButton]="true" (back)="goBack()"></app-header>

      <main class="animate-fade-in pb-32">
        <!-- Category Navbar -->
        <div
          class="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-surface-100 overflow-x-auto no-scrollbar"
        >
          <div class="max-w-7xl mx-auto px-4 py-3 flex gap-3 min-w-max">
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

        <div class="max-w-7xl mx-auto px-4 py-6">
          <!-- Products Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            @for (product of filteredProducts(); track product.id) {
              <button
                (click)="openProductModal(product)"
                class="glass-card group flex flex-col items-start overflow-hidden hover:ring-2 hover:ring-primary-400 transition-all duration-300"
              >
                <div class="w-full aspect-4/3 relative overflow-hidden bg-surface-100">
                  <div
                    class="absolute inset-0 primary-gradient opacity-10 group-hover:opacity-20 transition-opacity"
                  ></div>
                  <div
                    class="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500"
                  >
                    🍽️
                  </div>
                </div>

                <div class="p-4 w-full text-left">
                  <h3 class="font-black text-surface-900 leading-tight mb-1 line-clamp-2">
                    {{ product.name }}
                  </h3>
                  <div class="flex items-center justify-between mt-auto">
                    <span class="text-lg font-black text-primary-600"
                      >€{{ product.price.toFixed(2) }}</span
                    >
                    <div
                      class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            }
          </div>

          @if (filteredProducts().length === 0) {
            <div class="text-center py-20">
              <div class="text-6xl mb-4">🍽️</div>
              <p class="text-surface-500 text-lg font-bold">Nothing here yet</p>
              <p class="text-surface-400">Try selecting a different category.</p>
            </div>
          }
        </div>
      </main>

      <!-- Modern Cart Summary Bar -->
      <div class="fixed bottom-0 left-0 right-0 z-40 px-4 pb-8 sm:pb-4 pointer-events-none">
        <div class="max-w-4xl mx-auto pointer-events-auto">
          <div
            class="glass-card bg-surface-900/90! backdrop-blur-2xl! border-white/10 p-4 shadow-2xl flex items-center justify-between gap-6 translate-y-0 animate-slide-up"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center text-white relative"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                @if (cartSummary().itemCount > 0) {
                  <span
                    class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 border-2 border-surface-900 text-[10px] font-black flex items-center justify-center text-white"
                  >
                    {{ cartSummary().itemCount }}
                  </span>
                }
              </div>
              <div>
                <div class="text-surface-400 text-[10px] font-black uppercase tracking-widest">
                  Subtotal
                </div>
                <div class="text-2xl font-black text-white leading-none">
                  €{{ cartSummary().subtotal.toFixed(2) }}
                </div>
              </div>
            </div>

            <button
              (click)="viewCart()"
              [disabled]="cartSummary().itemCount === 0"
              class="neo-button h-14 px-8 disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <span>View Cart</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Modern Product Modal -->
      @if (isModalOpen()) {
        <div
          class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in"
          (click)="closeModal()"
        >
          <div
            class="bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
            (click)="$event.stopPropagation()"
          >
            <!-- Modal Header -->
            <div class="relative h-48 sm:h-64 overflow-hidden shrink-0">
              <div class="absolute inset-0 primary-gradient opacity-20"></div>
              <div class="absolute inset-0 flex items-center justify-center text-8xl">🍽️</div>
              <button
                (click)="closeModal()"
                class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-2xl hover:bg-white/40 transition-colors"
              >
                ×
              </button>
            </div>

            <div class="p-8 overflow-y-auto grow">
              <div class="mb-8">
                <h2 class="text-3xl font-black text-surface-900 mb-1">
                  {{ selectedProduct()?.name }}
                </h2>
                <p class="text-primary-600 font-bold text-xl">
                  Base Price: €{{ (selectedProduct()?.price ?? 0).toFixed(2) }}
                </p>
              </div>

              <!-- Variants Selection -->
              @if (productVariants().length > 0) {
                <div class="mb-8">
                  <label
                    class="block text-xs font-black text-surface-400 uppercase tracking-widest mb-4"
                    >Choose Variant</label
                  >
                  <div class="grid grid-cols-1 gap-3">
                    @for (variant of productVariants(); track variant.id) {
                      <button
                        (click)="selectVariant(variant.id)"
                        [class]="
                          selectedVariantId() === variant.id
                            ? 'ring-2 ring-primary-600 bg-primary-50/50'
                            : 'bg-surface-50 hover:bg-surface-100'
                        "
                        class="flex items-center justify-between p-4 rounded-2xl transition-all text-left"
                      >
                        <span class="font-bold text-surface-900">{{ variant.name }}</span>
                        <span class="text-primary-600 font-bold"
                          >{{ variant.priceModifier >= 0 ? '+' : '' }}€{{
                            variant.priceModifier.toFixed(2)
                          }}</span
                        >
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Extras Selection -->
              @if (productExtras().length > 0) {
                <div class="mb-8">
                  <label
                    class="block text-xs font-black text-surface-400 uppercase tracking-widest mb-4"
                    >Add Extras</label
                  >
                  <div class="grid grid-cols-1 gap-3">
                    @for (extra of productExtras(); track extra.id) {
                      <button
                        (click)="toggleExtra(extra.id)"
                        [class]="
                          isExtraSelected(extra.id)
                            ? 'ring-2 ring-primary-600 bg-primary-50/50'
                            : 'bg-surface-50 hover:bg-surface-100'
                        "
                        class="flex items-center justify-between p-4 rounded-2xl transition-all text-left"
                      >
                        <span class="font-bold text-surface-900">{{ extra.name }}</span>
                        <span class="text-primary-600 font-bold"
                          >+€{{ extra.price.toFixed(2) }}</span
                        >
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Quantity & Notes -->
              <div class="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label
                    class="block text-xs font-black text-surface-400 uppercase tracking-widest mb-4"
                    >Quantity</label
                  >
                  <div class="flex items-center gap-3 bg-surface-50 p-2 rounded-2xl">
                    <button
                      (click)="decrementQuantity()"
                      class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-primary-600 active:scale-95 transition-transform"
                    >
                      −
                    </button>
                    <span class="grow text-center font-black text-xl">{{ quantity() }}</span>
                    <button
                      (click)="incrementQuantity()"
                      class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-primary-600 active:scale-95 transition-transform"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    class="block text-xs font-black text-surface-400 uppercase tracking-widest mb-4"
                    >Notes</label
                  >
                  <input
                    type="text"
                    [ngModel]="notes()"
                    (ngModelChange)="notes.set($event)"
                    placeholder="Add instruction..."
                    class="w-full h-14 px-4 bg-surface-50 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:outline-none font-medium placeholder:text-surface-300"
                  />
                </div>
              </div>

              <!-- Price Summary & Add Button -->
              <div
                class="mt-auto pt-6 border-t border-surface-100 flex items-center justify-between gap-6"
              >
                <div>
                  <div class="text-surface-400 text-[10px] font-black uppercase tracking-widest">
                    Total Price
                  </div>
                  <div class="text-3xl font-black text-surface-900">
                    €{{ (calculatedUnitPrice() * quantity()).toFixed(2) }}
                  </div>
                </div>
                <button (click)="addToCart()" class="neo-button h-16 grow text-lg">
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
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
  isModalOpen = signal(false);
  selectedProduct = signal<ProductWithExtras | null>(null);
  productVariants = signal<Variant[]>([]);
  productExtras = signal<Extra[]>([]);

  // Modal form state
  selectedVariantId = signal<number | null>(null);
  selectedExtraIds = signal<number[]>([]);
  quantity = signal(1);
  notes = signal('');

  // Computed signals
  activeCategories = computed(() =>
    this.categories()
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );

  filteredProducts = computed(() => {
    const categoryId = this.selectedCategoryId();
    const products = this.products();

    if (!categoryId) return [];

    return products.filter((p) => p.categoryId === categoryId && p.isAvailable);
  });

  calculatedUnitPrice = computed(() => {
    const product = this.selectedProduct();
    if (!product) return 0;

    let price = product.price;

    // Add variant modifier
    const variantId = this.selectedVariantId();
    if (variantId) {
      const variant = this.productVariants().find((v) => v.id === variantId);
      if (variant) {
        price += variant.priceModifier;
      }
    }

    // Add extras
    const extraIds = this.selectedExtraIds();
    const extras = this.productExtras().filter((e) => extraIds.includes(e.id));
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
    private cartService: CartService,
    private tableService: TableService,
    private enumMappingService: EnumMappingService,
  ) {}

  async ngOnInit(): Promise<void> {
    // Get query params
    this.route.queryParams.subscribe((params) => {
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
        this.extraService.getAll(),
      ]);

      this.categories.set(categories);
      this.allExtras.set(extras);

      // Load extras for each product
      const productsWithExtras = await Promise.all(
        products.map(async (product) => {
          const productExtras = await this.productExtraService.getByProduct(product.id);
          const availableExtras = extras.filter((extra) =>
            productExtras.some((pe) => pe.extraId === extra.id),
          );
          return { ...product, availableExtras };
        }),
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
    const baseClass =
      'px-6 py-2 rounded-full font-black text-sm transition-all duration-300 whitespace-nowrap uppercase tracking-wider';

    if (isSelected) {
      return `${baseClass} primary-gradient text-white shadow-lg shadow-primary-200 scale-105`;
    }
    return `${baseClass} text-surface-400 hover:text-surface-900 hover:bg-surface-50`;
  }

  async openProductModal(product: ProductWithExtras): Promise<void> {
    this.isModalOpen.set(true);
    this.selectedProduct.set(product);
    this.productExtras.set(product.availableExtras);

    // Load variants for the product
    const variants = await this.variantService.getByProduct(product.id);
    this.productVariants.set(variants);

    // Reset form state
    this.selectedVariantId.set(null);
    this.selectedExtraIds.set([]);
    this.quantity.set(1);
    this.notes.set('');
  }

  closeModal(): void {
    this.isModalOpen.set(false);
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
      this.selectedExtraIds.set(currentIds.filter((id) => id !== extraId));
    } else {
      this.selectedExtraIds.set([...currentIds, extraId]);
    }
  }

  isExtraSelected(extraId: number): boolean {
    return this.selectedExtraIds().includes(extraId);
  }

  incrementQuantity(): void {
    this.quantity.update((q) => q + 1);
  }

  decrementQuantity(): void {
    this.quantity.update((q) => (q > 1 ? q - 1 : q));
  }

  addToCart(): void {
    const product = this.selectedProduct();
    if (!product) return;

    const variantId = this.selectedVariantId();
    const variant = variantId ? this.productVariants().find((v) => v.id === variantId) : null;

    const extraIds = this.selectedExtraIds();
    const extras = this.productExtras().filter((e) => extraIds.includes(e.id));

    const unitPrice = this.calculatedUnitPrice();
    const lineTotal = unitPrice * this.quantity();

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      variantPriceModifier: variant?.priceModifier ?? 0,
      quantity: this.quantity(),
      extraIds: extras.map((e) => e.id),
      extraNames: extras.map((e) => e.name),
      extraPrices: extras.map((e) => e.price),
      unitPrice,
      lineTotal,
      notes: this.notes().trim() || null,
    };

    this.cartService.addItem(cartItem);

    // Update table status if this is a dine-in order
    this.updateTableStatusIfNecessary();

    this.closeModal();
  }

  private async updateTableStatusIfNecessary(): Promise<void> {
    if (this.tableId) {
      try {
        const table = await this.tableService.getById(this.tableId);
        const freeStatusId = await this.enumMappingService.getCodeTableId('TABLE_STATUS', 'FREE');

        if (table && table.statusId === freeStatusId) {
          const occupiedStatusId = await this.enumMappingService.getCodeTableId(
            'TABLE_STATUS',
            'OCCUPIED',
          );
          await this.tableService.updateTableStatus(this.tableId, occupiedStatusId);
        }
      } catch (error) {
        console.error('Error updating table status:', error);
      }
    }
  }

  viewCart(): void {
    this.router.navigate(['/pos/cart'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId,
      },
    });
  }

  goBack(): void {
    if (this.typeId) {
      this.router.navigate(['/pos/table-selection'], {
        queryParams: { typeId: this.typeId },
      });
    } else {
      this.router.navigate(['/pos/order-type']);
    }
  }
}
