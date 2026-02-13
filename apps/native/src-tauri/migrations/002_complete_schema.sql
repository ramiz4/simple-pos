-- Complete database schema for Simple POS
-- Core Domain & CodeTable System
-- Updated to match Repository expectations (Use camelCase column names)

-- ============================================
-- Account Management
-- ============================================

CREATE TABLE IF NOT EXISTS account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL
);

-- ============================================
-- CodeTable System
-- ============================================

-- CodeTable: Stores all enum values as data
CREATE TABLE IF NOT EXISTS code_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codeType TEXT NOT NULL,
    code TEXT NOT NULL,
    sortOrder INTEGER NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    UNIQUE(codeType, code)
);

CREATE INDEX IF NOT EXISTS idx_code_table_type ON code_table(codeType);
CREATE INDEX IF NOT EXISTS idx_code_table_active ON code_table(isActive);

-- CodeTranslation: Multi-language support for CodeTable
CREATE TABLE IF NOT EXISTS code_translation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codeTableId INTEGER NOT NULL,
    language TEXT NOT NULL,
    label TEXT NOT NULL,
    FOREIGN KEY (codeTableId) REFERENCES code_table(id) ON DELETE CASCADE,
    UNIQUE(codeTableId, language)
);

CREATE INDEX IF NOT EXISTS idx_code_translation_code_table ON code_translation(codeTableId);
CREATE INDEX IF NOT EXISTS idx_code_translation_language ON code_translation(language);

-- ============================================
-- User Management
-- ============================================

-- User: Application users with role-based access
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    roleId INTEGER NOT NULL,
    pinHash TEXT NOT NULL,
    passwordHash TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    accountId INTEGER NOT NULL,
    isOwner INTEGER NOT NULL DEFAULT 0,
    UNIQUE(accountId, name),
    FOREIGN KEY (roleId) REFERENCES code_table(id),
    FOREIGN KEY (accountId) REFERENCES account (id)
);

CREATE INDEX IF NOT EXISTS idx_user_role ON user(roleId);
CREATE INDEX IF NOT EXISTS idx_user_active ON user(active);
CREATE INDEX IF NOT EXISTS idx_user_account ON user(accountId);

-- ============================================
-- Restaurant Configuration
-- ============================================

-- Category: Product categories
CREATE TABLE IF NOT EXISTS category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sortOrder INTEGER NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_category_active ON category(isActive);

-- Table: Restaurant tables for dine-in
CREATE TABLE IF NOT EXISTS "table" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    seats INTEGER NOT NULL,
    statusId INTEGER NOT NULL,
    FOREIGN KEY (statusId) REFERENCES code_table(id),
    UNIQUE(number)
);

CREATE INDEX IF NOT EXISTS idx_table_status ON "table"(statusId);

-- Ingredient: Recipe ingredients for stock tracking
CREATE TABLE IF NOT EXISTS ingredient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stockQuantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL
);

-- Extra: Additional items that can be added to products
CREATE TABLE IF NOT EXISTS extra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL
);

-- ============================================
-- Product Management
-- ============================================

-- Product: Items for sale
CREATE TABLE IF NOT EXISTS product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    categoryId INTEGER NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    isAvailable INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (categoryId) REFERENCES category(id)
);

CREATE INDEX IF NOT EXISTS idx_product_category ON product(categoryId);
CREATE INDEX IF NOT EXISTS idx_product_available ON product(isAvailable);

-- Variant: Product size variations (S/M/L)
CREATE TABLE IF NOT EXISTS variant (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    name TEXT NOT NULL,
    priceModifier REAL NOT NULL,
    FOREIGN KEY (productId) REFERENCES product(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_variant_product ON variant(productId);

-- ProductExtra: Link products to available extras
CREATE TABLE IF NOT EXISTS product_extra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    extraId INTEGER NOT NULL,
    FOREIGN KEY (productId) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (extraId) REFERENCES extra(id) ON DELETE CASCADE,
    UNIQUE(productId, extraId)
);

CREATE INDEX IF NOT EXISTS idx_product_extra_product ON product_extra(productId);
CREATE INDEX IF NOT EXISTS idx_product_extra_extra ON product_extra(extraId);

-- ProductIngredient: Recipe for products with ingredient quantities
CREATE TABLE IF NOT EXISTS product_ingredient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    ingredientId INTEGER NOT NULL,
    quantity REAL NOT NULL,
    FOREIGN KEY (productId) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredientId) REFERENCES ingredient(id) ON DELETE CASCADE,
    UNIQUE(productId, ingredientId)
);

CREATE INDEX IF NOT EXISTS idx_product_ingredient_product ON product_ingredient(productId);
CREATE INDEX IF NOT EXISTS idx_product_ingredient_ingredient ON product_ingredient(ingredientId);

-- ============================================
-- Order Management
-- ============================================

-- Order: Customer orders
CREATE TABLE IF NOT EXISTS "order" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNumber TEXT NOT NULL UNIQUE,
    typeId INTEGER NOT NULL,
    statusId INTEGER NOT NULL,
    tableId INTEGER,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL DEFAULT 0,
    tip REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    completedAt TEXT,
    userId INTEGER NOT NULL,
    cancelledReason TEXT,
    customerName TEXT,
    FOREIGN KEY (typeId) REFERENCES code_table(id),
    FOREIGN KEY (statusId) REFERENCES code_table(id),
    FOREIGN KEY (tableId) REFERENCES "table"(id),
    FOREIGN KEY (userId) REFERENCES user(id)
);

CREATE INDEX IF NOT EXISTS idx_order_type ON "order"(typeId);
CREATE INDEX IF NOT EXISTS idx_order_status ON "order"(statusId);
CREATE INDEX IF NOT EXISTS idx_order_table ON "order"(tableId);
CREATE INDEX IF NOT EXISTS idx_order_user ON "order"(userId);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON "order"(createdAt);
CREATE INDEX IF NOT EXISTS idx_order_number ON "order"(orderNumber);

-- OrderItem: Line items in an order
CREATE TABLE IF NOT EXISTS order_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    variantId INTEGER,
    quantity INTEGER NOT NULL,
    unitPrice REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (orderId) REFERENCES "order"(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES product(id),
    FOREIGN KEY (variantId) REFERENCES variant(id)
);

CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_item(orderId);
CREATE INDEX IF NOT EXISTS idx_order_item_product ON order_item(productId);

-- OrderItemExtra: Extras selected for specific order items
CREATE TABLE IF NOT EXISTS order_item_extra (
    orderId INTEGER NOT NULL,
    orderItemId INTEGER NOT NULL,
    extraId INTEGER NOT NULL,
    PRIMARY KEY (orderId, orderItemId, extraId),
    FOREIGN KEY (orderId) REFERENCES "order"(id) ON DELETE CASCADE,
    FOREIGN KEY (orderItemId) REFERENCES order_item(id) ON DELETE CASCADE,
    FOREIGN KEY (extraId) REFERENCES extra(id)
);

CREATE INDEX IF NOT EXISTS idx_order_item_extra_order_item ON order_item_extra(orderItemId);
CREATE INDEX IF NOT EXISTS idx_order_item_extra_extra ON order_item_extra(extraId);
