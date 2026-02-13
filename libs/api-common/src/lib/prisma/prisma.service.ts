import { BadRequestException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { ValidationUtils } from '@simple-pos/shared/utils';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('DATABASE_URL is required to initialize PrismaService.');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }

  /**
   * Execute a function within a transaction with Row Level Security (RLS) enabled.
   * This sets the 'app.current_tenant_id' configuration parameter for the transaction.
   *
   * @param tenantId The UUID of the tenant
   * @param fn The function to execute with the RLS-enabled transaction client
   */
  async withRls<T>(tenantId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    if (!ValidationUtils.isUuid(tenantId)) {
      throw new BadRequestException(`Invalid Tenant ID format: ${tenantId}. Must be a valid UUID.`);
    }

    return this.$transaction(async (tx) => {
      // Set the tenant ID for the current transaction
      // Use set_config with is_local=true so it resets after transaction
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;

      return fn(tx);
    });
  }
}
