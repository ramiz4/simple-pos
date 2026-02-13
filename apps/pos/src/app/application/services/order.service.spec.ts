import { TestBed } from '@angular/core/testing';
import { TAX_RATE } from '@simple-pos/domain';
import {
  CartItem,
  Order,
  OrderItem,
  OrderStatusEnum,
  OrderTypeEnum,
  TableStatusEnum,
} from '@simple-pos/shared/types';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { IndexedDBOrderItemExtraRepository } from '../../infrastructure/repositories/indexeddb-order-item-extra.repository';
import { IndexedDBOrderItemRepository } from '../../infrastructure/repositories/indexeddb-order-item.repository';
import { IndexedDBOrderRepository } from '../../infrastructure/repositories/indexeddb-order.repository';
import { SQLiteOrderItemExtraRepository } from '../../infrastructure/repositories/sqlite-order-item-extra.repository';
import { SQLiteOrderItemRepository } from '../../infrastructure/repositories/sqlite-order-item.repository';
import { SQLiteOrderRepository } from '../../infrastructure/repositories/sqlite-order.repository';
import { PlatformService } from '../../shared/utilities/platform.service';
import { EnumMappingService } from './enum-mapping.service';
import { CreateOrderData, OrderService } from './order.service';
import { TableService } from './table.service';

describe('OrderService', () => {
  let service: OrderService;
  let mockPlatformService: { isTauri: Mock };
  let mockSqliteOrderRepo: {
    findById: Mock;
    findAll: Mock;
    findByTable: Mock;
    findByStatus: Mock;
    findActiveOrders: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
    getNextOrderNumber: Mock;
  };
  let mockIndexedDBOrderRepo: typeof mockSqliteOrderRepo;
  let mockSqliteOrderItemRepo: {
    findById: Mock;
    findAll: Mock;
    findByOrderId: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
  };
  let mockIndexedDBOrderItemRepo: typeof mockSqliteOrderItemRepo;
  let mockSqliteOrderItemExtraRepo: {
    findById: Mock;
    findAll: Mock;
    findByOrderItemId: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
  };
  let mockIndexedDBOrderItemExtraRepo: typeof mockSqliteOrderItemExtraRepo;
  let mockEnumMappingService: {
    init: Mock;
    getTranslation: Mock;
    getStatusName: Mock;
    getTypeName: Mock;
  };
  let mockTableService: {
    updateTableStatus: Mock;
    getTableById: Mock;
  };

  const mockOrder: Order = {
    id: 1,
    orderNumber: 'ORD-001',
    typeId: 1,
    statusId: 1,
    tableId: 1,
    subtotal: 100,
    tax: 18,
    tip: 10,
    total: 128,
    createdAt: '2024-01-01T00:00:00.000Z',
    completedAt: null,
    userId: 1,
    cancelledReason: null,
    customerName: 'John Doe',
  };

  const mockOrderItem: OrderItem = {
    id: 1,
    orderId: 1,
    productId: 1,
    variantId: null,
    quantity: 2,
    unitPrice: 50,
    notes: null,
    statusId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const mockCartItem: CartItem = {
    productId: 1,
    productName: 'Test Product',
    productPrice: 50,
    variantId: null,
    variantName: null,
    variantPriceModifier: 0,
    quantity: 2,
    extraIds: [1, 2],
    extraNames: ['Extra 1', 'Extra 2'],
    extraPrices: [5, 10],
    unitPrice: 50,
    lineTotal: 100,
    notes: null,
  };

  const mockCreateOrderData: CreateOrderData = {
    typeId: 1,
    statusId: 1,
    tableId: 1,
    subtotal: 100,
    tax: 18,
    tip: 10,
    total: 128,
    userId: 1,
    items: [mockCartItem],
    customerName: 'John Doe',
  };

  beforeEach(() => {
    // Mock PlatformService
    mockPlatformService = {
      isTauri: vi.fn().mockReturnValue(false),
    };

    // Mock SQLite Order Repository
    mockSqliteOrderRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByTable: vi.fn(),
      findByStatus: vi.fn(),
      findActiveOrders: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      getNextOrderNumber: vi.fn(),
    };

    // Mock IndexedDB Order Repository
    mockIndexedDBOrderRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByTable: vi.fn(),
      findByStatus: vi.fn(),
      findActiveOrders: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      getNextOrderNumber: vi.fn(),
    };

    // Mock SQLite OrderItem Repository
    mockSqliteOrderItemRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByOrderId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };

    // Mock IndexedDB OrderItem Repository
    mockIndexedDBOrderItemRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByOrderId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };

    // Mock SQLite OrderItemExtra Repository
    mockSqliteOrderItemExtraRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByOrderItemId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };

    // Mock IndexedDB OrderItemExtra Repository
    mockIndexedDBOrderItemExtraRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByOrderItemId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    };

    // Mock EnumMappingService
    mockEnumMappingService = {
      getEnumFromId: vi.fn(),
      getCodeTableId: vi.fn(),
    };

    // Mock TableService
    mockTableService = {
      updateTableStatus: vi.fn(),
    };

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        { provide: PlatformService, useValue: mockPlatformService },
        { provide: SQLiteOrderRepository, useValue: mockSqliteOrderRepo },
        { provide: IndexedDBOrderRepository, useValue: mockIndexedDBOrderRepo },
        { provide: SQLiteOrderItemRepository, useValue: mockSqliteOrderItemRepo },
        { provide: IndexedDBOrderItemRepository, useValue: mockIndexedDBOrderItemRepo },
        { provide: SQLiteOrderItemExtraRepository, useValue: mockSqliteOrderItemExtraRepo },
        {
          provide: IndexedDBOrderItemExtraRepository,
          useValue: mockIndexedDBOrderItemExtraRepo,
        },
        { provide: EnumMappingService, useValue: mockEnumMappingService },
        { provide: TableService, useValue: mockTableService },
      ],
    });

    service = TestBed.inject(OrderService);

    // Mock console.error to prevent test pollution and CI failure
    vi.spyOn(console, 'error').mockImplementation(() => {
      /* empty */
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Platform Selection', () => {
    it('should use IndexedDB repositories on web platform', async () => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBOrderRepo.findById.mockResolvedValue(mockOrder);

      await service.getOrderById(1);

      expect(mockIndexedDBOrderRepo.findById).toHaveBeenCalledWith(1);
      expect(mockSqliteOrderRepo.findById).not.toHaveBeenCalled();
    });

    it('should use SQLite repositories on Tauri platform', async () => {
      mockPlatformService.isTauri.mockReturnValue(true);
      mockSqliteOrderRepo.findById.mockResolvedValue(mockOrder);

      await service.getOrderById(1);

      expect(mockSqliteOrderRepo.findById).toHaveBeenCalledWith(1);
      expect(mockIndexedDBOrderRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('createOrder', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBOrderRepo.getNextOrderNumber.mockResolvedValue('ORD-001');
      mockIndexedDBOrderRepo.create.mockResolvedValue(mockOrder);
      mockIndexedDBOrderItemRepo.create.mockResolvedValue(mockOrderItem);
      mockIndexedDBOrderItemExtraRepo.create.mockResolvedValue({
        id: 1,
        orderId: 1,
        orderItemId: 1,
        extraId: 1,
      });
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderTypeEnum.DINE_IN });
      mockEnumMappingService.getCodeTableId.mockResolvedValue(1);
    });

    it('should create a new order successfully', async () => {
      const result = await service.createOrder(mockCreateOrderData);

      expect(result).toEqual(mockOrder);
      expect(mockIndexedDBOrderRepo.getNextOrderNumber).toHaveBeenCalled();
      expect(mockIndexedDBOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: 'ORD-001',
          typeId: mockCreateOrderData.typeId,
          statusId: mockCreateOrderData.statusId,
          tableId: mockCreateOrderData.tableId,
          subtotal: mockCreateOrderData.subtotal,
          tax: mockCreateOrderData.tax,
          tip: mockCreateOrderData.tip,
          total: mockCreateOrderData.total,
          userId: mockCreateOrderData.userId,
          customerName: mockCreateOrderData.customerName,
        }),
      );
    });

    it('should create order items for all cart items', async () => {
      await service.createOrder(mockCreateOrderData);

      expect(mockIndexedDBOrderItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: mockOrder.id,
          productId: mockCartItem.productId,
          variantId: mockCartItem.variantId,
          quantity: mockCartItem.quantity,
          unitPrice: mockCartItem.unitPrice,
          notes: mockCartItem.notes,
          statusId: mockCreateOrderData.statusId,
        }),
      );
    });

    it('should create order item extras for all extras in cart items', async () => {
      await service.createOrder(mockCreateOrderData);

      // Should create 2 extras (extraIds: [1, 2])
      expect(mockIndexedDBOrderItemExtraRepo.create).toHaveBeenCalledTimes(2);
      expect(mockIndexedDBOrderItemExtraRepo.create).toHaveBeenCalledWith({
        orderId: mockOrder.id,
        orderItemId: mockOrderItem.id,
        extraId: 1,
      });
      expect(mockIndexedDBOrderItemExtraRepo.create).toHaveBeenCalledWith({
        orderId: mockOrder.id,
        orderItemId: mockOrderItem.id,
        extraId: 2,
      });
    });

    it('should update table status to OCCUPIED for DINE_IN orders', async () => {
      mockEnumMappingService.getEnumFromId.mockImplementation(async (id: number) => {
        if (id === mockCreateOrderData.typeId) {
          return { code: OrderTypeEnum.DINE_IN };
        }
        return { code: OrderStatusEnum.OPEN };
      });
      mockEnumMappingService.getCodeTableId.mockResolvedValue(2); // OCCUPIED

      await service.createOrder(mockCreateOrderData);

      expect(mockTableService.updateTableStatus).toHaveBeenCalledWith(
        mockCreateOrderData.tableId,
        2,
      );
    });

    it('should update table status to FREE for DINE_IN completed orders', async () => {
      mockEnumMappingService.getEnumFromId.mockImplementation(async (id: number) => {
        if (id === mockCreateOrderData.typeId) {
          return { code: OrderTypeEnum.DINE_IN };
        }
        return { code: OrderStatusEnum.COMPLETED };
      });
      mockEnumMappingService.getCodeTableId.mockResolvedValue(1); // FREE

      await service.createOrder(mockCreateOrderData);

      expect(mockTableService.updateTableStatus).toHaveBeenCalledWith(
        mockCreateOrderData.tableId,
        1,
      );
    });

    it('should not update table status for TAKEAWAY orders', async () => {
      mockEnumMappingService.getEnumFromId.mockImplementation(async (id: number) => {
        if (id === mockCreateOrderData.typeId) {
          return { code: OrderTypeEnum.TAKEAWAY };
        }
        return { code: OrderStatusEnum.OPEN };
      });

      await service.createOrder(mockCreateOrderData);

      expect(mockTableService.updateTableStatus).not.toHaveBeenCalled();
    });

    it('should handle errors during order creation', async () => {
      mockIndexedDBOrderRepo.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createOrder(mockCreateOrderData)).rejects.toThrow(
        'Failed to create order: Database error',
      );
    });
  });

  describe('getOpenOrderByTable', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockEnumMappingService.getCodeTableId.mockImplementation(
        async (table: string, status: string) => {
          if (status === OrderStatusEnum.COMPLETED) return 6;
          if (status === OrderStatusEnum.CANCELLED) return 7;
          return 1;
        },
      );
    });

    it('should return open order for table', async () => {
      const openOrder = { ...mockOrder, statusId: 1 };
      mockIndexedDBOrderRepo.findByTable.mockResolvedValue([openOrder]);

      const result = await service.getOpenOrderByTable(1);

      expect(result).toEqual(openOrder);
      expect(mockIndexedDBOrderRepo.findByTable).toHaveBeenCalledWith(1);
    });

    it('should return null when no orders exist for table', async () => {
      mockIndexedDBOrderRepo.findByTable.mockResolvedValue([]);

      const result = await service.getOpenOrderByTable(1);

      expect(result).toBeNull();
    });

    it('should return null when only completed/cancelled orders exist', async () => {
      const completedOrder = { ...mockOrder, statusId: 6 };
      const cancelledOrder = { ...mockOrder, id: 2, statusId: 7 };
      mockIndexedDBOrderRepo.findByTable.mockResolvedValue([completedOrder, cancelledOrder]);

      const result = await service.getOpenOrderByTable(1);

      expect(result).toBeNull();
    });

    it('should throw error when multiple active orders exist for table', async () => {
      const order1 = { ...mockOrder, statusId: 1 };
      const order2 = { ...mockOrder, id: 2, statusId: 2 };
      mockIndexedDBOrderRepo.findByTable.mockResolvedValue([order1, order2]);

      await expect(service.getOpenOrderByTable(1)).rejects.toThrow(
        'Multiple active orders (2) found for table 1. Expected at most one.',
      );
    });
  });

  describe('addItemsToOrder', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBOrderRepo.findById.mockResolvedValue(mockOrder);
      mockIndexedDBOrderItemRepo.create.mockResolvedValue(mockOrderItem);
      mockIndexedDBOrderItemExtraRepo.create.mockResolvedValue({
        id: 1,
        orderId: 1,
        orderItemId: 1,
        extraId: 1,
      });
      mockIndexedDBOrderRepo.update.mockResolvedValue({ ...mockOrder, subtotal: 200 });
      mockEnumMappingService.getCodeTableId.mockResolvedValue(1);
      mockIndexedDBOrderItemRepo.findByOrderId.mockResolvedValue([mockOrderItem]);
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.OPEN });
    });

    it('should add items to existing order', async () => {
      await service.addItemsToOrder(1, [mockCartItem]);

      expect(mockIndexedDBOrderRepo.findById).toHaveBeenCalledWith(1);
      expect(mockIndexedDBOrderItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: mockOrder.id,
          productId: mockCartItem.productId,
          quantity: mockCartItem.quantity,
          unitPrice: mockCartItem.unitPrice,
        }),
      );
    });

    it('should update order totals after adding items', async () => {
      await service.addItemsToOrder(1, [mockCartItem]);

      expect(mockIndexedDBOrderRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          subtotal: expect.any(Number),
          tax: expect.any(Number),
          total: expect.any(Number),
        }),
      );
    });

    it('should throw error when order is not found', async () => {
      mockIndexedDBOrderRepo.findById.mockResolvedValue(null);

      await expect(service.addItemsToOrder(999, [mockCartItem])).rejects.toThrow(
        'Order 999 not found',
      );
    });

    it('should create extras for added items', async () => {
      await service.addItemsToOrder(1, [mockCartItem]);

      expect(mockIndexedDBOrderItemExtraRepo.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getOrderById', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should return order by id', async () => {
      mockIndexedDBOrderRepo.findById.mockResolvedValue(mockOrder);

      const result = await service.getOrderById(1);

      expect(result).toEqual(mockOrder);
      expect(mockIndexedDBOrderRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when order not found', async () => {
      mockIndexedDBOrderRepo.findById.mockResolvedValue(null);

      const result = await service.getOrderById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAllOrders', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should return all orders', async () => {
      const orders = [mockOrder, { ...mockOrder, id: 2 }];
      mockIndexedDBOrderRepo.findAll.mockResolvedValue(orders);

      const result = await service.getAllOrders();

      expect(result).toEqual(orders);
      expect(mockIndexedDBOrderRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('getActiveOrders', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockEnumMappingService.getCodeTableId.mockImplementation(
        async (table: string, status: string) => {
          if (status === OrderStatusEnum.COMPLETED) return 6;
          if (status === OrderStatusEnum.CANCELLED) return 7;
          if (status === OrderStatusEnum.SERVED) return 5;
          return 1;
        },
      );
    });

    it('should return only active orders excluding completed, cancelled, and served', async () => {
      const orders = [
        { ...mockOrder, statusId: 1 }, // OPEN
        { ...mockOrder, id: 2, statusId: 2 }, // PREPARING
        { ...mockOrder, id: 3, statusId: 5 }, // SERVED
        { ...mockOrder, id: 4, statusId: 6 }, // COMPLETED
        { ...mockOrder, id: 5, statusId: 7 }, // CANCELLED
      ];
      mockIndexedDBOrderRepo.findActiveOrders.mockResolvedValue(orders);

      const result = await service.getActiveOrders();

      expect(result).toHaveLength(2);
      expect(result[0].statusId).toBe(1);
      expect(result[1].statusId).toBe(2);
    });
  });

  describe('getActiveAndServedOrders', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockEnumMappingService.getCodeTableId.mockImplementation(
        async (table: string, status: string) => {
          if (status === OrderStatusEnum.COMPLETED) return 6;
          if (status === OrderStatusEnum.CANCELLED) return 7;
          return 1;
        },
      );
    });

    it('should return active and served orders excluding only completed and cancelled', async () => {
      const orders = [
        { ...mockOrder, statusId: 1 }, // OPEN
        { ...mockOrder, id: 2, statusId: 5 }, // SERVED
        { ...mockOrder, id: 3, statusId: 6 }, // COMPLETED
        { ...mockOrder, id: 4, statusId: 7 }, // CANCELLED
      ];
      mockIndexedDBOrderRepo.findActiveOrders.mockResolvedValue(orders);

      const result = await service.getActiveAndServedOrders();

      expect(result).toHaveLength(2);
      expect(result[0].statusId).toBe(1);
      expect(result[1].statusId).toBe(5);
    });
  });

  describe('getOrdersByStatus', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockEnumMappingService.getCodeTableId.mockResolvedValue(2);
    });

    it('should return orders filtered by status', async () => {
      const orders = [
        { ...mockOrder, statusId: 2 },
        { ...mockOrder, id: 2, statusId: 2 },
      ];
      mockIndexedDBOrderRepo.findByStatus.mockResolvedValue(orders);

      const result = await service.getOrdersByStatus(OrderStatusEnum.PREPARING);

      expect(result).toEqual(orders);
      expect(mockEnumMappingService.getCodeTableId).toHaveBeenCalledWith(
        'ORDER_STATUS',
        OrderStatusEnum.PREPARING,
      );
      expect(mockIndexedDBOrderRepo.findByStatus).toHaveBeenCalledWith(2);
    });
  });

  describe('updateOrder', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should update an order with partial data', async () => {
      const partialData = { tip: 15, total: 133 };
      mockIndexedDBOrderRepo.update.mockResolvedValue({ ...mockOrder, ...partialData });

      const result = await service.updateOrder(1, partialData);

      expect(mockIndexedDBOrderRepo.update).toHaveBeenCalledWith(1, partialData);
      expect(result.tip).toBe(15);
      expect(result.total).toBe(133);
    });

    it('should use SQLite repository on Tauri platform', async () => {
      mockPlatformService.isTauri.mockReturnValue(true);
      const partialData = { statusId: 2 };
      mockSqliteOrderRepo.update.mockResolvedValue({ ...mockOrder, ...partialData });

      await service.updateOrder(1, partialData);

      expect(mockSqliteOrderRepo.update).toHaveBeenCalledWith(1, partialData);
      expect(mockIndexedDBOrderRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderStatus', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBOrderRepo.findById.mockResolvedValue(mockOrder);
      mockIndexedDBOrderRepo.update.mockResolvedValue({ ...mockOrder, statusId: 2 });
      mockEnumMappingService.getCodeTableId.mockResolvedValue(1);
    });

    it('should update order status successfully', async () => {
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.PREPARING });

      const result = await service.updateOrderStatus(1, 2);

      expect(mockIndexedDBOrderRepo.update).toHaveBeenCalledWith(1, { statusId: 2 });
      expect(result.statusId).toBe(2);
    });

    it('should throw error when order not found', async () => {
      mockIndexedDBOrderRepo.findById.mockResolvedValue(null);

      await expect(service.updateOrderStatus(999, 2)).rejects.toThrow(
        'Order with id 999 not found',
      );
    });

    it('should set completedAt when status is COMPLETED', async () => {
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.COMPLETED });

      await service.updateOrderStatus(1, 6);

      expect(mockIndexedDBOrderRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          statusId: 6,
          completedAt: expect.any(String),
        }),
      );
    });

    it('should free table when order is COMPLETED', async () => {
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.COMPLETED });
      mockEnumMappingService.getCodeTableId.mockResolvedValue(1); // FREE status

      await service.updateOrderStatus(1, 6);

      expect(mockTableService.updateTableStatus).toHaveBeenCalledWith(mockOrder.tableId, 1);
    });

    it('should set completedAt when status is CANCELLED', async () => {
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.CANCELLED });

      await service.updateOrderStatus(1, 7);

      expect(mockIndexedDBOrderRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          statusId: 7,
          completedAt: expect.any(String),
        }),
      );
    });

    it('should free table when order is CANCELLED', async () => {
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.CANCELLED });
      mockEnumMappingService.getCodeTableId.mockResolvedValue(1); // FREE status

      await service.updateOrderStatus(1, 7);

      expect(mockTableService.updateTableStatus).toHaveBeenCalledWith(mockOrder.tableId, 1);
    });
  });

  describe('cancelOrder', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBOrderRepo.findById.mockResolvedValue(mockOrder);
      mockIndexedDBOrderRepo.update.mockResolvedValue({
        ...mockOrder,
        statusId: 7,
        cancelledReason: 'Test reason',
      });
      mockEnumMappingService.getCodeTableId.mockResolvedValue(7); // CANCELLED
    });

    it('should cancel order with reason', async () => {
      await service.cancelOrder(1, 'Customer request');

      expect(mockIndexedDBOrderRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          statusId: 7,
          cancelledReason: 'Customer request',
          completedAt: expect.any(String),
        }),
      );
    });

    it('should free table when cancelling order', async () => {
      mockEnumMappingService.getCodeTableId.mockImplementation(
        async (table: string, status: string) => {
          if (status === OrderStatusEnum.CANCELLED) return 7;
          if (status === TableStatusEnum.FREE) return 1;
          return 1;
        },
      );

      await service.cancelOrder(1, 'Test reason');

      expect(mockTableService.updateTableStatus).toHaveBeenCalledWith(mockOrder.tableId, 1);
    });

    it('should throw error when order not found', async () => {
      mockIndexedDBOrderRepo.findById.mockResolvedValue(null);

      await expect(service.cancelOrder(999, 'Test reason')).rejects.toThrow(
        'Order with id 999 not found',
      );
    });
  });

  describe('completeOrder', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBOrderRepo.findById.mockResolvedValue(mockOrder);
      mockIndexedDBOrderRepo.update.mockResolvedValue({ ...mockOrder, statusId: 6 });
      mockEnumMappingService.getCodeTableId.mockResolvedValue(6); // COMPLETED
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.COMPLETED });
    });

    it('should mark order as completed', async () => {
      const result = await service.completeOrder(1);

      expect(mockEnumMappingService.getCodeTableId).toHaveBeenCalledWith(
        'ORDER_STATUS',
        OrderStatusEnum.COMPLETED,
      );
      expect(result.statusId).toBe(6);
    });
  });

  describe('getOrderItems', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should return all items for an order', async () => {
      const items = [mockOrderItem, { ...mockOrderItem, id: 2 }];
      mockIndexedDBOrderItemRepo.findByOrderId.mockResolvedValue(items);

      const result = await service.getOrderItems(1);

      expect(result).toEqual(items);
      expect(mockIndexedDBOrderItemRepo.findByOrderId).toHaveBeenCalledWith(1);
    });
  });

  describe('getOrderItemExtras', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should return extra ids for order item', async () => {
      const extras = [
        { id: 1, orderId: 1, orderItemId: 1, extraId: 10 },
        { id: 2, orderId: 1, orderItemId: 1, extraId: 20 },
      ];
      mockIndexedDBOrderItemExtraRepo.findByOrderItemId.mockResolvedValue(extras);

      const result = await service.getOrderItemExtras(1);

      expect(result).toEqual([10, 20]);
      expect(mockIndexedDBOrderItemExtraRepo.findByOrderItemId).toHaveBeenCalledWith(1);
    });
  });

  describe('updateOrderItemStatus', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBOrderItemRepo.update.mockResolvedValue({ ...mockOrderItem, statusId: 3 });
      mockIndexedDBOrderItemRepo.findByOrderId.mockResolvedValue([mockOrderItem]);
      mockIndexedDBOrderRepo.findById.mockResolvedValue(mockOrder);
      mockEnumMappingService.getCodeTableId.mockResolvedValue(3);
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.PREPARING });
    });

    it('should update order item status', async () => {
      const result = await service.updateOrderItemStatus(1, 3);

      expect(mockIndexedDBOrderItemRepo.update).toHaveBeenCalledWith(1, { statusId: 3 });
      expect(result.statusId).toBe(3);
    });

    it('should trigger order status check after updating item', async () => {
      await service.updateOrderItemStatus(1, 3);

      // Verify that it fetches order items to check status
      expect(mockIndexedDBOrderItemRepo.findByOrderId).toHaveBeenCalledWith(mockOrderItem.orderId);
    });
  });

  describe('Edge Cases and Validation', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should handle empty cart items when creating order', async () => {
      mockIndexedDBOrderRepo.getNextOrderNumber.mockResolvedValue('ORD-002');
      mockIndexedDBOrderRepo.create.mockResolvedValue(mockOrder);
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderTypeEnum.TAKEAWAY });

      const orderData = { ...mockCreateOrderData, items: [] };
      const result = await service.createOrder(orderData);

      expect(result).toEqual(mockOrder);
      expect(mockIndexedDBOrderItemRepo.create).not.toHaveBeenCalled();
    });

    it('should handle cart items with no extras', async () => {
      mockIndexedDBOrderRepo.getNextOrderNumber.mockResolvedValue('ORD-003');
      mockIndexedDBOrderRepo.create.mockResolvedValue(mockOrder);
      mockIndexedDBOrderItemRepo.create.mockResolvedValue(mockOrderItem);
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderTypeEnum.TAKEAWAY });

      const itemWithNoExtras: CartItem = { ...mockCartItem, extraIds: [] };
      const orderData = { ...mockCreateOrderData, items: [itemWithNoExtras] };

      await service.createOrder(orderData);

      expect(mockIndexedDBOrderItemExtraRepo.create).not.toHaveBeenCalled();
    });

    it('should handle order without table (takeaway/delivery)', async () => {
      const orderWithoutTable = { ...mockOrder, tableId: null };
      mockIndexedDBOrderRepo.findById.mockResolvedValue(orderWithoutTable);
      mockIndexedDBOrderRepo.update.mockResolvedValue({ ...orderWithoutTable, statusId: 6 });
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.COMPLETED });

      await service.updateOrderStatus(1, 6);

      // Should not try to update table status
      expect(mockTableService.updateTableStatus).not.toHaveBeenCalled();
    });

    it('should calculate tax correctly when adding items', async () => {
      mockIndexedDBOrderRepo.findById.mockResolvedValue(mockOrder);
      mockIndexedDBOrderItemRepo.create.mockResolvedValue(mockOrderItem);
      mockIndexedDBOrderRepo.update.mockImplementation(
        async (id: number, data: Partial<Order>) => ({
          ...mockOrder,
          ...data,
        }),
      );
      mockEnumMappingService.getCodeTableId.mockResolvedValue(1);
      mockIndexedDBOrderItemRepo.findByOrderId.mockResolvedValue([mockOrderItem]);
      mockEnumMappingService.getEnumFromId.mockResolvedValue({ code: OrderStatusEnum.OPEN });

      await service.addItemsToOrder(1, [mockCartItem]);

      // Verify tax calculation (18% tax rate)
      const updateCall = mockIndexedDBOrderRepo.update.mock.calls[0];
      const updateData = updateCall[1];
      const expectedSubtotal = mockOrder.subtotal + mockCartItem.lineTotal;
      const expectedTax = (expectedSubtotal * TAX_RATE) / (1 + TAX_RATE);

      expect(updateData.subtotal).toBe(expectedSubtotal);
      expect(Math.abs(updateData.tax - expectedTax)).toBeLessThan(0.01);
    });
  });

  describe('Order Status Transitions', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
      mockIndexedDBOrderItemRepo.findByOrderId.mockResolvedValue([mockOrderItem]);
      mockIndexedDBOrderRepo.findById.mockResolvedValue(mockOrder);
      mockIndexedDBOrderRepo.update.mockResolvedValue(mockOrder);
    });

    it('should handle order with no items', async () => {
      mockIndexedDBOrderItemRepo.findByOrderId.mockResolvedValue([]);
      mockIndexedDBOrderItemRepo.update.mockResolvedValue(mockOrderItem);

      await service.updateOrderItemStatus(1, 3);

      // Should not update order status when no items exist
      expect(mockIndexedDBOrderRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockPlatformService.isTauri.mockReturnValue(false);
    });

    it('should handle repository errors in getOrderById', async () => {
      mockIndexedDBOrderRepo.findById.mockRejectedValue(new Error('Database connection lost'));

      await expect(service.getOrderById(1)).rejects.toThrow('Database connection lost');
    });

    it('should handle repository errors in getAllOrders', async () => {
      mockIndexedDBOrderRepo.findAll.mockRejectedValue(new Error('Query failed'));

      await expect(service.getAllOrders()).rejects.toThrow('Query failed');
    });

    it('should propagate errors from enum mapping service', async () => {
      mockEnumMappingService.getCodeTableId.mockRejectedValue(new Error('Invalid enum code'));

      await expect(service.getOrdersByStatus(OrderStatusEnum.OPEN)).rejects.toThrow(
        'Invalid enum code',
      );
    });

    it('should handle errors during order item creation', async () => {
      mockIndexedDBOrderRepo.getNextOrderNumber.mockResolvedValue('ORD-004');
      mockIndexedDBOrderRepo.create.mockResolvedValue(mockOrder);
      mockIndexedDBOrderItemRepo.create.mockRejectedValue(new Error('Item creation failed'));

      await expect(service.createOrder(mockCreateOrderData)).rejects.toThrow(
        'Failed to create order: Item creation failed',
      );
    });
  });
});
