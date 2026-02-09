# Simple POS API

NestJS application with PostgreSQL backend and Multi-Tenancy support via Row-Level Security (RLS).

## Database Setup

1. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   _Edit `.env` if you need to customize database credentials or ports._

2. Start the PostgreSQL database:

   ```bash
   docker-compose up -d
   ```

3. Generate Prisma Client and Apply Migrations:

   ```bash
   npx prisma migrate dev
   ```

Prisma CLI reads configuration from `prisma.config.ts` at the repo root and
loads `DATABASE_URL` from `apps/api/.env`.

This command will:

- Generate the Prisma Client
- Create tables in the database
- Apply Row-Level Security (RLS) policies automatically

## Multi-Tenancy

Multi-tenancy is enforced by the database using RLS.
The `PrismaService` provides a `withRls` method to execute queries within a tenant-context transaction.

```typescript
// Example Usage
const products = await this.prisma.withRls(tenantId, (tx) => {
  return tx.product.findMany();
});
```

The middleware `TenantMiddleware` extracts the Tenant ID from the `X-Tenant-ID` header and attaches it to the request object.
Basic Usage in controllers:

```typescript
@Get()
findAll(@Req() req: Request) {
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID header (X-Tenant-ID) is required');
  }
  return this.prisma.withRls(tenantId, tx => tx.product.findMany());
}
```

## Configuration

Check `apps/api/.env` for database connection details.
