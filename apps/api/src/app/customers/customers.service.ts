import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@simple-pos/api-common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createCustomerDto: CreateCustomerDto) {
    return this.prisma.withRls(tenantId, (tx) =>
      tx.customer.create({
        data: {
          ...createCustomerDto,
          tenantId,
        },
      }),
    );
  }

  async findAll(tenantId: string) {
    return this.prisma.withRls(tenantId, (tx) =>
      tx.customer.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          // Good practice for customers
          createdAt: 'desc',
        },
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.withRls(tenantId, (tx) =>
      tx.customer.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          orders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    );

    if (!customer) {
      throw new NotFoundException(`Customer not found`);
    }
    return customer;
  }

  async update(tenantId: string, id: string, updateCustomerDto: UpdateCustomerDto) {
    return this.prisma.withRls(tenantId, async (tx) => {
      // Check existence and update in single transaction
      const customer = await tx.customer.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!customer) {
        throw new NotFoundException(`Customer not found`);
      }

      return tx.customer.update({
        where: { id },
        data: updateCustomerDto,
      });
    });
  }

  // Usually we don't delete customers, but maybe we can soft delete if needed.
  // Schema doesn't have isDeleted for Customer, so I'll skip remove for now or implement hard delete.
  async remove(tenantId: string, id: string) {
    return this.prisma.withRls(tenantId, async (tx) => {
      // Check existence and delete in single transaction
      const customer = await tx.customer.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!customer) {
        throw new NotFoundException(`Customer not found`);
      }

      return tx.customer.delete({
        where: { id },
      });
    });
  }
}
