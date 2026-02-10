import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrismaTransaction: any;

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
    // Create fresh mocks for each test to prevent leakage
    mockPrismaTransaction = {
      product: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      customer: {},
      order: {},
      $executeRaw: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            withRls: vi.fn((tenantId, fn) => fn(mockPrismaTransaction)),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product with RLS', async () => {
      const createDto: CreateProductDto = {
        name: 'Test Product',
        description: 'A test product',
        price: 9.99,
        stockQuantity: 100,
      };

      mockPrismaTransaction.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(mockTenantId, createDto);

      expect(prismaService.withRls).toHaveBeenCalledWith(mockTenantId, expect.any(Function));
      expect(mockPrismaTransaction.product.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          tenantId: mockTenantId,
        },
      });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return all products for a tenant with RLS', async () => {
      const mockProducts = [mockProduct];
      mockPrismaTransaction.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll(mockTenantId);

      expect(prismaService.withRls).toHaveBeenCalledWith(mockTenantId, expect.any(Function));
      expect(mockPrismaTransaction.product.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          isDeleted: false,
        },
      });
      expect(result).toEqual(mockProducts);
    });

    it('should filter out deleted products', async () => {
      mockPrismaTransaction.product.findMany.mockResolvedValue([]);

      await service.findAll(mockTenantId);

      expect(mockPrismaTransaction.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single product with RLS', async () => {
      mockPrismaTransaction.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockTenantId, mockProductId);

      expect(prismaService.withRls).toHaveBeenCalledWith(mockTenantId, expect.any(Function));
      expect(mockPrismaTransaction.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockProductId,
          tenantId: mockTenantId,
          isDeleted: false,
        },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaTransaction.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockTenantId, mockProductId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockTenantId, mockProductId)).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('update', () => {
    it('should update a product with RLS', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 19.99,
      };

      const updatedProduct = { ...mockProduct, ...updateDto };

      mockPrismaTransaction.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaTransaction.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update(mockTenantId, mockProductId, updateDto);

      expect(prismaService.withRls).toHaveBeenCalled();
      expect(mockPrismaTransaction.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: updateDto,
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      const updateDto: UpdateProductDto = { name: 'Updated' };
      mockPrismaTransaction.product.findFirst.mockResolvedValue(null);

      await expect(service.update(mockTenantId, mockProductId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a product with RLS', async () => {
      const deletedProduct = {
        ...mockProduct,
        isDeleted: true,
        deletedAt: expect.any(Date),
      };

      mockPrismaTransaction.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaTransaction.product.update.mockResolvedValue(deletedProduct);

      const result = await service.remove(mockTenantId, mockProductId);

      expect(prismaService.withRls).toHaveBeenCalled();
      expect(mockPrismaTransaction.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
      });
      expect(result.isDeleted).toBe(true);
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      mockPrismaTransaction.product.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockTenantId, mockProductId)).rejects.toThrow(NotFoundException);
    });
  });
});
