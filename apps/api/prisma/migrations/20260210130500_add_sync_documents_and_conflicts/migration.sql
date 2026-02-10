-- Create sync_documents table
CREATE TABLE "sync_documents" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "cloudId" TEXT NOT NULL,
    "localId" TEXT,
    "deviceId" TEXT,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "lastModifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_documents_pkey" PRIMARY KEY ("id")
);

-- Create sync_conflicts table
CREATE TABLE "sync_conflicts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "cloudId" TEXT NOT NULL,
    "localId" TEXT,
    "strategy" TEXT NOT NULL,
    "serverVersion" INTEGER NOT NULL,
    "clientVersion" INTEGER NOT NULL,
    "serverData" JSONB NOT NULL,
    "clientData" JSONB NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "sync_documents_tenantId_entity_cloudId_key" ON "sync_documents"("tenantId", "entity", "cloudId");
CREATE INDEX "sync_documents_tenantId_entity_updatedAt_idx" ON "sync_documents"("tenantId", "entity", "updatedAt");
CREATE INDEX "sync_documents_tenantId_entity_localId_idx" ON "sync_documents"("tenantId", "entity", "localId");
CREATE INDEX "sync_conflicts_tenantId_resolved_createdAt_idx" ON "sync_conflicts"("tenantId", "resolved", "createdAt");
CREATE INDEX "sync_conflicts_tenantId_entity_cloudId_idx" ON "sync_conflicts"("tenantId", "entity", "cloudId");

-- Foreign keys
ALTER TABLE "sync_documents" ADD CONSTRAINT "sync_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS policies
ALTER TABLE "sync_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_documents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON "sync_documents";
CREATE POLICY tenant_isolation_policy ON "sync_documents"
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE "sync_conflicts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_conflicts" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON "sync_conflicts";
CREATE POLICY tenant_isolation_policy ON "sync_conflicts"
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
