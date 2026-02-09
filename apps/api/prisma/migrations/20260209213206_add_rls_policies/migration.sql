-- Enable Row Level Security on tables
-- Ensure you run this AFTER creating the tables via `npx prisma migrate dev`

-- Products
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "products";
CREATE POLICY tenant_isolation_policy ON "products"
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- Orders
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "orders";
CREATE POLICY tenant_isolation_policy ON "orders"
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- Users (Be careful with auth tables!)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "users";
CREATE POLICY tenant_isolation_policy ON "users"
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
