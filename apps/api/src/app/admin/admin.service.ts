import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface RevenueAggregate {
  _count: { _all: number };
  _sum: { totalAmount: unknown };
  tenantId: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(params: {
    search?: string;
    status?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    const where = {
      ...(params.search
        ? {
            OR: [
              {
                name: {
                  contains: params.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                subdomain: {
                  contains: params.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(params.status ? { status: params.status.toUpperCase() } : {}),
      ...(params.plan ? { plan: params.plan.toUpperCase() } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: offset,
        take: Math.min(Math.max(limit, 1), 200),
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          customDomain: true,
          plan: true,
          status: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              products: true,
              orders: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      total,
      limit,
      offset,
      items,
    };
  }

  async suspendTenant(tenantId: string) {
    await this.ensureTenantExists(tenantId);

    return this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        status: 'SUSPENDED',
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async activateTenant(tenantId: string) {
    await this.ensureTenantExists(tenantId);

    return this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async usageOverview() {
    const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      tenants,
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      recentOrderAgg,
      unresolvedConflictAgg,
    ] = await Promise.all([
      this.prisma.tenant.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          plan: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              products: true,
              customers: true,
              orders: true,
              syncDocuments: true,
            },
          },
        },
      }),
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { status: 'TRIAL' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.order.groupBy({
        by: ['tenantId'],
        where: {
          createdAt: {
            gte: windowStart,
          },
        },
        _count: {
          _all: true,
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.syncConflict.groupBy({
        by: ['tenantId'],
        where: {
          resolved: false,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const orderAggregateMap = new Map<string, RevenueAggregate>(
      recentOrderAgg.map((row) => [
        row.tenantId,
        {
          tenantId: row.tenantId,
          _count: row._count,
          _sum: row._sum,
        },
      ]),
    );

    const unresolvedConflictMap = new Map<string, number>(
      unresolvedConflictAgg.map((row) => [row.tenantId, row._count._all]),
    );

    const tenantUsage = tenants.map((tenant) => {
      const orderAggregate = orderAggregateMap.get(tenant.id);
      const last30DaysRevenue = this.toNumber(orderAggregate?._sum.totalAmount);
      const last30DaysOrders = orderAggregate?._count._all ?? 0;

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        status: tenant.status,
        createdAt: tenant.createdAt,
        users: tenant._count.users,
        products: tenant._count.products,
        customers: tenant._count.customers,
        orders: tenant._count.orders,
        syncDocuments: tenant._count.syncDocuments,
        unresolvedSyncConflicts: unresolvedConflictMap.get(tenant.id) ?? 0,
        last30DaysOrders,
        last30DaysRevenue,
      };
    });

    const totalRevenue30d = tenantUsage.reduce((sum, tenant) => sum + tenant.last30DaysRevenue, 0);
    const totalOrders30d = tenantUsage.reduce((sum, tenant) => sum + tenant.last30DaysOrders, 0);

    return {
      generatedAt: new Date().toISOString(),
      window: {
        days: 30,
        start: windowStart.toISOString(),
      },
      totals: {
        totalTenants,
        activeTenants,
        trialTenants,
        suspendedTenants,
        totalRevenue30d,
        totalOrders30d,
      },
      tenants: tenantUsage,
    };
  }

  async platformAnalytics() {
    const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [orders, billingEvents, newTenants] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: windowStart,
          },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
      }),
      this.prisma.billingEvent.findMany({
        where: {
          createdAt: {
            gte: windowStart,
          },
        },
        select: {
          createdAt: true,
          eventType: true,
        },
      }),
      this.prisma.tenant.findMany({
        where: {
          createdAt: {
            gte: windowStart,
          },
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    const dailyOrders = this.bucketByDay(orders, (item) => this.toNumber(item.totalAmount));
    const dailyBillingEvents = this.bucketByDay(billingEvents, () => 1);
    const dailyNewTenants = this.bucketByDay(newTenants, () => 1);

    return {
      generatedAt: new Date().toISOString(),
      window: {
        days: 7,
        start: windowStart.toISOString(),
      },
      totals: {
        orders: orders.length,
        revenue: orders.reduce((sum, order) => sum + this.toNumber(order.totalAmount), 0),
        billingEvents: billingEvents.length,
        newTenants: newTenants.length,
      },
      series: {
        orders: dailyOrders,
        billingEvents: dailyBillingEvents,
        newTenants: dailyNewTenants,
      },
    };
  }

  private async ensureTenantExists(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (value && typeof value === 'object' && 'toNumber' in value) {
      const typedValue = value as { toNumber: () => number };
      return typedValue.toNumber();
    }

    if (value === null || value === undefined) {
      return 0;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private bucketByDay<T extends { createdAt: Date }>(
    items: T[],
    valueResolver: (item: T) => number,
  ) {
    const map = new Map<string, number>();

    for (const item of items) {
      const dayKey = item.createdAt.toISOString().slice(0, 10);
      map.set(dayKey, (map.get(dayKey) ?? 0) + valueResolver(item));
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        value,
      }));
  }
}
