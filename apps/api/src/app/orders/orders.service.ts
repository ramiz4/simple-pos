import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, createOrderDto: CreateOrderDto) {
    const { items, ...orderData } = createOrderDto;

    return this.prisma.withRls(tenantId, (tx) =>
      tx.order.create({
        data: {
          ...orderData,
          tenantId,
          userId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              tenantId,
            })),
          },
        },
        include: {
          items: true,
        },
      }),
    );
  }

  async findAll(tenantId: string) {
    return this.prisma.withRls(tenantId, (tx) =>
      tx.order.findMany({
        where: {
          tenantId,
        },
        include: {
          items: true,
          customer: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    );
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.withRls(tenantId, (tx) =>
      tx.order.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      }),
    );

    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    return order;
  }

  async update(tenantId: string, id: string, updateOrderDto: UpdateOrderDto) {
    // Explicitly strip items to prevent runtime issues if passed in request body
    const { items: _items, ...orderData } = updateOrderDto as UpdateOrderDto & { items?: unknown };

    return this.prisma.withRls(tenantId, async (tx) => {
      // Check existence and update in single transaction
      const order = await tx.order.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!order) {
        throw new NotFoundException(`Order not found`);
      }

      return tx.order.update({
        where: { id },
        data: orderData,
        include: { items: true },
      });
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.withRls(tenantId, async (tx) => {
      // Check existence and delete in single transaction
      const order = await tx.order.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!order) {
        throw new NotFoundException(`Order not found`);
      }

      // Cascade delete on items is set in schema
      return tx.order.delete({
        where: { id },
      });
    });
  }
}
