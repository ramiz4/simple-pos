-- Enable Row Level Security for Customers table
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "customers";
CREATE POLICY tenant_isolation_policy ON "customers"
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- Enable Row Level Security for OrderItems table
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "order_items";
CREATE POLICY tenant_isolation_policy ON "order_items"
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
