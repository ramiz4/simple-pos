# Priority Test Files to Create

This document provides a prioritized, actionable list of test files that need to be created for the Simple POS application.

---

## Priority 1: CRITICAL - Security & Authentication (Week 1)

### 1. auth.service.spec.ts

**File:** `src/app/application/services/auth.service.spec.ts`
**Current Coverage:** 0.99% (500 lines of code)
**Why Critical:** Handles all authentication, password hashing, session management

**Key Test Areas:**

- Login with valid/invalid credentials
- Password hashing with bcrypt
- Session creation and storage
- PIN validation (4-digit)
- Account selection for multi-account users
- Username generation and collision handling
- Session persistence across reloads
- Logout and session clearing
- Error handling for database failures

**Dependencies to Mock:**

- PlatformService
- SQLiteUserRepository
- IndexedDBUserRepository
- EnumMappingService
- AccountService
- InputSanitizerService

**Estimated Test Count:** 30-40 tests

---

### 2. auth.guard.spec.ts

**File:** `src/app/core/guards/auth.guard.spec.ts`
**Current Coverage:** 0%
**Why Critical:** Protects authenticated routes

**Key Test Areas:**

- Allow authenticated users to access routes
- Redirect unauthenticated users to login
- Preserve intended URL for redirect after login
- Handle session validation failures
- Handle platform-specific behavior (desktop vs web)

**Dependencies to Mock:**

- AuthService
- Router

**Estimated Test Count:** 8-10 tests

---

### 3. role.guard.spec.ts

**File:** `src/app/core/guards/role.guard.spec.ts`
**Current Coverage:** 0%
**Why Critical:** Enforces role-based access control

**Key Test Areas:**

- Allow users with correct role
- Deny users without required role
- Redirect to unauthorized page
- Handle multiple role requirements
- Handle admin role (should have all access)
- Handle missing role data

**Dependencies to Mock:**

- AuthService
- Router

**Estimated Test Count:** 10-12 tests

---

### 4. staff.guard.spec.ts

**File:** `src/app/core/guards/staff.guard.spec.ts`
**Current Coverage:** 0%
**Why Critical:** Validates staff session state

**Key Test Areas:**

- Allow users with active staff session
- Deny users without staff session
- Redirect to staff selection
- Handle session validation errors

**Dependencies to Mock:**

- AuthService
- Router

**Estimated Test Count:** 6-8 tests

---

### 5. account.service.spec.ts

**File:** `src/app/application/services/account.service.spec.ts`
**Current Coverage:** 9.52%
**Why Critical:** Manages business accounts

**Key Test Areas:**

- Create account with validation
- Load accounts by user
- Update account information
- Delete account
- Handle account name uniqueness
- Handle database errors
- Platform-specific repository selection

**Dependencies to Mock:**

- PlatformService
- SQLiteAccountRepository
- IndexedDBAccountRepository

**Estimated Test Count:** 15-20 tests

---

### 6. user-management.service.spec.ts

**File:** `src/app/application/services/user-management.service.spec.ts`
**Current Coverage:** 0%
**Why Critical:** Manages user CRUD operations

**Key Test Areas:**

- Create user with validation
- Load all users
- Load users by account
- Update user information
- Delete user
- Handle username uniqueness
- Handle role validation
- Handle PIN validation
- Handle database errors

**Dependencies to Mock:**

- PlatformService
- SQLiteUserRepository
- IndexedDBUserRepository
- EnumMappingService

**Estimated Test Count:** 20-25 tests

---

## Priority 2: HIGH - Business Operations (Week 2-3)

### 7. order.service.spec.ts (Improve existing)

**File:** `src/app/application/services/order.service.spec.ts`
**Current Coverage:** 44.05% (449 lines)
**Why Important:** Core business logic for order management

**Additional Test Areas:**

- Create order with multiple items and extras
- Update order status (full lifecycle)
- Cancel order (restore table status)
- Calculate order totals correctly
- Handle order item creation
- Handle order item extras
- Load orders by status
- Load orders by table
- Load active orders
- Handle concurrent order creation
- Handle database transaction failures

**Estimated Additional Tests:** 25-30 tests

---

### 8. cart.service.spec.ts (Improve existing)

**File:** `src/app/application/services/cart.service.spec.ts`
**Current Coverage:** 70.23% (175 lines)
**Why Important:** Shopping cart logic with tax calculations

**Additional Test Areas:**

- Multiple cart contexts (table-based)
- Add item with extras
- Update item quantity
- Remove item
- Clear specific cart
- Clear all carts
- Tax calculation (18% VAT included in price)
- Tip handling per cart
- Cart persistence in localStorage
- Cart recovery on reload
- Edge cases (zero quantity, negative prices)

**Estimated Additional Tests:** 20-25 tests

---

### 9. inventory.service.spec.ts

**File:** `src/app/application/services/inventory.service.spec.ts`
**Current Coverage:** 46.66%
**Why Important:** Inventory tracking for products

**Key Test Areas:**

- Reduce inventory on order creation
- Restore inventory on order cancellation
- Check low stock
- Load inventory status
- Handle out-of-stock scenarios
- Handle inventory for products with variants
- Handle products without inventory tracking
- Handle concurrent inventory updates

**Dependencies to Mock:**

- PlatformService
- SQLiteProductRepository
- IndexedDBProductRepository

**Estimated Test Count:** 15-20 tests

---

## Priority 3: HIGH - Data Layer - SQLite Repositories (Week 4-5)

### 10-25. SQLite Repository Tests (16 files)

All SQLite repositories have extremely low coverage (2-14%) and are critical for the desktop application.

**Test Pattern for Each Repository:**

**Common Test Areas for All Repositories:**

- Create entity
- Find by ID
- Find all entities
- Update entity
- Delete entity
- Count entities
- Handle duplicate entries (unique constraints)
- Handle invalid IDs
- Handle database connection errors
- Handle SQL syntax errors

**Files to Create:**

1. **sqlite-account.repository.spec.ts** (Priority: Critical)
   - Current: 6.06%
   - Special tests: Find by user ID

2. **sqlite-user.repository.spec.ts** (Priority: Critical)
   - Current: 8.82%
   - Special tests: Find by username, find by account

3. **sqlite-order.repository.spec.ts** (Priority: Critical)
   - Current: 6.25%
   - Special tests: Find by status, find by table, find active orders

4. **sqlite-order-item.repository.spec.ts** (Priority: Critical)
   - Current: 7.5%
   - Special tests: Find by order ID

5. **sqlite-order-item-extra.repository.spec.ts** (Priority: High)
   - Current: 4.54%
   - Special tests: Find by order item ID

6. **sqlite-product.repository.spec.ts** (Priority: Critical)
   - Current: 8.82%
   - Special tests: Find by category, search by name

7. **sqlite-category.repository.spec.ts** (Priority: High)
   - Current: 10%
   - Special tests: Check category usage

8. **sqlite-variant.repository.spec.ts** (Priority: High)
   - Current: 9.37%
   - Special tests: Find by product

9. **sqlite-extra.repository.spec.ts** (Priority: High)
   - Current: 8.57%

10. **sqlite-ingredient.repository.spec.ts** (Priority: High)
    - Current: 8.57%

11. **sqlite-product-extra.repository.spec.ts** (Priority: Medium)
    - Current: 9.37%
    - Special tests: Find by product

12. **sqlite-product-ingredient.repository.spec.ts** (Priority: Medium)
    - Current: 7.31%
    - Special tests: Find by product

13. **sqlite-table.repository.spec.ts** (Priority: High)
    - Current: 10%
    - Special tests: Find by status

14. **sqlite-code-table.repository.spec.ts** (Priority: Medium)
    - Current: 11.32%
    - Special tests: Find by code, find by table name

15. **sqlite-code-translation.repository.spec.ts** (Priority: Medium)
    - Current: 10%

16. **sqlite-test.repository.spec.ts** (Priority: Low)
    - Current: 14.28%
    - Only for testing purposes

**Total Estimated Tests:** 240-320 tests (15-20 per repository)

---

## Priority 4: MEDIUM - UI Components - Critical Pages (Week 6-7)

### 26. login.component.spec.ts

**File:** `src/app/ui/pages/login/login.component.spec.ts`
**Current Coverage:** 0%
**Why Important:** Entry point for users

**Key Test Areas:**

- Render login form
- Validate username input
- Validate PIN input
- Submit form with valid credentials
- Show error on invalid credentials
- Handle loading state
- Navigate to appropriate page on success
- Handle account selection for multi-account users

**Estimated Test Count:** 12-15 tests

---

### 27. register.component.spec.ts

**File:** `src/app/ui/pages/register/register.component.spec.ts`
**Current Coverage:** 0%
**Why Important:** User registration flow

**Key Test Areas:**

- Render registration form
- Validate all form fields
- Show validation errors
- Create account successfully
- Handle duplicate usernames
- Show success message
- Navigate after registration

**Estimated Test Count:** 12-15 tests

---

### 28. initial-setup.component.spec.ts

**File:** `src/app/ui/pages/initial-setup/initial-setup.component.spec.ts`
**Current Coverage:** 0%
**Why Important:** First-time setup flow

**Key Test Areas:**

- Render setup wizard
- Multi-step form validation
- Create admin user
- Seed initial data
- Handle setup completion
- Navigate to dashboard

**Estimated Test Count:** 10-12 tests

---

### 29. cart-view.component.spec.ts

**File:** `src/app/ui/pages/pos/cart-view.component.spec.ts`
**Current Coverage:** 0%
**Why Important:** Shopping cart display

**Key Test Areas:**

- Display cart items
- Update item quantity
- Remove items
- Show cart totals
- Show tax breakdown
- Add/update tip
- Handle empty cart
- Navigate to payment

**Estimated Test Count:** 12-15 tests

---

### 30. payment.component.spec.ts

**File:** `src/app/ui/pages/pos/payment.component.spec.ts`
**Current Coverage:** 0%
**Why Important:** Order completion

**Key Test Areas:**

- Display order summary
- Select payment method
- Process payment
- Print receipt
- Handle payment errors
- Navigate after successful payment

**Estimated Test Count:** 10-12 tests

---

### 31. product-selection.component.spec.ts

**File:** `src/app/ui/pages/pos/product-selection.component.spec.ts`
**Current Coverage:** 0%
**Why Important:** Product browsing and selection

**Key Test Areas:**

- Display products by category
- Filter products
- Select product
- Show product variants
- Show product extras
- Add to cart with selections

**Estimated Test Count:** 12-15 tests

---

## Priority 5: MEDIUM - Admin UI Components (Week 8)

### 32-43. Admin Management Components (12 files)

**Files to Create:**

1. categories-management.component.spec.ts
2. products-management.component.spec.ts
3. variants-management.component.spec.ts
4. extras-management.component.spec.ts
5. ingredients-management.component.spec.ts
6. tables-management.component.spec.ts
7. users-management.component.spec.ts
8. backup.component.spec.ts
9. backup-settings.component.spec.ts
10. printer-settings.component.spec.ts
11. error-log.component.spec.ts
12. admin-dashboard.component.spec.ts

**Common Test Pattern:**

- Display data table with items
- Filter/search items
- Create new item (open modal/form)
- Edit existing item
- Delete item with confirmation
- Show success/error messages
- Handle loading states
- Validate form inputs

**Estimated Test Count:** 10-12 tests per component = 120-144 tests

---

## Priority 6: LOW - Supporting Components (Week 9)

### 44. update.service.spec.ts

**File:** `src/app/application/services/update.service.spec.ts`
**Current Coverage:** 0%

**Key Test Areas:**

- Check for updates
- Download and install updates
- Handle update errors
- Handle no updates available

**Estimated Test Count:** 8-10 tests

---

### 45-50. Shared Components

1. **modal.component.spec.ts**
2. **alert.component.spec.ts**
3. **button.component.spec.ts** (currently 9.09%)
4. **data-table.component.spec.ts**
5. **search-input.component.spec.ts**
6. **management-list.component.spec.ts**

**Estimated Test Count:** 8-10 tests per component = 48-60 tests

---

## Summary Statistics

### Total Test Files to Create/Improve: 50+

### By Priority:

- **Priority 1 (Critical):** 6 files, ~130-155 tests
- **Priority 2 (High - Business):** 3 files, ~60-75 tests
- **Priority 3 (High - Data Layer):** 16 files, ~240-320 tests
- **Priority 4 (Medium - Critical UI):** 6 files, ~68-84 tests
- **Priority 5 (Medium - Admin UI):** 12 files, ~120-144 tests
- **Priority 6 (Low):** 7 files, ~56-70 tests

### Total Estimated Tests: 674-848 new tests

### Estimated Timeline:

- **Week 1:** Priority 1 (Security & Auth) - 6 files
- **Week 2-3:** Priority 2 (Business Logic) - 3 files
- **Week 4-5:** Priority 3 (SQLite Repositories) - 16 files
- **Week 6-7:** Priority 4 (Critical UI) - 6 files
- **Week 8:** Priority 5 (Admin UI) - 12 files
- **Week 9:** Priority 6 (Supporting) - 7 files

**Total Timeline:** 9 weeks to comprehensive coverage

---

## Quick Start - Create These First (Day 1)

If you can only create a few tests immediately, start with these in order:

1. ✅ **auth.service.spec.ts** - Most critical security component
2. ✅ **auth.guard.spec.ts** - Protects routes
3. ✅ **role.guard.spec.ts** - Role-based access
4. ✅ **account.service.spec.ts** - Account management
5. ✅ **user-management.service.spec.ts** - User operations

These 5 test files will:

- Cover critical security components
- Increase coverage significantly
- Protect against authentication vulnerabilities
- Provide foundation for other tests

---

## Testing Resources

### Mock Data Setup

Consider creating a shared test utilities file:

- `src/test/mock-data.ts` - Common test entities
- `src/test/mock-repositories.ts` - Repository mocks
- `src/test/test-helpers.ts` - Common test utilities

### Test Templates

Use the patterns in existing tests:

- `scheduled-backup.service.spec.ts` - Excellent service test example
- `logger.service.spec.ts` - Good service with signals
- Integration tests - Good for E2E patterns

### Coverage Targets by File Type

- **Services:** 85%+ coverage
- **Guards:** 100% coverage
- **Repositories:** 80%+ coverage
- **Components:** 70%+ coverage
- **Utilities:** 90%+ coverage

---

**Generated:** 2024
**Based on:** Coverage report from Vitest with V8 coverage provider
**Current Overall Coverage:** 48.46%
**Target Overall Coverage:** 80%+
