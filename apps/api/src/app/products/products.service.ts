import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createProductDto: CreateProductDto) {
    return this.prisma.withRls(tenantId, (tx) =>
      tx.product.create({
        data: {
          ...createProductDto,
          tenantId,
        },
      }),
    );
  }

  async findAll(tenantId: string) {
    return this.prisma.withRls(tenantId, (tx) =>
      tx.product.findMany({
        where: {
          tenantId,
          isDeleted: false,
        },
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.withRls(tenantId, (tx) =>
      tx.product.findFirst({
        where: {
          id,
          tenantId,
          isDeleted: false,
        },
      }),
    );

    if (!product) {
      throw new NotFoundException(`Product not found`);
    }
    return product;
  }

  async update(tenantId: string, id: string, updateProductDto: UpdateProductDto) {
    return this.prisma.withRls(tenantId, async (tx) => {
      // Check existence and update in single transaction
      const product = await tx.product.findFirst({
        where: {
          id,
          tenantId,
          isDeleted: false,
        },
      });

      if (!product) {
        throw new NotFoundException(`Product not found`);
      }

      return tx.product.update({
        where: { id },
        data: updateProductDto,
      });
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.withRls(tenantId, async (tx) => {
      // Check existence and soft delete in single transaction
      const product = await tx.product.findFirst({
        where: {
          id,
          tenantId,
          isDeleted: false,
        },
      });

      if (!product) {
        throw new NotFoundException(`Product not found`);
      }

      return tx.product.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });
  }
}
