import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

describe('CustomersService', () => {
  let service: CustomersService;
  let prismaService: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrismaTransaction: any;

  const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';
  const mockCustomerId = '660e8400-e29b-41d4-a716-446655440002';

  const mockCustomer = {
    id: mockCustomerId,
    tenantId: mockTenantId,
    localId: null,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0100',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    syncedAt: null,
  };

  beforeEach(async () => {
    // Create fresh mocks for each test to prevent leakage
    mockPrismaTransaction = {
      customer: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      product: {},
      order: {},
      $executeRaw: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: {
            withRls: vi.fn((tenantId, fn) => fn(mockPrismaTransaction)),
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer with RLS', async () => {
      const createDto: CreateCustomerDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0100',
      };

      mockPrismaTransaction.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.create(mockTenantId, createDto);

      expect(prismaService.withRls).toHaveBeenCalledWith(mockTenantId, expect.any(Function));
      expect(mockPrismaTransaction.customer.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          tenantId: mockTenantId,
        },
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findAll', () => {
    it('should return all customers for a tenant with RLS', async () => {
      const mockCustomers = [mockCustomer];
      mockPrismaTransaction.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.findAll(mockTenantId);

      expect(prismaService.withRls).toHaveBeenCalledWith(mockTenantId, expect.any(Function));
      expect(mockPrismaTransaction.customer.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockCustomers);
    });
  });

  describe('findOne', () => {
    it('should return a single customer with orders using RLS', async () => {
      const mockCustomerWithOrders = {
        ...mockCustomer,
        orders: [],
      };
      mockPrismaTransaction.customer.findFirst.mockResolvedValue(mockCustomerWithOrders);

      const result = await service.findOne(mockTenantId, mockCustomerId);

      expect(prismaService.withRls).toHaveBeenCalledWith(mockTenantId, expect.any(Function));
      expect(mockPrismaTransaction.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockCustomerId,
          tenantId: mockTenantId,
        },
        include: {
          orders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      expect(result).toEqual(mockCustomerWithOrders);
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaTransaction.customer.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockTenantId, mockCustomerId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockTenantId, mockCustomerId)).rejects.toThrow(
        'Customer not found',
      );
    });
  });

  describe('update', () => {
    it('should update a customer with RLS', async () => {
      const updateDto: UpdateCustomerDto = {
        firstName: 'Jane',
        email: 'jane.doe@example.com',
      };

      const updatedCustomer = { ...mockCustomer, ...updateDto };

      mockPrismaTransaction.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaTransaction.customer.update.mockResolvedValue(updatedCustomer);

      const result = await service.update(mockTenantId, mockCustomerId, updateDto);

      expect(prismaService.withRls).toHaveBeenCalled();
      expect(mockPrismaTransaction.customer.update).toHaveBeenCalledWith({
        where: { id: mockCustomerId },
        data: updateDto,
      });
      expect(result).toEqual(updatedCustomer);
    });

    it('should throw NotFoundException when updating non-existent customer', async () => {
      const updateDto: UpdateCustomerDto = { firstName: 'Jane' };
      mockPrismaTransaction.customer.findFirst.mockResolvedValue(null);

      await expect(service.update(mockTenantId, mockCustomerId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a customer with RLS', async () => {
      mockPrismaTransaction.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaTransaction.customer.delete.mockResolvedValue(mockCustomer);

      const result = await service.remove(mockTenantId, mockCustomerId);

      expect(prismaService.withRls).toHaveBeenCalled();
      expect(mockPrismaTransaction.customer.delete).toHaveBeenCalledWith({
        where: { id: mockCustomerId },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when deleting non-existent customer', async () => {
      mockPrismaTransaction.customer.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockTenantId, mockCustomerId)).rejects.toThrow(NotFoundException);
    });
  });
});
