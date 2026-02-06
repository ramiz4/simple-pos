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
import { ButtonComponent } from '../../components/shared/button/button.component';

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
    ButtonComponent,
  ],
  templateUrl: './product-selection.component.html',
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
    let products = this.products();

    if (!categoryId) return [];

    products = products.concat(products).concat(products).concat(products).concat(products);

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
