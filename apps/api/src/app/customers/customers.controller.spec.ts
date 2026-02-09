import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

describe('CustomersController', () => {
  let controller: CustomersController;
  let customersService: CustomersService;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: {
            create: vi.fn().mockResolvedValue(mockCustomer),
            findAll: vi.fn().mockResolvedValue([mockCustomer]),
            findOne: vi.fn().mockResolvedValue(mockCustomer),
            update: vi.fn().mockResolvedValue(mockCustomer),
            remove: vi.fn().mockResolvedValue(mockCustomer),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    customersService = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer with tenant isolation', async () => {
      const createDto: CreateCustomerDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0100',
      };

      const result = await controller.create(mockTenantId, createDto);

      expect(customersService.create).toHaveBeenCalledWith(mockTenantId, createDto);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findAll', () => {
    it('should return all customers for a tenant', async () => {
      const result = await controller.findAll(mockTenantId);

      expect(customersService.findAll).toHaveBeenCalledWith(mockTenantId);
      expect(result).toEqual([mockCustomer]);
    });
  });

  describe('findOne', () => {
    it('should return a single customer with tenant scoping', async () => {
      const result = await controller.findOne(mockTenantId, mockCustomerId);

      expect(customersService.findOne).toHaveBeenCalledWith(mockTenantId, mockCustomerId);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('update', () => {
    it('should update a customer with tenant isolation', async () => {
      const updateDto: UpdateCustomerDto = {
        firstName: 'Jane',
        email: 'jane.doe@example.com',
      };

      const result = await controller.update(mockTenantId, mockCustomerId, updateDto);

      expect(customersService.update).toHaveBeenCalledWith(
        mockTenantId,
        mockCustomerId,
        updateDto,
      );
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('remove', () => {
    it('should delete a customer with tenant scoping', async () => {
      const result = await controller.remove(mockTenantId, mockCustomerId);

      expect(customersService.remove).toHaveBeenCalledWith(mockTenantId, mockCustomerId);
      expect(result).toEqual(mockCustomer);
    });
  });
});
