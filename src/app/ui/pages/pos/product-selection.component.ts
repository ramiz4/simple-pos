import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../../application/services/cart.service';
import { CategoryService } from '../../../application/services/category.service';
import { EnumMappingService } from '../../../application/services/enum-mapping.service';
import { ExtraService } from '../../../application/services/extra.service';
import { OrderService } from '../../../application/services/order.service';
import { ProductExtraService } from '../../../application/services/product-extra.service';
import { ProductService } from '../../../application/services/product.service';
import { TableService } from '../../../application/services/table.service';
import { VariantService } from '../../../application/services/variant.service';
import { CartItem } from '../../../domain/dtos/cart.dto';
import { Order, Variant } from '../../../domain/entities';
import { Category } from '../../../domain/entities/category.interface';
import { Extra } from '../../../domain/entities/extra.interface';
import { Product } from '../../../domain/entities/product.interface';
import { ProductCardComponent } from '../../components/pos/product-card/product-card.component';
import { QuantitySelectorComponent } from '../../components/pos/quantity-selector/quantity-selector.component';
import { StatusBarComponent } from '../../components/pos/status-bar/status-bar.component';

interface ProductWithExtras extends Product {
  availableExtras: Extra[];
}

@Component({
  selector: 'app-product-selection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
    QuantitySelectorComponent,
    StatusBarComponent,
  ],
  template: `
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
            <app-product-card
              [product]="product"
              (select)="openProductModal($any($event))"
            ></app-product-card>
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
    <app-status-bar
      [itemCount]="totalItemCount()"
      [subtotal]="displaySubtotal()"
      [buttonLabel]="existingOrder() ? 'Manage Order' : 'View Cart'"
      [canBeEmpty]="!!existingOrder()"
      (action)="viewCart()"
    ></app-status-bar>

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
                      <span class="text-primary-600 font-bold">+€{{ extra.price.toFixed(2) }}</span>
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
                <app-quantity-selector
                  [quantity]="quantity()"
                  (increase)="incrementQuantity()"
                  (decrease)="decrementQuantity()"
                ></app-quantity-selector>
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
  `,
})
export class ProductSelectionComponent implements OnInit {
  // Query params
  private typeId?: number;
  private tableId?: number;
  private orderId?: number;

  // Data signals
  categories = signal<Category[]>([]);
  products = signal<ProductWithExtras[]>([]);
  allExtras = signal<Extra[]>([]);
  existingOrder = signal<Order | null>(null);
  existingOrderItemCount = signal(0);

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

  displaySubtotal = computed(() => {
    const cartSubtotal = this.cartSummary().subtotal;
    const existingTotal = this.existingOrder()?.subtotal ?? 0;
    return cartSubtotal + existingTotal;
  });

  totalItemCount = computed(() => {
    return this.cartSummary().itemCount + this.existingOrderItemCount();
  });

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
    private orderService: OrderService,
  ) {}

  async ngOnInit(): Promise<void> {
    // Get query params and load data
    this.route.queryParams.subscribe(async (params) => {
      this.typeId = params['typeId'] ? +params['typeId'] : undefined;
      this.tableId = params['tableId'] ? +params['tableId'] : undefined;
      this.orderId = params['orderId'] ? +params['orderId'] : undefined;

      // Ensure context is set in case of direct navigation or refresh
      if (this.tableId) {
        this.cartService.setContext(this.tableId);
      } else if (this.typeId) {
        // Handle other types if necessary
      }

      await this.loadData();
    });
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

      // Load existing order if tableId or orderId is present
      if (this.orderId) {
        const order = await this.orderService.getOrderById(this.orderId);
        this.existingOrder.set(order);
      } else if (this.tableId) {
        const order = await this.orderService.getOpenOrderByTable(this.tableId);
        this.existingOrder.set(order);
      }

      const order = this.existingOrder();
      if (order) {
        // Ensure we track the ID if we loaded by table
        this.orderId = order.id;
        const items = await this.orderService.getOrderItems(order.id);
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        this.existingOrderItemCount.set(count);
      } else {
        this.existingOrderItemCount.set(0);
      }

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
      return `${baseClass} primary-gradient text-white shadow-md shadow-primary-100 scale-105`;
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
    this.closeModal();
  }

  viewCart(): void {
    this.router.navigate(['/pos/cart'], {
      queryParams: {
        typeId: this.typeId,
        tableId: this.tableId,
        orderId: this.orderId,
      },
    });
  }
}
