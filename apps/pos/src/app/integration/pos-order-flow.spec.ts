import { TestBed } from '@angular/core/testing';
import { TAX_RATE } from '@simple-pos/domain';
import {
  CartItem,
  OrderStatusEnum,
  OrderTypeEnum,
  TableStatusEnum,
} from '@simple-pos/shared/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { CartService } from '../application/services/cart.service';
import { CategoryService } from '../application/services/category.service';
import { EnumMappingService } from '../application/services/enum-mapping.service';
import { ExtraService } from '../application/services/extra.service';
import { CreateOrderData, OrderService } from '../application/services/order.service';
import { ProductService } from '../application/services/product.service';
import { SeedService } from '../application/services/seed.service';
import { TableService } from '../application/services/table.service';
import { VariantService } from '../application/services/variant.service';
import { RepositoryFactory } from '../infrastructure/adapters/repository.factory';
import { PlatformService } from '../shared/utilities/platform.service';

/**
 * Phase 3 Integration Tests - Core POS Flow
 *
 * These tests verify the complete order lifecycle:
 * - Order type selection (DINE_IN, TAKEAWAY, DELIVERY)
 * - Table selection and management
 * - Product selection (with variants and extras)
 * - Payment processing
 * - Order status transitions
 * - Table automation (FREE ↔ OCCUPIED)
 * - Kitchen view functionality
 * - Transaction integrity
 */
describe('Phase 3: Core POS Flow', () => {
  let orderService: OrderService;
  let tableService: TableService;
  let categoryService: CategoryService;
  let productService: ProductService;
  let variantService: VariantService;
  let extraService: ExtraService;
  let cartService: CartService;
  let seedService: SeedService;
  let enumMappingService: EnumMappingService;

  // Store status IDs for reuse across tests
  let freeStatusId: number;
  let occupiedStatusId: number;
  let dineInTypeId: number;
  let takeawayTypeId: number;
  let deliveryTypeId: number;
  let openStatusId: number;
  let preparingStatusId: number;
  let readyStatusId: number;
  let completedStatusId: number;
  let cancelledStatusId: number;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        TableService,
        CategoryService,
        ProductService,
        VariantService,
        ExtraService,
        CartService,
        SeedService,
        EnumMappingService,
        RepositoryFactory,
        {
          provide: PlatformService,
          useValue: {
            isTauri: () => false,
            isWeb: () => true,
          },
        },
      ],
    });

    orderService = TestBed.inject(OrderService);
    tableService = TestBed.inject(TableService);
    categoryService = TestBed.inject(CategoryService);
    productService = TestBed.inject(ProductService);
    variantService = TestBed.inject(VariantService);
    extraService = TestBed.inject(ExtraService);
    cartService = TestBed.inject(CartService);
    seedService = TestBed.inject(SeedService);
    enumMappingService = TestBed.inject(EnumMappingService);

    // Seed database with CodeTable data and test data
    await seedService.seedDatabase();

    // Verify seeding success
    const products = await productService.getAll();
    const tables = await tableService.getAll();
    const categories = await categoryService.getAll();
    const variants = await variantService.getAll();
    const extras = await extraService.getAll();

    expect(products.length).toBeGreaterThan(0);
    expect(tables.length).toBeGreaterThan(0);
    expect(categories.length).toBeGreaterThan(0);
    expect(variants.length).toBeGreaterThan(0);
    expect(extras.length).toBeGreaterThan(0);

    await enumMappingService.init();

    // Cache status IDs for tests
    freeStatusId = await enumMappingService.getCodeTableId('TABLE_STATUS', TableStatusEnum.FREE);
    occupiedStatusId = await enumMappingService.getCodeTableId(
      'TABLE_STATUS',
      TableStatusEnum.OCCUPIED,
    );
    dineInTypeId = await enumMappingService.getCodeTableId('ORDER_TYPE', OrderTypeEnum.DINE_IN);
    takeawayTypeId = await enumMappingService.getCodeTableId('ORDER_TYPE', OrderTypeEnum.TAKEAWAY);
    deliveryTypeId = await enumMappingService.getCodeTableId('ORDER_TYPE', OrderTypeEnum.DELIVERY);
    openStatusId = await enumMappingService.getCodeTableId('ORDER_STATUS', OrderStatusEnum.OPEN);
    preparingStatusId = await enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.PREPARING,
    );
    readyStatusId = await enumMappingService.getCodeTableId('ORDER_STATUS', OrderStatusEnum.READY);
    completedStatusId = await enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.COMPLETED,
    );
    cancelledStatusId = await enumMappingService.getCodeTableId(
      'ORDER_STATUS',
      OrderStatusEnum.CANCELLED,
    );

    // Clear cart before each test
    cartService.clear();
  });

  /**
   * Helper function to create cart items for testing
   */
  async function createTestCartItem(): Promise<CartItem> {
    const products = await productService.getAll();
    expect(products.length).toBeGreaterThan(0);
    const product = products[0];

    return {
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      variantId: null,
      variantName: null,
      variantPriceModifier: 0,
      quantity: 1,
      extraIds: [],
      extraNames: [],
      extraPrices: [],
      unitPrice: product.price,
      lineTotal: product.price,
      notes: null,
    };
  }

  /**
   * Helper function to create order data
   */
  async function createOrderData(
    typeId: number,
    statusId: number,
    tableId: number | null,
    items: CartItem[],
  ): Promise<CreateOrderData> {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    // Calculate included tax (prices are tax-inclusive): tax = subtotal * rate / (1 + rate)
    const tax = (subtotal * TAX_RATE) / (1 + TAX_RATE);
    const tip = 0;
    // Total = subtotal + tip (no additional tax, prices are tax-inclusive)
    const total = subtotal + tip;

    return {
      typeId,
      statusId,
      tableId,
      subtotal,
      tax,
      tip,
      total,
      userId: 1,
      items,
    };
  }

  /**
   * Helper to create a FREE table for testing
   */
  async function createFreeTable(): Promise<number> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const table = await tableService.create({
      name: `Test Table ${timestamp}-${random}`,
      number: (timestamp % 100000) + random,
      seats: 4,
      statusId: freeStatusId,
    });
    return table.id;
  }

  describe('Order Type Selection', () => {
    it('should create a DINE_IN order with table', async () => {
      const tableId = await createFreeTable();
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(dineInTypeId, completedStatusId, tableId, [cartItem]);

      const order = await orderService.createOrder(orderData);

      expect(order.id).toBeDefined();
      expect(order.typeId).toBe(dineInTypeId);
      expect(order.tableId).toBe(tableId);
      expect(order.statusId).toBe(completedStatusId);
    });

    it('should create a TAKEAWAY order without table', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);

      const order = await orderService.createOrder(orderData);

      expect(order.id).toBeDefined();
      expect(order.typeId).toBe(takeawayTypeId);
      expect(order.tableId).toBeNull();
    });

    it('should create a DELIVERY order without table', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(deliveryTypeId, completedStatusId, null, [cartItem]);

      const order = await orderService.createOrder(orderData);

      expect(order.id).toBeDefined();
      expect(order.typeId).toBe(deliveryTypeId);
      expect(order.tableId).toBeNull();
    });
  });

  describe('Table Selection & Management', () => {
    it('should set table to FREE when creating DINE_IN order with COMPLETED status', async () => {
      const tableId = await createFreeTable();

      // Verify table is FREE initially
      const tableBefore = await tableService.getById(tableId);
      expect(tableBefore?.statusId).toBe(freeStatusId);

      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(dineInTypeId, completedStatusId, tableId, [cartItem]);
      await orderService.createOrder(orderData);

      // Verify table is FREE (because order status is COMPLETED)
      const tableAfter = await tableService.getById(tableId);
      expect(tableAfter?.statusId).toBe(freeStatusId);
    });

    it('should filter FREE tables for selection', async () => {
      // Create a new table that's FREE
      const freeTableId = await createFreeTable();

      // Get all tables and filter by FREE status
      const allTables = await tableService.getAll();
      const freeTables = allTables.filter((t) => t.statusId === freeStatusId);

      // Verify we can find free tables
      expect(freeTables.length).toBeGreaterThan(0);
      expect(freeTables.some((t) => t.id === freeTableId)).toBe(true);
    });

    it('should not allow selecting OCCUPIED table', async () => {
      const tableId = await createFreeTable();

      // Set table to OCCUPIED
      await tableService.updateTableStatus(tableId, occupiedStatusId);

      // Verify table is OCCUPIED
      const table = await tableService.getById(tableId);
      expect(table?.statusId).toBe(occupiedStatusId);

      // In a real app, UI would prevent selection of occupied tables
      // Here we verify the table's status
      const allTables = await tableService.getAll();
      const freeTables = allTables.filter((t) => t.statusId === freeStatusId);
      expect(freeTables.some((t) => t.id === tableId)).toBe(false);
    });
  });

  describe('Product Selection', () => {
    it('should add products to order', async () => {
      const products = await productService.getAll();
      expect(products.length).toBeGreaterThan(0);

      const product = products[0];
      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        variantId: null,
        variantName: null,
        variantPriceModifier: 0,
        quantity: 2,
        extraIds: [],
        extraNames: [],
        extraPrices: [],
        unitPrice: product.price,
        lineTotal: product.price * 2,
        notes: null,
      };

      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      const order = await orderService.createOrder(orderData);

      const orderItems = await orderService.getOrderItems(order.id);
      expect(orderItems.length).toBe(1);
      expect(orderItems[0].productId).toBe(product.id);
      expect(orderItems[0].quantity).toBe(2);
    });

    it('should add variants to order items', async () => {
      const products = await productService.getAll();
      const variants = await variantService.getAll();

      // Find a product with variants
      const product = products.find((p) => variants.some((v) => v.productId === p.id));
      expect(product).toBeDefined();

      if (!product) {
        throw new Error('Product with variants not found');
      }

      const variant = variants.find((v) => v.productId === product.id);
      expect(variant).toBeDefined();

      if (!variant) {
        throw new Error('Variant for product not found');
      }

      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        variantId: variant.id,
        variantName: variant.name,
        variantPriceModifier: variant.priceModifier,
        quantity: 1,
        extraIds: [],
        extraNames: [],
        extraPrices: [],
        unitPrice: product.price + variant.priceModifier,
        lineTotal: product.price + variant.priceModifier,
        notes: null,
      };

      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      const order = await orderService.createOrder(orderData);

      const orderItems = await orderService.getOrderItems(order.id);
      expect(orderItems.length).toBe(1);
      expect(orderItems[0].variantId).toBe(variant.id);
    });

    it('should add extras to order items', async () => {
      const products = await productService.getAll();
      const extras = await extraService.getAll();
      const product = products[0];
      const extra = extras[0];

      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        variantId: null,
        variantName: null,
        variantPriceModifier: 0,
        quantity: 1,
        extraIds: [extra.id],
        extraNames: [extra.name],
        extraPrices: [extra.price],
        unitPrice: product.price + extra.price,
        lineTotal: product.price + extra.price,
        notes: null,
      };

      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      const order = await orderService.createOrder(orderData);

      const orderItems = await orderService.getOrderItems(order.id);
      expect(orderItems.length).toBe(1);

      const orderItemExtras = await orderService.getOrderItemExtras(orderItems[0].id);
      expect(orderItemExtras).toContain(extra.id);
    });

    it('should calculate order totals correctly', async () => {
      const products = await productService.getAll();
      const extras = await extraService.getAll();
      const product = products[0];
      const extra = extras[0];

      const quantity = 2;
      const unitPrice = product.price + extra.price;
      const lineTotal = unitPrice * quantity;
      const subtotal = lineTotal;
      // Calculate included tax (prices are tax-inclusive): tax = subtotal * rate / (1 + rate)
      const tax = (subtotal * TAX_RATE) / (1 + TAX_RATE);
      // Total = subtotal (no additional tax added, prices already include tax)
      const total = subtotal;

      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        variantId: null,
        variantName: null,
        variantPriceModifier: 0,
        quantity,
        extraIds: [extra.id],
        extraNames: [extra.name],
        extraPrices: [extra.price],
        unitPrice,
        lineTotal,
        notes: null,
      };

      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      const order = await orderService.createOrder(orderData);

      expect(order.subtotal).toBeCloseTo(subtotal, 2);
      expect(order.tax).toBeCloseTo(tax, 2);
      expect(order.total).toBeCloseTo(total, 2);
    });
  });

  describe('Payment Processing', () => {
    it('should process cash payment and set status to COMPLETED', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);

      const order = await orderService.createOrder(orderData);

      expect(order.statusId).toBe(completedStatusId);
      expect(order.total).toBeGreaterThan(0);
    });

    it('should persist order after payment', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);

      const createdOrder = await orderService.createOrder(orderData);
      const retrievedOrder = await orderService.getOrderById(createdOrder.id);

      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder?.id).toBe(createdOrder.id);
      expect(retrievedOrder?.statusId).toBe(completedStatusId);
    });
  });

  describe('Order Status Transitions', () => {
    it('should transition from COMPLETED to PREPARING', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);

      const order = await orderService.createOrder(orderData);
      expect(order.statusId).toBe(completedStatusId);

      const updatedOrder = await orderService.updateOrderStatus(order.id, preparingStatusId);
      expect(updatedOrder.statusId).toBe(preparingStatusId);
    });

    it('should transition from PREPARING to READY', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);

      const order = await orderService.createOrder(orderData);
      await orderService.updateOrderStatus(order.id, preparingStatusId);

      const updatedOrder = await orderService.updateOrderStatus(order.id, readyStatusId);
      expect(updatedOrder.statusId).toBe(readyStatusId);
    });

    it('should transition from READY to COMPLETED', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);

      const order = await orderService.createOrder(orderData);
      await orderService.updateOrderStatus(order.id, preparingStatusId);
      await orderService.updateOrderStatus(order.id, readyStatusId);

      const updatedOrder = await orderService.completeOrder(order.id);
      expect(updatedOrder.statusId).toBe(completedStatusId);
      expect(updatedOrder.completedAt).not.toBeNull();
    });

    it('should cancel order from OPEN state', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, openStatusId, null, [cartItem]);

      const order = await orderService.createOrder(orderData);
      expect(order.statusId).toBe(openStatusId);

      const cancelledOrder = await orderService.cancelOrder(order.id, 'Customer request');
      expect(cancelledOrder.statusId).toBe(cancelledStatusId);
      expect(cancelledOrder.cancelledReason).toBe('Customer request');
      expect(cancelledOrder.completedAt).not.toBeNull();
    });

    it('should complete full order lifecycle: COMPLETED → PREPARING → READY → COMPLETED', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);

      // Create order with COMPLETED status
      const order = await orderService.createOrder(orderData);
      expect(order.statusId).toBe(completedStatusId);

      // Move to PREPARING
      let currentOrder = await orderService.updateOrderStatus(order.id, preparingStatusId);
      expect(currentOrder.statusId).toBe(preparingStatusId);

      // Move to READY
      currentOrder = await orderService.updateOrderStatus(order.id, readyStatusId);
      expect(currentOrder.statusId).toBe(readyStatusId);

      // Complete the order
      currentOrder = await orderService.completeOrder(order.id);
      expect(currentOrder.statusId).toBe(completedStatusId);
      expect(currentOrder.completedAt).not.toBeNull();
    });
  });

  describe('Table Automation', () => {
    it('should set table to OCCUPIED when DINE_IN order is created as OPEN', async () => {
      const tableId = await createFreeTable();

      // Verify table is FREE
      let table = await tableService.getById(tableId);
      expect(table?.statusId).toBe(freeStatusId);

      // Create DINE_IN order as OPEN
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(dineInTypeId, openStatusId, tableId, [cartItem]);
      await orderService.createOrder(orderData);

      // Verify table is OCCUPIED
      table = await tableService.getById(tableId);
      expect(table?.statusId).toBe(occupiedStatusId);
    });

    it('should set table to FREE when DINE_IN order is COMPLETED', async () => {
      const tableId = await createFreeTable();

      // Create DINE_IN order (table becomes OCCUPIED)
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(dineInTypeId, openStatusId, tableId, [cartItem]);
      const order = await orderService.createOrder(orderData);

      // Verify table is OCCUPIED
      let table = await tableService.getById(tableId);
      expect(table?.statusId).toBe(occupiedStatusId);

      // Complete the order
      await orderService.completeOrder(order.id);

      // Verify table is FREE again
      table = await tableService.getById(tableId);
      expect(table?.statusId).toBe(freeStatusId);
    });

    it('should set table to FREE when DINE_IN order is CANCELLED', async () => {
      const tableId = await createFreeTable();

      // Create DINE_IN order (table becomes OCCUPIED)
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(dineInTypeId, openStatusId, tableId, [cartItem]);
      const order = await orderService.createOrder(orderData);

      // Verify table is OCCUPIED
      let table = await tableService.getById(tableId);
      expect(table?.statusId).toBe(occupiedStatusId);

      // Cancel the order
      await orderService.cancelOrder(order.id, 'Customer left');

      // Verify table is FREE again
      table = await tableService.getById(tableId);
      expect(table?.statusId).toBe(freeStatusId);
    });

    it('should not affect table status for TAKEAWAY orders', async () => {
      // Track all FREE tables before
      const tablesBefore = await tableService.getAll();
      const freeTablesBefore = tablesBefore.filter((t) => t.statusId === freeStatusId);

      // Create TAKEAWAY order (no table)
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      await orderService.createOrder(orderData);

      // Verify no table status changed
      const tablesAfter = await tableService.getAll();
      const freeTablesAfter = tablesAfter.filter((t) => t.statusId === freeStatusId);

      // Same number of free tables
      expect(freeTablesAfter.length).toBe(freeTablesBefore.length);
    });
  });

  describe('Kitchen View', () => {
    it('should filter orders by PREPARING status', async () => {
      // Create an order and move it to PREPARING
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      const order = await orderService.createOrder(orderData);
      await orderService.updateOrderStatus(order.id, preparingStatusId);

      // Get orders by PREPARING status
      const preparingOrders = await orderService.getOrdersByStatus(OrderStatusEnum.PREPARING);

      expect(preparingOrders.length).toBeGreaterThan(0);
      expect(preparingOrders.some((o) => o.id === order.id)).toBe(true);
    });

    it('should update order status from kitchen view', async () => {
      // Create order and move to PREPARING
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      const order = await orderService.createOrder(orderData);
      await orderService.updateOrderStatus(order.id, preparingStatusId);

      // Verify it's in PREPARING
      let preparingOrders = await orderService.getOrdersByStatus(OrderStatusEnum.PREPARING);
      expect(preparingOrders.some((o) => o.id === order.id)).toBe(true);

      // Kitchen marks it as READY
      await orderService.updateOrderStatus(order.id, readyStatusId);

      // Verify it's no longer in PREPARING
      preparingOrders = await orderService.getOrdersByStatus(OrderStatusEnum.PREPARING);
      expect(preparingOrders.some((o) => o.id === order.id)).toBe(false);

      // Verify it's in READY
      const readyOrders = await orderService.getOrdersByStatus(OrderStatusEnum.READY);
      expect(readyOrders.some((o) => o.id === order.id)).toBe(true);
    });

    it('should display correct orders for kitchen staff', async () => {
      // Create multiple orders with different statuses
      const cartItem1 = await createTestCartItem();
      const order1Data = await createOrderData(takeawayTypeId, completedStatusId, null, [
        cartItem1,
      ]);
      const order1 = await orderService.createOrder(order1Data);

      const cartItem2 = await createTestCartItem();
      const order2Data = await createOrderData(takeawayTypeId, completedStatusId, null, [
        cartItem2,
      ]);
      const order2 = await orderService.createOrder(order2Data);

      const cartItem3 = await createTestCartItem();
      const order3Data = await createOrderData(takeawayTypeId, completedStatusId, null, [
        cartItem3,
      ]);
      const order3 = await orderService.createOrder(order3Data);

      // Move orders to different statuses
      await orderService.updateOrderStatus(order1.id, preparingStatusId);
      await orderService.updateOrderStatus(order2.id, preparingStatusId);
      // order3 stays in COMPLETED status

      // Kitchen should only see PREPARING orders
      const kitchenOrders = await orderService.getOrdersByStatus(OrderStatusEnum.PREPARING);

      expect(kitchenOrders.some((o) => o.id === order1.id)).toBe(true);
      expect(kitchenOrders.some((o) => o.id === order2.id)).toBe(true);
      expect(kitchenOrders.some((o) => o.id === order3.id)).toBe(false);
    });
  });

  describe('Transaction Integrity', () => {
    it('should create order with all related items and extras', async () => {
      const products = await productService.getAll();
      const extras = await extraService.getAll();
      const product = products[0];
      const extra1 = extras[0];
      const extra2 = extras[1];

      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        variantId: null,
        variantName: null,
        variantPriceModifier: 0,
        quantity: 1,
        extraIds: [extra1.id, extra2.id],
        extraNames: [extra1.name, extra2.name],
        extraPrices: [extra1.price, extra2.price],
        unitPrice: product.price + extra1.price + extra2.price,
        lineTotal: product.price + extra1.price + extra2.price,
        notes: 'Test order',
      };

      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      const order = await orderService.createOrder(orderData);

      // Verify order created
      expect(order.id).toBeDefined();

      // Verify order items created
      const orderItems = await orderService.getOrderItems(order.id);
      expect(orderItems.length).toBe(1);
      expect(orderItems[0].notes).toBe('Test order');

      // Verify extras attached to order item
      const itemExtras = await orderService.getOrderItemExtras(orderItems[0].id);
      expect(itemExtras.length).toBe(2);
      expect(itemExtras).toContain(extra1.id);
      expect(itemExtras).toContain(extra2.id);
    });

    it('should maintain data consistency across multiple orders', async () => {
      const initialOrders = await orderService.getAllOrders();
      const initialCount = initialOrders.length;

      // Create multiple orders sequentially
      const createdOrders = [];
      for (let i = 0; i < 3; i++) {
        const cartItem = await createTestCartItem();
        const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [
          cartItem,
        ]);
        const order = await orderService.createOrder(orderData);
        createdOrders.push(order);
      }

      // Verify all orders created
      expect(createdOrders.length).toBe(3);
      createdOrders.forEach((order) => {
        expect(order.id).toBeDefined();
      });

      // Verify order count
      const finalOrders = await orderService.getAllOrders();
      expect(finalOrders.length).toBe(initialCount + 3);

      // Verify each order is unique
      const orderIds = createdOrders.map((o) => o.id);
      const uniqueIds = [...new Set(orderIds)];
      expect(uniqueIds.length).toBe(3);
    });

    it('should generate unique order numbers', async () => {
      const cartItem1 = await createTestCartItem();
      const orderData1 = await createOrderData(takeawayTypeId, completedStatusId, null, [
        cartItem1,
      ]);
      const order1 = await orderService.createOrder(orderData1);

      const cartItem2 = await createTestCartItem();
      const orderData2 = await createOrderData(takeawayTypeId, completedStatusId, null, [
        cartItem2,
      ]);
      const order2 = await orderService.createOrder(orderData2);

      expect(order1.orderNumber).toBeDefined();
      expect(order2.orderNumber).toBeDefined();
      expect(order1.orderNumber).not.toBe(order2.orderNumber);
    });

    it('should persist order with all related data', async () => {
      const tableId = await createFreeTable();
      const products = await productService.getAll();
      const variants = await variantService.getAll();
      const extras = await extraService.getAll();

      const product = products.find((p) => variants.some((v) => v.productId === p.id));
      if (!product) {
        throw new Error('Product with variants not found');
      }
      const variant = variants.find((v) => v.productId === product.id);
      const extra = extras[0];

      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        variantId: variant?.id ?? null,
        variantName: variant?.name ?? null,
        variantPriceModifier: variant?.priceModifier ?? 0,
        quantity: 2,
        extraIds: [extra.id],
        extraNames: [extra.name],
        extraPrices: [extra.price],
        unitPrice: product.price + (variant?.priceModifier ?? 0) + extra.price,
        lineTotal: (product.price + (variant?.priceModifier ?? 0) + extra.price) * 2,
        notes: 'Special instructions',
      };

      const orderData = await createOrderData(dineInTypeId, completedStatusId, tableId, [cartItem]);
      const createdOrder = await orderService.createOrder(orderData);

      // Retrieve order and verify all data persisted
      const retrievedOrder = await orderService.getOrderById(createdOrder.id);
      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder?.typeId).toBe(dineInTypeId);
      expect(retrievedOrder?.tableId).toBe(tableId);

      // Verify order items
      const orderItems = await orderService.getOrderItems(createdOrder.id);
      expect(orderItems.length).toBe(1);
      expect(orderItems[0].variantId).toBe(variant?.id ?? null);
      expect(orderItems[0].quantity).toBe(2);
      expect(orderItems[0].notes).toBe('Special instructions');

      // Verify extras
      const itemExtras = await orderService.getOrderItemExtras(orderItems[0].id);
      expect(itemExtras).toContain(extra.id);
    });
  });

  describe('Cart Service Integration', () => {
    it('should add items to cart and calculate summary', async () => {
      const products = await productService.getAll();
      const product = products[0];

      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        variantId: null,
        variantName: null,
        variantPriceModifier: 0,
        quantity: 2,
        extraIds: [],
        extraNames: [],
        extraPrices: [],
        unitPrice: product.price,
        lineTotal: product.price * 2,
        notes: null,
      };

      cartService.addItem(cartItem);

      const summary = cartService.getSummary();
      expect(summary.items.length).toBe(1);
      expect(summary.itemCount).toBe(2);
      expect(summary.subtotal).toBe(product.price * 2);
      // Tax is the included tax (extracted from tax-inclusive price): tax = subtotal * rate / (1 + rate)
      const expectedTax = (summary.subtotal * TAX_RATE) / (1 + TAX_RATE);
      expect(summary.tax).toBeCloseTo(expectedTax, 2);
      // Total = subtotal (no additional tax, prices already include tax)
      expect(summary.total).toBe(summary.subtotal);
    });

    it('should allow clearing cart after order creation', async () => {
      const products = await productService.getAll();
      const product = products[0];

      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        variantId: null,
        variantName: null,
        variantPriceModifier: 0,
        quantity: 1,
        extraIds: [],
        extraNames: [],
        extraPrices: [],
        unitPrice: product.price,
        lineTotal: product.price,
        notes: null,
      };

      cartService.addItem(cartItem);
      expect(cartService.isEmpty()).toBe(false);

      // Create order using cart items
      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      await orderService.createOrder(orderData);

      // Simulate clearing cart after order
      cartService.clear();
      expect(cartService.isEmpty()).toBe(true);
    });

    it('should update item quantities in cart', async () => {
      const products = await productService.getAll();
      const product = products[0];

      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        variantId: null,
        variantName: null,
        variantPriceModifier: 0,
        quantity: 1,
        extraIds: [],
        extraNames: [],
        extraPrices: [],
        unitPrice: product.price,
        lineTotal: product.price,
        notes: null,
      };

      cartService.addItem(cartItem);
      cartService.updateItemQuantity(0, 3);

      const summary = cartService.getSummary();
      expect(summary.items[0].quantity).toBe(3);
      expect(summary.itemCount).toBe(3);
    });
  });

  describe('Total plus Tip (Override and Validation)', () => {
    it('should calculate tip amount correctly when total is overridden', async () => {
      const cartItem = await createTestCartItem();
      const subtotal = cartItem.lineTotal;
      const overriddenTotal = subtotal + 5.5; // €5.50 tip

      const orderData: CreateOrderData = {
        typeId: takeawayTypeId,
        statusId: completedStatusId,
        tableId: null,
        subtotal,
        tax: (subtotal * TAX_RATE) / (1 + TAX_RATE),
        tip: 5.5,
        total: overriddenTotal,
        userId: 1,
        items: [cartItem],
      };

      const order = await orderService.createOrder(orderData);

      expect(order.tip).toBe(5.5);
      expect(order.total).toBe(overriddenTotal);
    });

    it('should maintain subtotal and tax while adding tip to total', async () => {
      await productService.getAll();
      const cartItem = await createTestCartItem();

      const subtotal = cartItem.lineTotal;
      const tip = 10;
      const total = subtotal + tip;

      const orderData = await createOrderData(takeawayTypeId, completedStatusId, null, [cartItem]);
      orderData.tip = tip;
      orderData.total = total;

      const order = await orderService.createOrder(orderData);

      expect(order.subtotal).toBe(subtotal);
      expect(order.tip).toBe(tip);
      expect(order.total).toBe(total);
      // Tax should still be based on subtotal (tax-inclusive)
      expect(order.tax).toBeCloseTo((subtotal * TAX_RATE) / (1 + TAX_RATE), 2);
    });

    it('should allow updating an existing order with a tip', async () => {
      const cartItem = await createTestCartItem();
      const orderData = await createOrderData(dineInTypeId, openStatusId, null, [cartItem]);
      const initialOrder = await orderService.createOrder(orderData);

      expect(initialOrder.tip).toBe(0);

      const tipAmount = 3.5;
      const newTotal = initialOrder.subtotal + tipAmount;

      const updatedOrder = await orderService.updateOrder(initialOrder.id, {
        tip: tipAmount,
        total: newTotal,
      });

      expect(updatedOrder.id).toBe(initialOrder.id);
      expect(updatedOrder.tip).toBe(tipAmount);
      expect(updatedOrder.total).toBe(newTotal);
    });
  });
});
