import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: OrdersService;

  const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';
  const mockUserId = '770e8400-e29b-41d4-a716-446655440003';
  const mockOrderId = '880e8400-e29b-41d4-a716-446655440004';
  const mockProductId = '660e8400-e29b-41d4-a716-446655440001';

  const mockOrder = {
    id: mockOrderId,
    tenantId: mockTenantId,
    localId: null,
    orderNumber: 'ORD-001',
    status: 'COMPLETED',
    type: 'DINE_IN',
    subtotal: 10.0,
    tax: 1.0,
    tip: 2.0,
    totalAmount: 13.0,
    customerId: null,
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
    version: 1,
    syncedAt: null,
    items: [
      {
        id: 'item-1',
        orderId: mockOrderId,
        productId: mockProductId,
        quantity: 1,
        price: 10.0,
        total: 10.0,
        tenantId: mockTenantId,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            create: vi.fn().mockResolvedValue(mockOrder),
            findAll: vi.fn().mockResolvedValue([mockOrder]),
            findOne: vi.fn().mockResolvedValue(mockOrder),
            update: vi.fn().mockResolvedValue(mockOrder),
            remove: vi.fn().mockResolvedValue(mockOrder),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an order with tenant and user context', async () => {
      const createDto: CreateOrderDto = {
        orderNumber: 'ORD-001',
        status: 'COMPLETED',
        type: 'DINE_IN',
        subtotal: 10.0,
        tax: 1.0,
        tip: 2.0,
        totalAmount: 13.0,
        items: [
          {
            productId: mockProductId,
            quantity: 1,
            price: 10.0,
          },
        ],
      };

      const result = await controller.create(mockTenantId, mockUserId, createDto);

      expect(ordersService.create).toHaveBeenCalledWith(mockTenantId, mockUserId, createDto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('should return all orders for a tenant', async () => {
      const result = await controller.findAll(mockTenantId);

      expect(ordersService.findAll).toHaveBeenCalledWith(mockTenantId);
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('findOne', () => {
    it('should return a single order with tenant scoping', async () => {
      const result = await controller.findOne(mockTenantId, mockOrderId);

      expect(ordersService.findOne).toHaveBeenCalledWith(mockTenantId, mockOrderId);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('update', () => {
    it('should update an order with tenant isolation', async () => {
      const updateDto: UpdateOrderDto = {
        status: 'PAID',
        tip: 3.0,
      };

      const result = await controller.update(mockTenantId, mockOrderId, updateDto);

      expect(ordersService.update).toHaveBeenCalledWith(mockTenantId, mockOrderId, updateDto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('remove', () => {
    it('should delete an order with tenant scoping', async () => {
      const result = await controller.remove(mockTenantId, mockOrderId);

      expect(ordersService.remove).toHaveBeenCalledWith(mockTenantId, mockOrderId);
      expect(result).toEqual(mockOrder);
    });
  });
});
