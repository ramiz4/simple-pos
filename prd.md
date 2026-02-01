# Product Requirements Document (PRD)

# Simple Simple POS System (Offline-First Web + Desktop via Tauri)

---

# 1. Product Overview

A modern, offline-capable Point-of-Sale (POS) system for a restaurant in Kosovo.

The system supports:

- Dine-In (In House)
- Takeaway (Pickup)
- Delivery

The application runs as:

- Web App (PWA)
- Desktop App via Tauri
- Offline-first
- Mobile-first & fully responsive

Default Language: English
Secondary Language: Albanian
Primary Market: Kosovo

---

# 2. Objectives

## Business Goals

- Extremely simple operation
- Minimal training required
- 100% offline functionality
- Fast order processing
- Reliable end-of-day closing

## Success Metrics

- Order creation < 10 seconds
- UI response time < 1 second
- 0% data loss offline
- Print time < 2 seconds

---

# 3. Target Users

- Small to medium-sized restaurants
- 1–10 employees
- No ERP required
- Focus on speed and simplicity

---

# 4. Core Features (MUST HAVE)

---

## 4.1 Order Management

### Order Types

- DINE_IN
- TAKEAWAY
- DELIVERY

### Dine-In Flow

1. Select order type
2. Select table (mandatory)
3. Add products
4. Confirm cash payment
5. Print receipt

### Takeaway / Delivery Flow

1. Select order type
2. Add products
3. Confirm cash payment
4. Print receipt

---

## 4.2 Table Management

- Table selection required for DINE_IN
- Table automatically set to OCCUPIED when order starts
- Table set to FREE when order completes or cancels
- Admin can create, edit, delete, deactivate tables

---

## 4.3 Product Management

- Categories
- Products
- Variants (S/M/L)
- Extras (e.g., Extra cheese)
- Ingredient management
- Inventory tracking (optional toggle)
- Availability toggle (Sold Out)

---

## 4.4 Users & Roles

Login mandatory.

Roles:

- ADMIN
- CASHIER
- KITCHEN
- DRIVER

Permission model enforced via role-based access control.

---

## 4.5 Payment

- Cash only (MVP)
- Automatic total calculation
- Optional tip field

---

## 4.6 Printing

ESC/POS support:

- Receipt printer
- Kitchen printer

Receipt contains:

- Logo
- Order number
- Date / time
- Items
- Variants
- Extras
- Total amount
- VAT
- Language

---

## 4.7 Offline Capability

- Fully functional without internet
- All data stored locally
- No server dependency
- Backup export supported

---

## 4.8 Reporting

MUST:

- Daily revenue
- Revenue by order type
- Number of orders
- Z-report
- CSV export

NICE:

- PDF export
- Revenue per table
- Average revenue per table

---

## 4.9 Internationalization

- Default: English
- Secondary: Albanian
- Runtime language switching
- Key-based translation system

---

## 4.10 Responsive Design

Mobile-first approach:

- Mobile primary
- Tablet optimized
- Desktop touch-friendly

---

# 5. Enum & CodeTable Standard

All categorical fields must:

- Be defined as domain enums
- Persist via CodeTable
- Reference CodeTable via foreign key
- Support EN / AL translations
- Never use raw string literals

---

# 6. Non-Functional Requirements

- Startup < 2 seconds
- 60 FPS UI
- Memory usage < 200 MB
- Print time < 2 seconds
- No internet dependency
- Secure PIN hashing

---

# 7. Security Requirements

- PIN hashing
- Role-based access control
- Optional database encryption
- Encrypted backups

---

# 8. Nice-to-Have Features

- Dark mode
- Discount function
- Dashboard with live statistics
- Customer management
- QR menu
- Multi-printer routing
- Table merge
- Floor plan editor
- Cloud sync (future phase)

---

# 9. MVP Scope

Included:

- Order types
- Table selection
- Product management
- Variants / extras
- Ingredients
- Inventory
- Roles & login
- Cash payment
- ESC/POS printing
- Offline support
- Basic reporting
- English / Albanian
- Responsive Tailwind UI
- SQLite + IndexedDB

Excluded:

- Card payment
- Multi-branch
- Fiscal integration
- Delivery zone pricing

---

# 10. Summary

This system is:

- Offline-first
- Modern and intuitive
- TailwindCSS-based
- Tauri desktop-ready
- Mobile-first
- Architected for future cloud scalability
