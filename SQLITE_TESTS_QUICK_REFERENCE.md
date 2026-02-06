# Quick Reference: SQLite Repository Tests

## Running Tests

### All SQLite Repository Tests (331 tests)

```bash
npm test -- --run sqlite-account.repository.spec.ts sqlite-order.repository.spec.ts sqlite-product.repository.spec.ts sqlite-user.repository.spec.ts sqlite-category.repository.spec.ts sqlite-ingredient.repository.spec.ts sqlite-extra.repository.spec.ts sqlite-order-item.repository.spec.ts sqlite-table.repository.spec.ts sqlite-order-item-extra.repository.spec.ts
```

### Individual Repository Tests

```bash
npm test -- --run sqlite-account.repository.spec.ts      # 29 tests
npm test -- --run sqlite-order.repository.spec.ts        # 33 tests
npm test -- --run sqlite-product.repository.spec.ts      # 37 tests
npm test -- --run sqlite-user.repository.spec.ts         # 42 tests
npm test -- --run sqlite-category.repository.spec.ts     # 29 tests
npm test -- --run sqlite-ingredient.repository.spec.ts   # 31 tests
npm test -- --run sqlite-extra.repository.spec.ts        # 29 tests
npm test -- --run sqlite-order-item.repository.spec.ts   # 32 tests
npm test -- --run sqlite-table.repository.spec.ts        # 33 tests
npm test -- --run sqlite-order-item-extra.repository.spec.ts  # 36 tests
```

### With Coverage

```bash
npm test -- --run --coverage sqlite-account.repository.spec.ts
```

### Watch Mode (for development)

```bash
npm test -- sqlite-account.repository.spec.ts
```

## Test Coverage Results

| Repository                  | Coverage                | Tests |
| --------------------------- | ----------------------- | ----- |
| **sqlite-account**          | 100%                    | 29 ✅ |
| **sqlite-order**            | 100% (branches: 92.85%) | 33 ✅ |
| **sqlite-product**          | 100%                    | 37 ✅ |
| **sqlite-user**             | 100%                    | 42 ✅ |
| **sqlite-category**         | 100%                    | 29 ✅ |
| **sqlite-ingredient**       | 100%                    | 31 ✅ |
| **sqlite-extra**            | 100%                    | 29 ✅ |
| **sqlite-order-item**       | 100%                    | 32 ✅ |
| **sqlite-table**            | 100%                    | 33 ✅ |
| **sqlite-order-item-extra** | 100%                    | 36 ✅ |

**Total: 331 tests, all passing ✅**

## What Each Test Suite Covers

### Core Functionality (all repositories)

- ✅ Database initialization
- ✅ CRUD operations (create, read, update, delete)
- ✅ Count operations
- ✅ Error handling
- ✅ SQL injection prevention
- ✅ Edge cases

### Repository-Specific Features

#### Account Repository

- findByEmail()
- Active/inactive status management

#### Order Repository

- findActiveOrders()
- findByStatus()
- findByTable()
- findByTableAndStatus()
- getNextOrderNumber() - auto-incrementing order numbers
- Customer name handling
- Order status transitions

#### Product Repository

- findByCategory()
- Stock management
- Availability toggling
- Price handling

#### User Repository

- findByName()
- findByNameAndAccount()
- findByAccountId()
- findByEmail()
- Owner vs Staff differentiation
- Account-scoped usernames

#### Order Item Repository

- findByOrderId()
- deleteByOrderId()
- Status management
- Variant support

#### Order Item Extra Repository

- findByOrderItemId()
- findByOrderId()
- deleteByOrderItemId()
- deleteByOrderId()
- Many-to-many relationships
- Composite primary keys

## Expected Test Output

```
✓ sqlite-account.repository.spec.ts (29 tests)
✓ sqlite-order.repository.spec.ts (33 tests)
✓ sqlite-product.repository.spec.ts (37 tests)
✓ sqlite-user.repository.spec.ts (42 tests)
✓ sqlite-category.repository.spec.ts (29 tests)
✓ sqlite-ingredient.repository.spec.ts (31 tests)
✓ sqlite-extra.repository.spec.ts (29 tests)
✓ sqlite-order-item.repository.spec.ts (32 tests)
✓ sqlite-table.repository.spec.ts (33 tests)
✓ sqlite-order-item-extra.repository.spec.ts (36 tests)

Test Files: 10 passed (10)
Tests: 331 passed (331)
Duration: ~3.5s
```

## Test File Locations

All test files are in: `src/app/infrastructure/repositories/`

```
src/app/infrastructure/repositories/
├── sqlite-account.repository.spec.ts
├── sqlite-category.repository.spec.ts
├── sqlite-extra.repository.spec.ts
├── sqlite-ingredient.repository.spec.ts
├── sqlite-order.repository.spec.ts
├── sqlite-order-item.repository.spec.ts
├── sqlite-order-item-extra.repository.spec.ts
├── sqlite-product.repository.spec.ts
├── sqlite-table.repository.spec.ts
└── sqlite-user.repository.spec.ts
```

## Common Test Patterns

### Testing CRUD Operations

```typescript
it('should create a new entity', async () => {
  const newEntity = { ...data };
  mockDb.execute.mockResolvedValue({ lastInsertId: 42 });

  const result = await repository.create(newEntity);

  expect(result.id).toBe(42);
});
```

### Testing Error Handling

```typescript
it('should throw error when not found', async () => {
  mockDb.select.mockResolvedValue([]);

  await expect(repository.update(999, {})).rejects.toThrow('Entity with id 999 not found');
});
```

### Testing SQL Injection Prevention

```typescript
it('should use parameterized queries', async () => {
  await repository.findById(1);

  const call = mockDb.select.mock.calls[0];
  expect(call[0]).toContain('?');
  expect(call[1]).toEqual([1]);
});
```

## Troubleshooting

### Tests Not Running

```bash
# Clear cache
npm test -- --run --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Coverage Not Generated

```bash
# Ensure coverage directory exists
mkdir -p coverage

# Run with coverage flag
npm test -- --run --coverage
```

### Mock Issues

- Ensure `vi.clearAllMocks()` is called in `beforeEach()`
- Check mock call order (table creation is always first)
- Use `.mockResolvedValueOnce()` for sequential mocks

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Run SQLite Repository Tests
  run: npm test -- --run sqlite-*.repository.spec.ts --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Next Steps

After verifying all tests pass:

1. ✅ Commit test files to repository
2. ✅ Update CI/CD pipeline to run these tests
3. ✅ Monitor coverage reports
4. 📝 Create tests for remaining repositories (variant, product-extra, etc.)
5. 📝 Add integration tests for multi-repository operations

## Documentation

For detailed information, see:

- `SQLITE_REPOSITORY_TESTS_SUMMARY.md` - Complete test documentation
- Test files themselves - Inline documentation and examples

---

**Created:** 2024
**Test Framework:** Vitest
**Total Tests:** 331
**Status:** All Passing ✅
