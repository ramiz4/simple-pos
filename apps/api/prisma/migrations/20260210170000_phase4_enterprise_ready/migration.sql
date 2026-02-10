-- Phase 4 Enterprise Ready: SSO, custom domain verification, professional services

ALTER TABLE "tenants"
    ADD COLUMN "customDomainStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    ADD COLUMN "customDomainVerificationToken" TEXT,
    ADD COLUMN "customDomainVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "tenants_customDomain_key" ON "tenants"("customDomain");

CREATE TABLE "sso_providers" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "authorizationUrl" TEXT,
    "tokenUrl" TEXT,
    "userInfoUrl" TEXT,
    "issuer" TEXT,
    "entryPoint" TEXT,
    "callbackUrl" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roleMappings" JSONB,
    "claimMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sso_providers_tenantId_slug_key" ON "sso_providers"("tenantId", "slug");
CREATE INDEX "sso_providers_tenantId_enabled_idx" ON "sso_providers"("tenantId", "enabled");

ALTER TABLE "sso_providers" ADD CONSTRAINT "sso_providers_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "professional_service_requests" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "requestedByUserId" UUID,
    "requesterEmail" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "preferredContact" JSONB,
    "assignedTo" TEXT,
    "internalNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "professional_service_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "professional_service_requests_tenantId_status_createdAt_idx"
    ON "professional_service_requests"("tenantId", "status", "createdAt");
CREATE INDEX "professional_service_requests_status_createdAt_idx"
    ON "professional_service_requests"("status", "createdAt");

ALTER TABLE "professional_service_requests" ADD CONSTRAINT "professional_service_requests_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_service_requests" ADD CONSTRAINT "professional_service_requests_requestedByUserId_fkey"
    FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
