import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@simple-pos/api-common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrismaTransaction: any;

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
    // Create fresh mocks for each test to prevent leakage
    mockPrismaTransaction = {
      order: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      product: {},
      customer: {},
      $executeRaw: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            withRls: vi.fn((tenantId, fn) => fn(mockPrismaTransaction)),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order with items and RLS', async () => {
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

      mockPrismaTransaction.order.create.mockResolvedValue(mockOrder);

      const result = await service.create(mockTenantId, mockUserId, createDto);

      expect(prismaService.withRls).toHaveBeenCalledWith(mockTenantId, expect.any(Function));
      expect(mockPrismaTransaction.order.create).toHaveBeenCalledWith({
        data: {
          orderNumber: createDto.orderNumber,
          status: createDto.status,
          type: createDto.type,
          subtotal: createDto.subtotal,
          tax: createDto.tax,
          tip: createDto.tip,
          totalAmount: createDto.totalAmount,
          tenantId: mockTenantId,
          userId: mockUserId,
          items: {
            create: [
              {
                productId: mockProductId,
                quantity: 1,
                price: 10.0,
                total: 10.0,
                tenantId: mockTenantId,
              },
            ],
          },
        },
        include: {
          items: true,
        },
      });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('should return all orders for a tenant with RLS', async () => {
      const mockOrders = [mockOrder];
      mockPrismaTransaction.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll(mockTenantId);

      expect(prismaService.withRls).toHaveBeenCalledWith(mockTenantId, expect.any(Function));
      expect(mockPrismaTransaction.order.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
        },
        include: {
          items: true,
          customer: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockOrders);
    });
  });

  describe('findOne', () => {
    it('should return a single order with items and customer using RLS', async () => {
      mockPrismaTransaction.order.findFirst.mockResolvedValue(mockOrder);

      const result = await service.findOne(mockTenantId, mockOrderId);

      expect(prismaService.withRls).toHaveBeenCalledWith(mockTenantId, expect.any(Function));
      expect(mockPrismaTransaction.order.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockOrderId,
          tenantId: mockTenantId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaTransaction.order.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockTenantId, mockOrderId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockTenantId, mockOrderId)).rejects.toThrow('Order not found');
    });
  });

  describe('update', () => {
    it('should update an order with RLS (without items)', async () => {
      const updateDto: UpdateOrderDto = {
        status: 'PAID',
        tip: 3.0,
      };

      const updatedOrder = { ...mockOrder, ...updateDto };

      mockPrismaTransaction.order.findFirst.mockResolvedValue(mockOrder);
      mockPrismaTransaction.order.update.mockResolvedValue(updatedOrder);

      const result = await service.update(mockTenantId, mockOrderId, updateDto);

      expect(prismaService.withRls).toHaveBeenCalled();
      expect(mockPrismaTransaction.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: updateDto,
        include: { items: true },
      });
      expect(result).toEqual(updatedOrder);
    });

    it('should strip items field if provided in update payload', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateDtoWithItems: any = {
        status: 'PAID',
        tip: 3.0,
        items: [{ productId: 'some-id', quantity: 5, price: 15.0 }],
      };

      const updatedOrder = { ...mockOrder, status: 'PAID', tip: 3.0 };

      mockPrismaTransaction.order.findFirst.mockResolvedValue(mockOrder);
      mockPrismaTransaction.order.update.mockResolvedValue(updatedOrder);

      const result = await service.update(mockTenantId, mockOrderId, updateDtoWithItems);

      expect(prismaService.withRls).toHaveBeenCalled();
      expect(mockPrismaTransaction.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: { status: 'PAID', tip: 3.0 },
        include: { items: true },
      });
      expect(result).toEqual(updatedOrder);
    });

    it('should throw NotFoundException when updating non-existent order', async () => {
      const updateDto: UpdateOrderDto = { status: 'PAID' };
      mockPrismaTransaction.order.findFirst.mockResolvedValue(null);

      await expect(service.update(mockTenantId, mockOrderId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an order with RLS', async () => {
      mockPrismaTransaction.order.findFirst.mockResolvedValue(mockOrder);
      mockPrismaTransaction.order.delete.mockResolvedValue(mockOrder);

      const result = await service.remove(mockTenantId, mockOrderId);

      expect(prismaService.withRls).toHaveBeenCalled();
      expect(mockPrismaTransaction.order.delete).toHaveBeenCalledWith({
        where: { id: mockOrderId },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when deleting non-existent order', async () => {
      mockPrismaTransaction.order.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockTenantId, mockOrderId)).rejects.toThrow(NotFoundException);
    });
  });
});
