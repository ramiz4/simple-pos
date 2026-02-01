# Phase 2 Testing Guide

## Quick Start

### 1. Start the Application

```bash
cd simple-bistro-pos
npm start
```

The app will open at `http://localhost:4200`

### 2. Login as Admin

- Navigate to the login page
- **Username:** `admin`
- **PIN:** `1234`
- Click "Login"

### 3. Access Admin Panel

From the dashboard, click the **"Admin Configuration"** button.

## Manual Testing Checklist

### ✅ Table Management (`/admin/tables`)

**Create:**
1. Click "Add New Table"
2. Fill in:
   - Name: "Table 1"
   - Number: 1
   - Seats: 4
   - Status: FREE
3. Click "Add Table"
4. ✅ Verify table appears in grid

**Edit:**
1. Click "Edit" on any table
2. Change seats to 6
3. Click "Update Table"
4. ✅ Verify seats updated

**Status Change:**
1. Click "Edit" on a table
2. Change status to OCCUPIED
3. ✅ Verify status badge color changes

**Delete:**
1. Click "Delete" on a table
2. Confirm deletion
3. ✅ Verify table removed from list

---

### ✅ Category Management (`/admin/categories`)

**Create:**
1. Click "Add New Category"
2. Fill in:
   - Name: "Pizzas"
   - Sort Order: 1
   - Is Active: ✅ (checked)
3. Click "Add Category"
4. ✅ Verify category appears

**Reorder:**
1. Create 3 categories with different sort orders
2. Use "↑" and "↓" buttons
3. ✅ Verify list reorders immediately

**Toggle Active:**
1. Click "Edit" on a category
2. Uncheck "Is Active"
3. ✅ Verify inactive status

**Delete:**
1. Click "Delete" on a category
2. Confirm deletion
3. ✅ Verify category removed

---

### ✅ Product Management (`/admin/products`)

**Create:**
1. Click "Add New Product"
2. Fill in:
   - Name: "Margherita Pizza"
   - Category: Pizzas
   - Price: 8.99
   - Stock: 50
   - Is Available: ✅
3. Click "Add Product"
4. ✅ Verify product appears with category name

**Toggle Availability:**
1. Click "Edit" on a product
2. Uncheck "Is Available"
3. ✅ Verify "Sold Out" badge appears

**Edit Price:**
1. Click "Edit" on a product
2. Change price to 9.99
3. Click "Update Product"
4. ✅ Verify new price displayed

**Stock Update:**
1. Click "Edit" on a product
2. Change stock to 25
3. ✅ Verify stock count updated

**Delete:**
1. Click "Delete" on a product
2. Confirm
3. ✅ Verify product removed

---

### ✅ Variant Management (`/admin/variants`)

**Create Small Variant:**
1. Click "Add New Variant"
2. Fill in:
   - Product: Margherita Pizza
   - Name: Small
   - Price Modifier: -2.00
3. Click "Add Variant"
4. ✅ Verify variant appears with red modifier

**Create Large Variant:**
1. Click "Add New Variant"
2. Fill in:
   - Product: Margherita Pizza
   - Name: Large
   - Price Modifier: 3.00
3. Click "Add Variant"
4. ✅ Verify variant appears with green modifier

**Price Calculation:**
1. Check calculated price display
2. Small: Base Price - 2.00
3. Large: Base Price + 3.00
4. ✅ Verify calculations correct

**Delete:**
1. Click "Delete" on a variant
2. Confirm
3. ✅ Verify variant removed

---

### ✅ Extra Management (`/admin/extras`)

**Create:**
1. Click "Add New Extra"
2. Fill in:
   - Name: Extra Cheese
   - Price: 1.50
3. Click "Add Extra"
4. ✅ Verify extra appears alphabetically

**Edit:**
1. Click "Edit" on an extra
2. Change price to 2.00
3. ✅ Verify updated price

**Delete:**
1. Click "Delete" on an extra
2. Confirm
3. ✅ Verify extra removed

---

### ✅ Ingredient Management (`/admin/ingredients`)

**Create:**
1. Click "Add New Ingredient"
2. Fill in:
   - Name: Mozzarella
   - Stock Quantity: 10
   - Unit: kg
3. Click "Add Ingredient"
4. ✅ Verify ingredient appears

**Stock Indicators:**
1. Create ingredient with 0 stock
2. ✅ Verify red "Out of Stock" badge
3. Edit to 3 units
4. ✅ Verify yellow "Low Stock" badge
5. Edit to 20 units
6. ✅ Verify green "Good Stock" badge

**Edit:**
1. Click "Edit" on an ingredient
2. Change stock quantity
3. ✅ Verify indicator updates

**Delete:**
1. Click "Delete" on an ingredient
2. Confirm
3. ✅ Verify ingredient removed

---

## Automated Test Suite

### Run All Tests

1. From dashboard, click **"Phase 2 Tests"** button
2. Click **"▶️ Run All Tests"**
3. Wait for completion (~5-10 seconds)
4. ✅ Verify all 10 tests show green ✅

### Expected Results

All tests should pass:
1. ✅ Category CRUD
2. ✅ Product CRUD
3. ✅ Table CRUD with CodeTable
4. ✅ Variant Management
5. ✅ Extra Management
6. ✅ Ingredient Management
7. ✅ Product-Extra Relationship
8. ✅ Product-Ingredient Relationship
9. ✅ Inventory Tracking
10. ✅ Product Availability Toggle

---

## Relationship Testing (Advanced)

### Product-Extra Relationship

Using browser console:
```javascript
// Get services
const productExtraService = // inject from component

// Add extra to product
await productExtraService.addExtraToProduct(productId, extraId);

// Get extras for product
const extras = await productExtraService.getByProduct(productId);
console.log(extras);

// Remove extra from product
await productExtraService.removeExtraFromProduct(productId, extraId);
```

### Product-Ingredient Relationship

Using browser console:
```javascript
const productIngredientService = // inject from component

// Add ingredient to product
await productIngredientService.addIngredientToProduct(productId, ingredientId, 0.2);

// Get ingredients for product
const ingredients = await productIngredientService.getByProduct(productId);
console.log(ingredients);

// Update quantity
await productIngredientService.updateIngredientQuantity(id, 0.5);
```

---

## Security Testing

### Role-Based Access

1. **Logout** from admin account
2. **Login** as cashier (username: `cashier`, PIN: `1234`)
3. Try to access `/admin`
4. ✅ Verify redirected to `/unauthorized`
5. ✅ Verify "Admin Configuration" button hidden

### Route Guards

Manually navigate to:
- `/admin/tables`
- `/admin/products`
- `/admin/categories`

✅ All should redirect to `/unauthorized` if not ADMIN

---

## Responsive Design Testing

### Mobile View (< 768px)
1. Open DevTools
2. Set viewport to iPhone 12 (390x844)
3. ✅ Verify single-column layouts
4. ✅ Verify horizontal scrolling tables
5. ✅ Verify touch targets ≥44px
6. ✅ Verify no overlapping elements

### Tablet View (768-1024px)
1. Set viewport to iPad (768x1024)
2. ✅ Verify 2-column grids
3. ✅ Verify readable font sizes
4. ✅ Verify proper spacing

### Desktop View (>1024px)
1. Set viewport to 1920x1080
2. ✅ Verify 3-column grids
3. ✅ Verify max-width containers
4. ✅ Verify hover effects

---

## Performance Testing

### Load Time
1. Open DevTools → Performance
2. Navigate to `/admin/products`
3. ✅ Verify page load <1 second
4. ✅ Verify no layout shifts

### Database Operations
1. Create 50 products
2. Navigate to product list
3. ✅ Verify smooth scrolling
4. ✅ Verify instant filtering/sorting

---

## Error Handling Testing

### Validation Errors
1. Try to create product without name
2. ✅ Verify error message displayed
3. Try to set negative price
4. ✅ Verify validation prevents

### Duplicate Detection
1. Create category "Test"
2. Try to create another "Test" category
3. ✅ Verify unique constraint error

### Delete Dependencies
1. Create product in category
2. Try to delete category
3. ✅ Should fail or cascade delete (depends on implementation)

---

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Known Issues & Limitations

1. **M2M UI:** Product-Extra and Product-Ingredient relationships managed via services only (no dedicated UI)
2. **IndexedDB Version:** Manual version increment needed for schema changes
3. **Stock Deduction:** Ready but not integrated with order flow (Phase 3)

---

## Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Issues
Clear IndexedDB:
1. Open DevTools → Application
2. Storage → IndexedDB
3. Delete "BistroDatabase"
4. Refresh page

### Test Failures
1. Check browser console for errors
2. Verify seed data exists (admin user)
3. Clear database and re-seed
4. Check network tab for failed requests

---

## Success Criteria

Phase 2 is complete when:
- ✅ All CRUD operations work
- ✅ All 10 automated tests pass
- ✅ Role-based access enforced
- ✅ Mobile responsive design functional
- ✅ No console errors
- ✅ Build succeeds (0 errors)

---

**Testing Completed:** _______________  
**Tester Name:** _______________  
**Date:** _______________  
**Result:** ☐ Pass  ☐ Fail  
**Notes:** _______________
