# Product Requirements Document (PRD)

# Simple POS System (Offline-First Web + Desktop via Tauri)

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

---

# 11. Implementation Roadmap & Project History

The project has followed a phased approach to transform from a local-only system to a cloud-integrated SaaS solution.

### 11.1 Phased Rollout Status

| Phase         | Milestone                   | Focus                            | Status      |
| :------------ | :-------------------------- | :------------------------------- | :---------- |
| **Phase 0**   | **Multi-Tenant Foundation** | Core user & database logic       | ✅ Complete |
| **Phase 0.5** | **Nx Monorepo Migration**   | Restructuring & shared types     | ✅ Complete |
| **Phase 1**   | **Backend Foundation**      | NestJS, RLS, & Authentication    | ✅ Complete |
| **Phase 2**   | **Sync Engine**             | Bidirectional sync & Conflict UI | ✅ Complete |
| **Phase 3**   | **SaaS & Launch**           | Billing, Tenants, & Production   | ✅ Complete |
| **Phase 4**   | **Enterprise/On-Prem**      | Helm charts, SSO, air-gap        | ✅ Complete |

### 11.2 Key Milestones Achieved

- **Nx Monorepo**: Migrated to `apps/pos`, `apps/api`, `apps/native` structure (Feb 2026).
- **Backend**: NestJS + PostgreSQL with Row-Level Security (RLS) for multi-tenancy.
- **Sync Engine**: Robust bidirectional sync with conflict resolution strategies (`SERVER_WINS`, `LAST_WRITE_WINS`, `MANUAL`).
- **Enterprise Ready**: SSO (SAML/OAuth), Docker Compose, and Helm charts for on-premise deployment.

---

# 12. Cost Estimation (Reference)

_Estimates for SaaS transformation phase (Historical/Planning Data)_

### 12.1 Development Costs

- **Estimated Effort**: 1,200 - 1,500 hours
- **Cost Range**: $60,000 - $150,000

### 12.2 Operating Models and Infrastructure Costs

| Component         | Managed Cloud (Est.) | Dedicated Swiss (Est.) |
| :---------------- | :------------------- | :--------------------- |
| Core Resources    | $150 - $250 (K8s)    | $80 - $130 (VM)        |
| Persistent DB     | $50 - $80            | Included/Managed       |
| Redis/Cache       | $15 - $25            | Included/Managed       |
| **Total (Month)** | **$215 - $355**      | **$93 - $175**         |

**Strategic Pricing Strategy (SaaS):**

- **Free**: $0 (2 users)
- **Basic**: $29/mo
- **Pro**: $79/mo
- **Enterprise**: Custom (SSO, On-prem)

---

# 13. Risks & Mitigation

### 13.1 Technical Risks

| Risk                        | Impact   | Mitigation                                    |
| :-------------------------- | :------- | :-------------------------------------------- |
| **Sync conflicts frequent** | High     | Implement intelligent merging, user education |
| **Backend downtime**        | High     | Multi-AZ deployment, fallback to local mode   |
| **Data loss during sync**   | Critical | Atomic transactions, extensive testing        |
| **Performance degradation** | Medium   | Database indexing, caching, CDN               |

### 13.2 Business Risks

| Risk                  | Impact   | Mitigation                                        |
| :-------------------- | :------- | :------------------------------------------------ |
| **Low adoption rate** | High     | Beta testing, gradual rollout, free tier          |
| **Competition**       | Medium   | Focus on unique offline/thermal printing features |
| **Compliance issues** | Critical | Legal review (GDPR, PCI), security audit          |

---

# 14. Success Metrics (Expanded)

### 14.1 Technical KPIs

- **Sync Success Rate**: >99%
- **API Uptime**: >99.9%
- **Sync Latency**: <2 seconds
- **Conflict Rate**: <1% of operations

### 14.2 Business KPIs

- **Active Tenants**: 100 (Month 3), 500 (Month 12)
- **User Satisfaction**: >4.5/5 stars
- **Churn Rate**: <5% monthly
- **Revenue**: $10K MRR (Month 6), $50K MRR (Month 12)

---

# 15. Strategic Summary

This product has successfully evolved into a high-availability SaaS and flexible on-premise solution while retaining local-first operational integrity.

**Critical Success Factors:**

- **Local-first integrity**: Core PoS transactions are always offline-capable.
- **Unified Identity**: Seamless migration from local PIN-based login to JWT cloud-backed authentication.
- **Contract Resilience**: Strict enforcement of shared types to prevent application drift.
