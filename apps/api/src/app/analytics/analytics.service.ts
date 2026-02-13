import { Injectable } from '@nestjs/common';
import { PrismaService } from '@simple-pos/api-common';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(tenantId: string, days = 30) {
    const windowStart = this.windowStart(days);

    const orders = await this.prisma.withRls(tenantId, (tx) =>
      tx.order.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: windowStart,
          },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
      }),
    );

    const totalSales = orders.reduce((sum, order) => sum + this.toNumber(order.totalAmount), 0);
    const orderCount = orders.length;

    const [activeProducts, activeCustomers] = await this.prisma.withRls(tenantId, async (tx) => {
      const [products, customers] = await Promise.all([
        tx.product.count({
          where: {
            tenantId,
            isDeleted: false,
            isActive: true,
          },
        }),
        tx.customer.count({
          where: {
            tenantId,
          },
        }),
      ]);

      return [products, customers] as const;
    });

    return {
      generatedAt: new Date().toISOString(),
      period: {
        days,
        start: windowStart.toISOString(),
      },
      summary: {
        totalSales,
        orderCount,
        averageOrderValue: orderCount === 0 ? 0 : totalSales / orderCount,
        activeProducts,
        activeCustomers,
      },
    };
  }

  async sales(tenantId: string, days = 30) {
    const windowStart = this.windowStart(days);

    const orders = await this.prisma.withRls(tenantId, (tx) =>
      tx.order.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: windowStart,
          },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    );

    const byDay = new Map<string, { orders: number; revenue: number }>();

    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const existing = byDay.get(day) ?? { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += this.toNumber(order.totalAmount);
      byDay.set(day, existing);
    }

    return {
      generatedAt: new Date().toISOString(),
      period: {
        days,
        start: windowStart.toISOString(),
      },
      totals: {
        orders: orders.length,
        revenue: orders.reduce((sum, order) => sum + this.toNumber(order.totalAmount), 0),
      },
      series: Array.from(byDay.entries()).map(([date, value]) => ({
        date,
        orders: value.orders,
        revenue: value.revenue,
      })),
    };
  }

  async products(tenantId: string, days = 30) {
    const windowStart = this.windowStart(days);

    const items = await this.prisma.withRls(tenantId, (tx) =>
      tx.orderItem.findMany({
        where: {
          tenantId,
          order: {
            createdAt: {
              gte: windowStart,
            },
          },
        },
        select: {
          quantity: true,
          total: true,
          productId: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      }),
    );

    const byProduct = new Map<
      string,
      { productId: string; name: string; quantity: number; revenue: number }
    >();

    for (const item of items) {
      const key = item.productId;
      const existing = byProduct.get(key) ?? {
        productId: item.productId,
        name: item.product?.name ?? 'Unknown Product',
        quantity: 0,
        revenue: 0,
      };

      existing.quantity += item.quantity;
      existing.revenue += this.toNumber(item.total);
      byProduct.set(key, existing);
    }

    const products = Array.from(byProduct.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    return {
      generatedAt: new Date().toISOString(),
      period: {
        days,
        start: windowStart.toISOString(),
      },
      products,
    };
  }

  async staff(tenantId: string, days = 30) {
    const windowStart = this.windowStart(days);

    const orders = await this.prisma.withRls(tenantId, (tx) =>
      tx.order.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: windowStart,
          },
          userId: {
            not: null,
          },
        },
        select: {
          totalAmount: true,
          userId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    );

    const byStaff = new Map<
      string,
      { userId: string; name: string; role: string; orders: number; revenue: number }
    >();

    for (const order of orders) {
      if (!order.userId) {
        continue;
      }

      const existing = byStaff.get(order.userId) ?? {
        userId: order.userId,
        name:
          `${order.user?.firstName ?? ''} ${order.user?.lastName ?? ''}`.trim() ||
          order.user?.email ||
          'Unknown User',
        role: order.user?.role ?? 'UNKNOWN',
        orders: 0,
        revenue: 0,
      };

      existing.orders += 1;
      existing.revenue += this.toNumber(order.totalAmount);
      byStaff.set(order.userId, existing);
    }

    return {
      generatedAt: new Date().toISOString(),
      period: {
        days,
        start: windowStart.toISOString(),
      },
      staff: Array.from(byStaff.values()).sort((a, b) => b.revenue - a.revenue),
    };
  }

  private windowStart(days: number): Date {
    const normalizedDays = Number.isFinite(days)
      ? Math.min(Math.max(Math.floor(days), 1), 365)
      : 30;
    return new Date(Date.now() - normalizedDays * 24 * 60 * 60 * 1000);
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (value && typeof value === 'object' && 'toNumber' in value) {
      return (value as { toNumber: () => number }).toNumber();
    }

    if (value === null || value === undefined) {
      return 0;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
