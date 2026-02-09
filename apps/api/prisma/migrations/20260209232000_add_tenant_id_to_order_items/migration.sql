-- AlterTable: Add tenantId column to order_items table
ALTER TABLE "order_items" ADD COLUMN "tenantId" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Create index on tenantId for order_items
CREATE INDEX "order_items_tenantId_idx" ON "order_items"("tenantId");

-- Note: In production, you would update existing rows with proper tenantId values
-- before removing the default constraint. For new installations, this is fine.
