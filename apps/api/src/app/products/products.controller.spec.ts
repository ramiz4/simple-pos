import { Test, TestingModule } from '@nestjs/testing';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: ProductsService;

  const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';
  const mockProductId = '660e8400-e29b-41d4-a716-446655440001';

  const mockProduct = {
    id: mockProductId,
    tenantId: mockTenantId,
    localId: null,
    name: 'Test Product',
    description: 'A test product',
    price: 9.99,
    categoryId: null,
    stockQuantity: 100,
    isActive: true,
    version: 1,
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    syncedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            create: vi.fn().mockResolvedValue(mockProduct),
            findAll: vi.fn().mockResolvedValue([mockProduct]),
            findOne: vi.fn().mockResolvedValue(mockProduct),
            update: vi.fn().mockResolvedValue(mockProduct),
            remove: vi.fn().mockResolvedValue(mockProduct),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product with tenant isolation', async () => {
      const createDto: CreateProductDto = {
        name: 'Test Product',
        description: 'A test product',
        price: 9.99,
        stockQuantity: 100,
      };

      const result = await controller.create(mockTenantId, createDto);

      expect(productsService.create).toHaveBeenCalledWith(mockTenantId, createDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return all products for a tenant', async () => {
      const result = await controller.findAll(mockTenantId);

      expect(productsService.findAll).toHaveBeenCalledWith(mockTenantId);
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('should return a single product with tenant scoping', async () => {
      const result = await controller.findOne(mockTenantId, mockProductId);

      expect(productsService.findOne).toHaveBeenCalledWith(mockTenantId, mockProductId);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product with tenant isolation', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 19.99,
      };

      const result = await controller.update(mockTenantId, mockProductId, updateDto);

      expect(productsService.update).toHaveBeenCalledWith(mockTenantId, mockProductId, updateDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('remove', () => {
    it('should soft delete a product with tenant scoping', async () => {
      const result = await controller.remove(mockTenantId, mockProductId);

      expect(productsService.remove).toHaveBeenCalledWith(mockTenantId, mockProductId);
      expect(result).toEqual(mockProduct);
    });
  });
});
