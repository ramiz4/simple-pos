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

## Phase 3 SaaS Modules

The API now includes the core SaaS platform modules:

- `POST /api/v1/auth/register` - Tenant onboarding (tenant + owner + default API key)
- `GET /api/v1/tenants/me` and `PATCH /api/v1/tenants/me` - Tenant management
- `POST /api/v1/subscriptions/checkout-session` - Stripe checkout session creation
- `POST /api/v1/subscriptions/portal-session` - Stripe billing portal session
- `POST /api/v1/subscriptions/webhook` - Stripe webhook ingestion
- `GET /api/v1/analytics/*` - Tenant analytics dashboard/sales/products/staff
- `GET /api/v1/admin/*` - Super-admin tenant controls and platform usage analytics

## Phase 4 Enterprise Modules

The API now includes enterprise/on-prem capabilities:

- `GET|POST|PATCH|DELETE /api/v1/sso/providers*` - Tenant-managed SSO provider configs
- `POST /api/v1/sso/oauth/:providerId/authorize` - Start OAuth/OIDC login flow
- `GET /api/v1/sso/oauth/:providerId/callback` - OAuth/OIDC callback with JWT session issuance
- `POST /api/v1/sso/saml/:providerId/assertion` - SAML assertion login bridge (on-prem gateway pattern)
- `POST /api/v1/enterprise/custom-domain/request` - Request custom domain verification
- `POST /api/v1/enterprise/custom-domain/verify` - Verify custom domain (DNS TXT)
- `POST /api/v1/enterprise/professional-services/requests` - Create professional services request
- `GET /api/v1/admin/enterprise/professional-services/requests` - Super-admin queue management

On-prem deployment packaging is available in `deploy/enterprise/`.

### Additional Environment Variables

```bash
JWT_REFRESH_SECRET=change_me_to_a_secure_refresh_secret
BASE_DOMAIN=localhost

STRIPE_SECRET_KEY=sk_test_change_me
STRIPE_WEBHOOK_SECRET=whsec_change_me
STRIPE_PRICE_BASIC=price_basic_change_me
STRIPE_PRICE_PRO=price_pro_change_me
STRIPE_PRICE_ENTERPRISE=price_enterprise_change_me
```
