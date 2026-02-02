import { TestBed } from '@angular/core/testing';
import { Order } from '../../domain/entities';
import { OrderStatusEnum } from '../../domain/enums';
import { EnumMappingService } from './enum-mapping.service';
import { OrderService } from './order.service';
import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  let service: ReportingService;
  let orderService: any;
  let enumMappingService: any;

  const mockDate = new Date('2024-03-20T12:00:00Z');

  // Helper to create mock orders
  const createMockOrder = (
    id: number,
    total: number,
    statusId: number,
    typeId: number,
    date: string = mockDate.toISOString(),
  ): Order =>
    ({
      id,
      code: `ORD-${id}`,
      orderNumber: `ORD-${id}`,
      statusId,
      typeId,
      total,
      subtotal: total * 0.9,
      tax: total * 0.1,
      discount: 0,
      tip: 0,
      createdAt: date,
      updatedAt: date,
      items: [],
    }) as unknown as Order;

  beforeEach(() => {
    orderService = {
      getAllOrders: vi.fn(),
      getOrderItems: vi.fn(),
    };

    enumMappingService = {
      getCodeTableId: vi.fn(),
      getTranslation: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ReportingService,
        { provide: OrderService, useValue: orderService },
        { provide: EnumMappingService, useValue: enumMappingService },
      ],
    });

    service = TestBed.inject(ReportingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDailyRevenue', () => {
    it('should calculate revenue for today correctly', async () => {
      // Setup mocks
      const completedStatusId = 100;
      enumMappingService.getCodeTableId.mockResolvedValue(completedStatusId);

      const today = new Date();
      const orders = [
        createMockOrder(1, 100, completedStatusId, 1, today.toISOString()), // Today, Completed
        createMockOrder(2, 50, completedStatusId, 1, today.toISOString()), // Today, Completed
        createMockOrder(3, 75, 999, 1, today.toISOString()), // Today, Not Completed
      ];

      orderService.getAllOrders.mockResolvedValue(orders);

      const result = await service.getDailyRevenue();

      expect(result.totalRevenue).toBe(150); // 100 + 50
      expect(result.totalOrders).toBe(2);
      expect(result.averageOrderValue).toBe(75); // 150 / 2
    });
  });

  describe('getRevenueByOrderType', () => {
    it('should breakdown revenue by order type', async () => {
      // Setup mocks
      const paidId = 200;
      enumMappingService.getCodeTableId.mockImplementation(async (type: string, val: any) => {
        if (val === OrderStatusEnum.PAID) return paidId;
        return 0;
      });

      // Mock translations for types
      enumMappingService.getTranslation.mockImplementation(async (id: number) => {
        if (id === 1) return 'DINE_IN';
        if (id === 2) return 'TAKEAWAY';
        return 'UNKNOWN';
      });

      const orders = [
        createMockOrder(1, 100, paidId, 1), // Dine-in
        createMockOrder(2, 50, paidId, 1), // Dine-in
        createMockOrder(3, 30, paidId, 2), // Takeaway
      ];

      orderService.getAllOrders.mockResolvedValue(orders);

      const result = await service.getRevenueByOrderType();

      expect(result).toHaveLength(2);

      const dineIn = result.find((r) => r.orderType === 'DINE_IN');
      expect(dineIn).toBeDefined();
      expect(dineIn?.revenue).toBe(150);
      expect(dineIn?.orderCount).toBe(2);

      const takeaway = result.find((r) => r.orderType === 'TAKEAWAY');
      expect(takeaway).toBeDefined();
      expect(takeaway?.revenue).toBe(30);
      expect(takeaway?.orderCount).toBe(1);
    });
  });

  describe('generateZReport', () => {
    it('should generate a complete Z-Report', async () => {
      const completedStatusId = 100;
      enumMappingService.getCodeTableId.mockResolvedValue(completedStatusId);
      enumMappingService.getTranslation.mockResolvedValue('MOCK');

      orderService.getOrderItems.mockResolvedValue([{ quantity: 2 }, { quantity: 1 }]); // 3 items per order

      const orders = [createMockOrder(1, 100, completedStatusId, 1)];

      orderService.getAllOrders.mockResolvedValue(orders);

      const report = await service.generateZReport({
        startDate: new Date('2020-01-01').toISOString(),
        endDate: new Date('2030-01-01').toISOString(),
      });

      expect(report.totalRevenue).toBe(100);
      expect(report.itemsSold).toBe(3); // 1 order * 3 items
      expect(report.totalVAT).toBe(10); // 10% of 100
      expect(report.revenueByPaymentMethod[0].amount).toBe(100);
    });
  });
});
