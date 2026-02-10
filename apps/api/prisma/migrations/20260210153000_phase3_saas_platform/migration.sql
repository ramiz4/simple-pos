-- Tenant subscription and billing fields
ALTER TABLE "tenants"
    ADD COLUMN "stripeCustomerId" TEXT,
    ADD COLUMN "stripeSubscriptionId" TEXT,
    ADD COLUMN "subscriptionStatus" TEXT,
    ADD COLUMN "currentPeriodEndsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "tenants_stripeCustomerId_key" ON "tenants"("stripeCustomerId");
CREATE UNIQUE INDEX "tenants_stripeSubscriptionId_key" ON "tenants"("stripeSubscriptionId");

-- API keys for tenant integrations
CREATE TABLE "tenant_api_keys" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tenant_api_keys_tenantId_revokedAt_idx" ON "tenant_api_keys"("tenantId", "revokedAt");
CREATE INDEX "tenant_api_keys_keyPrefix_idx" ON "tenant_api_keys"("keyPrefix");

ALTER TABLE "tenant_api_keys" ADD CONSTRAINT "tenant_api_keys_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_api_keys" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON "tenant_api_keys";
CREATE POLICY tenant_isolation_policy ON "tenant_api_keys"
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- Stripe webhook event ledger for idempotency/audit
CREATE TABLE "billing_events" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_events_stripeEventId_key" ON "billing_events"("stripeEventId");
CREATE INDEX "billing_events_tenantId_processedAt_idx" ON "billing_events"("tenantId", "processedAt");
CREATE INDEX "billing_events_eventType_processedAt_idx" ON "billing_events"("eventType", "processedAt");

ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
