-- Complete database schema for Simple POS
-- Phase 1: Core Domain & CodeTable System

-- ============================================
-- Account Management (Multi-tenancy)
-- ============================================

-- Account: Tenant/Organization accounts for SaaS multi-tenancy
CREATE TABLE IF NOT EXISTS account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT
);

CREATE INDEX IF NOT EXISTS idx_account_email ON account(email);
CREATE INDEX IF NOT EXISTS idx_account_active ON account(active);
CREATE INDEX IF NOT EXISTS idx_account_cloudId ON account(cloudId);

-- ============================================
-- CodeTable System
-- ============================================

-- CodeTable: Stores all enum values as data
CREATE TABLE IF NOT EXISTS code_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_type TEXT NOT NULL,
    code TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    UNIQUE(code_type, code)
);

CREATE INDEX IF NOT EXISTS idx_code_table_type ON code_table(code_type);
CREATE INDEX IF NOT EXISTS idx_code_table_active ON code_table(is_active);
CREATE INDEX IF NOT EXISTS idx_code_table_cloudId ON code_table(cloudId);

-- CodeTranslation: Multi-language support for CodeTable
CREATE TABLE IF NOT EXISTS code_translation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_table_id INTEGER NOT NULL,
    language TEXT NOT NULL,
    label TEXT NOT NULL,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    FOREIGN KEY (code_table_id) REFERENCES code_table(id) ON DELETE CASCADE,
    UNIQUE(code_table_id, language)
);

CREATE INDEX IF NOT EXISTS idx_code_translation_code_table ON code_translation(code_table_id);
CREATE INDEX IF NOT EXISTS idx_code_translation_language ON code_translation(language);
CREATE INDEX IF NOT EXISTS idx_code_translation_cloudId ON code_translation(cloudId);

-- ============================================
-- User Management
-- ============================================

-- User: Application users with role-based access
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    pin_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    FOREIGN KEY (role_id) REFERENCES code_table(id)
);

CREATE INDEX IF NOT EXISTS idx_user_role ON user(role_id);
CREATE INDEX IF NOT EXISTS idx_user_active ON user(active);
CREATE INDEX IF NOT EXISTS idx_user_cloudId ON user(cloudId);

-- ============================================
-- Restaurant Configuration
-- ============================================

-- Category: Product categories
CREATE TABLE IF NOT EXISTS category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT
);

CREATE INDEX IF NOT EXISTS idx_category_active ON category(is_active);
CREATE INDEX IF NOT EXISTS idx_category_cloudId ON category(cloudId);

-- Table: Restaurant tables for dine-in
CREATE TABLE IF NOT EXISTS "table" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    seats INTEGER NOT NULL,
    status_id INTEGER NOT NULL,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    FOREIGN KEY (status_id) REFERENCES code_table(id),
    UNIQUE(number)
);

CREATE INDEX IF NOT EXISTS idx_table_status ON "table"(status_id);
CREATE INDEX IF NOT EXISTS idx_table_cloudId ON "table"(cloudId);

-- Ingredient: Recipe ingredients for stock tracking
CREATE TABLE IF NOT EXISTS ingredient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stock_quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT
);

CREATE INDEX IF NOT EXISTS idx_ingredient_cloudId ON ingredient(cloudId);

-- Extra: Additional items that can be added to products
CREATE TABLE IF NOT EXISTS extra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT
);

CREATE INDEX IF NOT EXISTS idx_extra_cloudId ON extra(cloudId);

-- ============================================
-- Product Management
-- ============================================

-- Product: Items for sale
CREATE TABLE IF NOT EXISTS product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    is_available INTEGER NOT NULL DEFAULT 1,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    FOREIGN KEY (category_id) REFERENCES category(id)
);

CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_available ON product(is_available);
CREATE INDEX IF NOT EXISTS idx_product_cloudId ON product(cloudId);

-- Variant: Product size variations (S/M/L)
CREATE TABLE IF NOT EXISTS variant (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price_modifier REAL NOT NULL,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_variant_product ON variant(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_cloudId ON variant(cloudId);

-- ProductExtra: Link products to available extras
CREATE TABLE IF NOT EXISTS product_extra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    extra_id INTEGER NOT NULL,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (extra_id) REFERENCES extra(id) ON DELETE CASCADE,
    UNIQUE(product_id, extra_id)
);

CREATE INDEX IF NOT EXISTS idx_product_extra_product ON product_extra(product_id);
CREATE INDEX IF NOT EXISTS idx_product_extra_extra ON product_extra(extra_id);
CREATE INDEX IF NOT EXISTS idx_product_extra_cloudId ON product_extra(cloudId);

-- ProductIngredient: Recipe for products with ingredient quantities
CREATE TABLE IF NOT EXISTS product_ingredient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredient(id) ON DELETE CASCADE,
    UNIQUE(product_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_product_ingredient_product ON product_ingredient(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredient_ingredient ON product_ingredient(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredient_cloudId ON product_ingredient(cloudId);

-- ============================================
-- Order Management
-- ============================================

-- Order: Customer orders
CREATE TABLE IF NOT EXISTS "order" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    type_id INTEGER NOT NULL,
    status_id INTEGER NOT NULL,
    table_id INTEGER,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL DEFAULT 0,
    tip REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    user_id INTEGER NOT NULL,
    cancelled_reason TEXT,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    FOREIGN KEY (type_id) REFERENCES code_table(id),
    FOREIGN KEY (status_id) REFERENCES code_table(id),
    FOREIGN KEY (table_id) REFERENCES "table"(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE INDEX IF NOT EXISTS idx_order_type ON "order"(type_id);
CREATE INDEX IF NOT EXISTS idx_order_status ON "order"(status_id);
CREATE INDEX IF NOT EXISTS idx_order_table ON "order"(table_id);
CREATE INDEX IF NOT EXISTS idx_order_user ON "order"(user_id);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON "order"(created_at);
CREATE INDEX IF NOT EXISTS idx_order_number ON "order"(order_number);
CREATE INDEX IF NOT EXISTS idx_order_cloudId ON "order"(cloudId);

-- OrderItem: Line items in an order
CREATE TABLE IF NOT EXISTS order_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    notes TEXT,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (variant_id) REFERENCES variant(id)
);

CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_item(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_product ON order_item(product_id);
CREATE INDEX IF NOT EXISTS idx_order_item_cloudId ON order_item(cloudId);

-- OrderItemExtra: Extras selected for specific order items
CREATE TABLE IF NOT EXISTS order_item_extra (
    order_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    extra_id INTEGER NOT NULL,
    cloudId TEXT,
    version INTEGER DEFAULT 1,
    isDirty INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    syncedAt TEXT,
    lastModifiedAt TEXT,
    deletedAt TEXT,
    tenantId TEXT,
    PRIMARY KEY (order_id, order_item_id, extra_id),
    FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_item(id) ON DELETE CASCADE,
    FOREIGN KEY (extra_id) REFERENCES extra(id)
);

CREATE INDEX IF NOT EXISTS idx_order_item_extra_order_item ON order_item_extra(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_extra_extra ON order_item_extra(extra_id);
CREATE INDEX IF NOT EXISTS idx_order_item_extra_cloudId ON order_item_extra(cloudId);
