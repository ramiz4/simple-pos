# Task: Domain Logic Extraction

## 1. Problem Statement

While the project structure has been successfully migrated to an Nx Monorepo (Phase 0.5), the **core business logic** (tax calculations, inventory rules, order validation) is still scattered across Angular Services in `apps/pos` and NestJS Services in `apps/api`.

**Risks:**

- **Inconsistent Pricing**: If the API calculates taxes differently from the POS, sync will fail or cause data corruption.
- **Duplicated Validation**: Validation rules (e.g., "PIN must be 6 digits") are repeated in multiple places.
- **Untestable Logic**: Business rules tightly coupled with Angular/NestJS services are hard to unit test in isolation.

## 2. Extraction Strategy

We will move pure business logic to `@simple-pos/domain`. This library must remain **framework-agnostic** (no Angular/NestJS imports) to be shared by both platforms.

### 2.1 Pricing & Tax Domain

**Current Location:** `apps/pos/src/app/application/services/cart.service.ts` (Hardcoded `0.18`)
**Target:** `@simple-pos/domain/pricing`

**Tasks:**

- [ ] Move `TAX_RATE = 0.18` to a configuration constant.
- [ ] Create `PricingCalculator` class:
  - `calculateLineTotal(price, quantity)`
  - `calculateOrderSubtotal(items)`
  - `calculateTax(subtotal)`
  - `validateOrderTotals(order)` (Ensures frontend sent correct math)

### 2.2 Inventory & Stock Domain

**Current Location:** `apps/pos/src/app/application/services/inventory.service.ts`
**Target:** `@simple-pos/domain/inventory`

**Tasks:**

- [ ] Extract stock checking logic:
  - `isStockAvailable(product, quantity)`
  - `calculateIngredientUsage(product, quantity)`
- [ ] Ensure this logic is pure (takes `Product` entity as input, returns boolean/result).

### 2.3 Order Lifecycle Domain

**Current Location:** `apps/pos/src/app/application/services/order.service.ts`
**Target:** `@simple-pos/domain/orders`

**Tasks:**

- [ ] Define valid status transitions (e.g., `OPEN` -> `PREPARING` -> `READY` -> `SERVED` -> `COMPLETED`).
- [ ] Create `OrderStateMachine`:
  - `canTransition(currentStatus, newStatus)`
  - `getNextStatus(currentStatus)`

### 2.4 Cart Management Domain

**Current Location:** `apps/pos/src/app/application/services/cart.service.ts`
**Target:** `@simple-pos/domain/cart`

**Tasks:**

- [ ] Extract "Item Merging" logic (identifying identical items in cart):
  - `areCartItemsEqual(itemA, itemB)`: Compares variants, extras, and notes.
- [ ] Extract "Cart Summary" logic:
  - `summarizeCart(items)`: Returns total count, distinct items, total price.

### 2.5 Reporting & Analytics

**Current Location:** `apps/pos/src/app/application/services/reporting.service.ts`
**Target:** `@simple-pos/domain/reporting`

**Tasks:**

- [ ] Move aggregation functions:
  - `aggregateDailyRevenue(orders)`
  - `groupByOrderType(orders)`
  - `calculateAverageOrderValue(orders)`

---

## 3. Implementation Steps

### Step 1: Create Domain Sub-entry Points

Update `libs/domain/package.json` (or `project.json`) to export these new modules if necessary, or simply organize folders within `libs/domain/src/lib/`.

```typescript
// libs/domain/src/index.ts
export * from './lib/pricing';
export * from './lib/inventory';
export * from './lib/orders';
export * from './lib/cart';
export * from './lib/reporting';
```

### Step 2: Refactor `apps/pos`

1. Replace hardcoded math in `CartService` with `PricingCalculator`.
2. Replace duplication logic with `areCartItemsEqual`.
3. Use `OrderStateMachine` for status updates.

### Step 3: Refactor `apps/api`

1. Use `PricingCalculator.validateOrderTotals()` in `OrdersService.create()` to reject tampered requests.
2. Use `OrderStateMachine` to validate status updates from clients.

### Step 4: Verification

- Write pure unit tests for all new Domain classes (100% coverage is easy here).
- Ensure integration tests in POS and API still pass.

## 4. Definition of Done

- [ ] All `TAX_RATE` references come from `@simple-pos/domain`.
- [ ] `CartService` (POS) and `OrdersService` (API) share the same total calculation logic.
- [ ] Inventory checks are identical on client (pre-check) and server (final check).
- [ ] No business logic remains in Framework Services (Angular/NestJS).
