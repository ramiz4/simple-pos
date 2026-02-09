-- Step 1: Add tenantId column as nullable
ALTER TABLE "order_items" ADD COLUMN "tenantId" UUID;

-- Step 2: Update existing order_items with tenantId from their parent orders
UPDATE "order_items" oi
SET "tenantId" = o."tenantId"
FROM "orders" o
WHERE oi."orderId" = o.id;

-- Step 3: Add NOT NULL constraint after data is populated
ALTER TABLE "order_items" ALTER COLUMN "tenantId" SET NOT NULL;

-- Step 4: Create index on tenantId for order_items
CREATE INDEX "order_items_tenantId_idx" ON "order_items"("tenantId");
