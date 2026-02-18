#!/usr/bin/env bash
# =============================================================================
# Task 010: Group Repository Files by Entity
# =============================================================================
# This script reorganizes the flat repositories/ directory into entity subfolders,
# preserving git history via `git mv`, and fixes all import paths.
#
# Usage:
#   chmod +x scripts/010-group-repositories-by-entity.sh
#   ./scripts/010-group-repositories-by-entity.sh
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPOS_DIR="$REPO_ROOT/apps/pos/src/app/infrastructure/repositories"

echo "=== Task 010: Group Repository Files by Entity ==="
echo ""

# --- Step 0: Create branch ---------------------------------------------------
BRANCH_NAME="refactor/010-group-repository-files-by-entity"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" = "$BRANCH_NAME" ]; then
  echo "✓ Already on branch $BRANCH_NAME"
else
  echo "→ Creating branch: $BRANCH_NAME"
  git checkout -b "$BRANCH_NAME"
fi

# --- Step 1: Create entity directories ----------------------------------------
echo ""
echo "→ Creating entity directories..."

ENTITIES=(account category code-table extra ingredient order product table test user variant)
for entity in "${ENTITIES[@]}"; do
  mkdir -p "$REPOS_DIR/$entity"
  echo "  ✓ $entity/"
done

# --- Step 2: Move files to entity directories using git mv --------------------
echo ""
echo "→ Moving files to entity directories..."

cd "$REPOS_DIR"

# Account
git mv indexeddb-account.repository.ts account/
git mv sqlite-account.repository.ts account/
git mv sqlite-account.repository.spec.ts account/

# Category
git mv indexeddb-category.repository.ts category/
git mv sqlite-category.repository.ts category/
git mv sqlite-category.repository.spec.ts category/

# Code Table (includes code-translation)
git mv indexeddb-code-table.repository.ts code-table/
git mv sqlite-code-table.repository.ts code-table/
git mv indexeddb-code-translation.repository.ts code-table/
git mv sqlite-code-translation.repository.ts code-table/

# Extra
git mv indexeddb-extra.repository.ts extra/
git mv sqlite-extra.repository.ts extra/
git mv sqlite-extra.repository.spec.ts extra/

# Ingredient
git mv indexeddb-ingredient.repository.ts ingredient/
git mv sqlite-ingredient.repository.ts ingredient/
git mv sqlite-ingredient.repository.spec.ts ingredient/

# Order (includes order-item and order-item-extra)
git mv indexeddb-order.repository.ts order/
git mv sqlite-order.repository.ts order/
git mv sqlite-order.repository.spec.ts order/
git mv indexeddb-order-item.repository.ts order/
git mv sqlite-order-item.repository.ts order/
git mv sqlite-order-item.repository.spec.ts order/
git mv indexeddb-order-item-extra.repository.ts order/
git mv sqlite-order-item-extra.repository.ts order/
git mv sqlite-order-item-extra.repository.spec.ts order/

# Product (includes product-extra and product-ingredient)
git mv indexeddb-product.repository.ts product/
git mv sqlite-product.repository.ts product/
git mv sqlite-product.repository.spec.ts product/
git mv indexeddb-product-extra.repository.ts product/
git mv sqlite-product-extra.repository.ts product/
git mv indexeddb-product-ingredient.repository.ts product/
git mv sqlite-product-ingredient.repository.ts product/

# Table
git mv indexeddb-table.repository.ts table/
git mv sqlite-table.repository.ts table/
git mv sqlite-table.repository.spec.ts table/

# Test
git mv indexeddb-test.repository.ts test/
git mv sqlite-test.repository.ts test/

# User
git mv indexeddb-user.repository.ts user/
git mv sqlite-user.repository.ts user/
git mv sqlite-user.repository.spec.ts user/

# Variant
git mv indexeddb-variant.repository.ts variant/
git mv sqlite-variant.repository.ts variant/

echo "  ✓ All files moved"

# --- Step 3: Fix relative imports inside moved files --------------------------
echo ""
echo "→ Fixing relative imports in moved repository files..."

cd "$REPO_ROOT"

# Fix IndexedDBService import: ../services/indexeddb.service → ../../services/indexeddb.service
# This applies to all indexeddb-*.repository.ts files (now in subdirectories)
find "$REPOS_DIR" -name "indexeddb-*.repository.ts" -not -name "*.spec.ts" | while read -r file; do
  sed -i '' "s|from '../services/indexeddb.service'|from '../../services/indexeddb.service'|g" "$file"
  echo "  ✓ Fixed IndexedDBService import in $(basename "$file")"
done

# Fix core interface imports: ../../core/interfaces/ → ../../../core/interfaces/
# These are in product-extra, product-ingredient, and variant repos
find "$REPOS_DIR" -name "*.repository.ts" -not -name "*.spec.ts" | while read -r file; do
  if grep -q "from '../../core/interfaces/" "$file" 2>/dev/null; then
    sed -i '' "s|from '../../core/interfaces/|from '../../../core/interfaces/|g" "$file"
    echo "  ✓ Fixed core interface import in $(basename "$file")"
  fi
done

# --- Step 4: Fix imports in consuming files -----------------------------------
echo ""
echo "→ Fixing imports in consuming files..."

# File 1: repository.providers.ts
PROVIDERS_FILE="$REPO_ROOT/apps/pos/src/app/infrastructure/providers/repository.providers.ts"
sed -i '' "s|from '../repositories/indexeddb-account.repository'|from '../repositories/account/indexeddb-account.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-account.repository'|from '../repositories/account/sqlite-account.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-category.repository'|from '../repositories/category/indexeddb-category.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-category.repository'|from '../repositories/category/sqlite-category.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-code-table.repository'|from '../repositories/code-table/indexeddb-code-table.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-code-table.repository'|from '../repositories/code-table/sqlite-code-table.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-code-translation.repository'|from '../repositories/code-table/indexeddb-code-translation.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-code-translation.repository'|from '../repositories/code-table/sqlite-code-translation.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-extra.repository'|from '../repositories/extra/indexeddb-extra.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-extra.repository'|from '../repositories/extra/sqlite-extra.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-ingredient.repository'|from '../repositories/ingredient/indexeddb-ingredient.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-ingredient.repository'|from '../repositories/ingredient/sqlite-ingredient.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-order-item-extra.repository'|from '../repositories/order/indexeddb-order-item-extra.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-order-item-extra.repository'|from '../repositories/order/sqlite-order-item-extra.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-order-item.repository'|from '../repositories/order/indexeddb-order-item.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-order-item.repository'|from '../repositories/order/sqlite-order-item.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-order.repository'|from '../repositories/order/indexeddb-order.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-order.repository'|from '../repositories/order/sqlite-order.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-product-extra.repository'|from '../repositories/product/indexeddb-product-extra.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-product-extra.repository'|from '../repositories/product/sqlite-product-extra.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-product-ingredient.repository'|from '../repositories/product/indexeddb-product-ingredient.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-product-ingredient.repository'|from '../repositories/product/sqlite-product-ingredient.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-product.repository'|from '../repositories/product/indexeddb-product.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-product.repository'|from '../repositories/product/sqlite-product.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-table.repository'|from '../repositories/table/indexeddb-table.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-table.repository'|from '../repositories/table/sqlite-table.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-test.repository'|from '../repositories/test/indexeddb-test.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-test.repository'|from '../repositories/test/sqlite-test.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-user.repository'|from '../repositories/user/indexeddb-user.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-user.repository'|from '../repositories/user/sqlite-user.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/indexeddb-variant.repository'|from '../repositories/variant/indexeddb-variant.repository'|g" "$PROVIDERS_FILE"
sed -i '' "s|from '../repositories/sqlite-variant.repository'|from '../repositories/variant/sqlite-variant.repository'|g" "$PROVIDERS_FILE"
echo "  ✓ repository.providers.ts"

# File 2: sync-engine.service.spec.ts
SYNC_SPEC="$REPO_ROOT/apps/pos/src/app/application/services/sync-engine.service.spec.ts"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-account.repository'|from '../../infrastructure/repositories/account/indexeddb-account.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-account.repository'|from '../../infrastructure/repositories/account/sqlite-account.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-category.repository'|from '../../infrastructure/repositories/category/indexeddb-category.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-category.repository'|from '../../infrastructure/repositories/category/sqlite-category.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-code-table.repository'|from '../../infrastructure/repositories/code-table/indexeddb-code-table.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-code-table.repository'|from '../../infrastructure/repositories/code-table/sqlite-code-table.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-code-translation.repository'|from '../../infrastructure/repositories/code-table/indexeddb-code-translation.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-code-translation.repository'|from '../../infrastructure/repositories/code-table/sqlite-code-translation.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-extra.repository'|from '../../infrastructure/repositories/extra/indexeddb-extra.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-extra.repository'|from '../../infrastructure/repositories/extra/sqlite-extra.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-ingredient.repository'|from '../../infrastructure/repositories/ingredient/indexeddb-ingredient.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-ingredient.repository'|from '../../infrastructure/repositories/ingredient/sqlite-ingredient.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-order-item-extra.repository'|from '../../infrastructure/repositories/order/indexeddb-order-item-extra.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-order-item-extra.repository'|from '../../infrastructure/repositories/order/sqlite-order-item-extra.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-order-item.repository'|from '../../infrastructure/repositories/order/indexeddb-order-item.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-order-item.repository'|from '../../infrastructure/repositories/order/sqlite-order-item.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-order.repository'|from '../../infrastructure/repositories/order/indexeddb-order.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-order.repository'|from '../../infrastructure/repositories/order/sqlite-order.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-product-extra.repository'|from '../../infrastructure/repositories/product/indexeddb-product-extra.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-product-extra.repository'|from '../../infrastructure/repositories/product/sqlite-product-extra.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-product-ingredient.repository'|from '../../infrastructure/repositories/product/indexeddb-product-ingredient.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-product-ingredient.repository'|from '../../infrastructure/repositories/product/sqlite-product-ingredient.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-product.repository'|from '../../infrastructure/repositories/product/indexeddb-product.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-product.repository'|from '../../infrastructure/repositories/product/sqlite-product.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-table.repository'|from '../../infrastructure/repositories/table/indexeddb-table.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-table.repository'|from '../../infrastructure/repositories/table/sqlite-table.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-user.repository'|from '../../infrastructure/repositories/user/indexeddb-user.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-user.repository'|from '../../infrastructure/repositories/user/sqlite-user.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/indexeddb-variant.repository'|from '../../infrastructure/repositories/variant/indexeddb-variant.repository'|g" "$SYNC_SPEC"
sed -i '' "s|from '../../infrastructure/repositories/sqlite-variant.repository'|from '../../infrastructure/repositories/variant/sqlite-variant.repository'|g" "$SYNC_SPEC"
echo "  ✓ sync-engine.service.spec.ts"

# File 3: code-table.spec.ts (integration test)
CODE_TABLE_SPEC="$REPO_ROOT/apps/pos/src/app/integration/code-table.spec.ts"
sed -i '' "s|from '../infrastructure/repositories/indexeddb-code-table.repository'|from '../infrastructure/repositories/code-table/indexeddb-code-table.repository'|g" "$CODE_TABLE_SPEC"
echo "  ✓ code-table.spec.ts"

# --- Step 5: Create barrel index.ts files for each entity ---------------------
echo ""
echo "→ Creating barrel index.ts files..."

# Account
cat > "$REPOS_DIR/account/index.ts" << 'EOF'
export { IndexedDBAccountRepository } from './indexeddb-account.repository';
export { SQLiteAccountRepository } from './sqlite-account.repository';
EOF
echo "  ✓ account/index.ts"

# Category
cat > "$REPOS_DIR/category/index.ts" << 'EOF'
export { IndexedDBCategoryRepository } from './indexeddb-category.repository';
export { SQLiteCategoryRepository } from './sqlite-category.repository';
EOF
echo "  ✓ category/index.ts"

# Code Table
cat > "$REPOS_DIR/code-table/index.ts" << 'EOF'
export { IndexedDBCodeTableRepository } from './indexeddb-code-table.repository';
export { SQLiteCodeTableRepository } from './sqlite-code-table.repository';
export { IndexedDBCodeTranslationRepository } from './indexeddb-code-translation.repository';
export { SQLiteCodeTranslationRepository } from './sqlite-code-translation.repository';
EOF
echo "  ✓ code-table/index.ts"

# Extra
cat > "$REPOS_DIR/extra/index.ts" << 'EOF'
export { IndexedDBExtraRepository } from './indexeddb-extra.repository';
export { SQLiteExtraRepository } from './sqlite-extra.repository';
EOF
echo "  ✓ extra/index.ts"

# Ingredient
cat > "$REPOS_DIR/ingredient/index.ts" << 'EOF'
export { IndexedDBIngredientRepository } from './indexeddb-ingredient.repository';
export { SQLiteIngredientRepository } from './sqlite-ingredient.repository';
EOF
echo "  ✓ ingredient/index.ts"

# Order
cat > "$REPOS_DIR/order/index.ts" << 'EOF'
export { IndexedDBOrderRepository } from './indexeddb-order.repository';
export { SQLiteOrderRepository } from './sqlite-order.repository';
export { IndexedDBOrderItemRepository } from './indexeddb-order-item.repository';
export { SQLiteOrderItemRepository } from './sqlite-order-item.repository';
export { IndexedDBOrderItemExtraRepository } from './indexeddb-order-item-extra.repository';
export { SQLiteOrderItemExtraRepository } from './sqlite-order-item-extra.repository';
EOF
echo "  ✓ order/index.ts"

# Product
cat > "$REPOS_DIR/product/index.ts" << 'EOF'
export { IndexedDBProductRepository } from './indexeddb-product.repository';
export { SQLiteProductRepository } from './sqlite-product.repository';
export { IndexedDBProductExtraRepository } from './indexeddb-product-extra.repository';
export { SQLiteProductExtraRepository } from './sqlite-product-extra.repository';
export { IndexedDBProductIngredientRepository } from './indexeddb-product-ingredient.repository';
export { SQLiteProductIngredientRepository } from './sqlite-product-ingredient.repository';
EOF
echo "  ✓ product/index.ts"

# Table
cat > "$REPOS_DIR/table/index.ts" << 'EOF'
export { IndexedDBTableRepository } from './indexeddb-table.repository';
export { SQLiteTableRepository } from './sqlite-table.repository';
EOF
echo "  ✓ table/index.ts"

# Test
cat > "$REPOS_DIR/test/index.ts" << 'EOF'
export { IndexedDBTestRepository } from './indexeddb-test.repository';
export { SQLiteTestRepository } from './sqlite-test.repository';
EOF
echo "  ✓ test/index.ts"

# User
cat > "$REPOS_DIR/user/index.ts" << 'EOF'
export { IndexedDBUserRepository } from './indexeddb-user.repository';
export { SQLiteUserRepository } from './sqlite-user.repository';
EOF
echo "  ✓ user/index.ts"

# Variant
cat > "$REPOS_DIR/variant/index.ts" << 'EOF'
export { IndexedDBVariantRepository } from './indexeddb-variant.repository';
export { SQLiteVariantRepository } from './sqlite-variant.repository';
EOF
echo "  ✓ variant/index.ts"

# --- Step 6: Verify ----------------------------------------------------------
echo ""
echo "=== Migration Complete ==="
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff --stat"
echo "  2. Build:  pnpm pos:build"
echo "  3. Test:   pnpm nx test pos"
echo "  4. Lint:   pnpm run lint"
echo "  5. Commit: git add -A && git commit -m 'refactor(pos): group repository files by entity'"
echo ""
