# SaaS & On-Premise Transformation Guide

> **Document Version:** 1.2 <br>
> **Date:** February 10, 2026 <br>
> **Current Version:** Simple POS v1.20.0 <br>
> **Architecture:** Nx Monorepo + Desktop (Tauri) + PWA (Web) with Local-First Storage <br>

---

## Executive Summary

Simple POS is currently a **local-first, offline-capable** Point-of-Sale system built with Angular 21 and Tauri 2. It supports:

- **Desktop apps** (Windows, macOS, Linux) with SQLite storage
- **Progressive Web Apps** (PWA) with IndexedDB storage
- **Zero backend dependencies** - all data stored locally

This document outlines the architectural changes, infrastructure requirements, and development roadmap needed to transform Simple POS into a **full SaaS (Software-as-a-Service)** and **on-premise enterprise** solution while maintaining backward compatibility with the existing local-first mode.

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Target Architecture Overview](#2-target-architecture-overview)
3. [Backend API Development](#3-backend-api-development)
4. [Multi-Tenancy Architecture](#4-multi-tenancy-architecture)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Data Synchronization](#6-data-synchronization)
7. [Deployment Strategies](#7-deployment-strategies)
8. [Security Enhancements](#8-security-enhancements)
9. [Infrastructure Requirements](#9-infrastructure-requirements)
10. [Nx Monorepo Architecture](#10-nx-monorepo-architecture)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Cost Estimation](#12-cost-estimation)
13. [Risks & Mitigation](#13-risks-&-mitigation)
14. [Success Metrics](#14-success-metrics)
15. [Strategic Summary & Next Steps](#15-strategic-summary--next-steps)

**Appendices:**

- [Appendix A: API Schema Examples](#appendix-a-api-schema-examples)
- [Appendix B: Quick Reference & Related Documents](#appendix-b-quick-reference--related-documents)

---

## 1. Current Architecture Analysis

### 1.1 Existing Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular 21 Frontend                      │
│  (Standalone Components, Signals, TypeScript 5.9)           │
└─────────────────┬───────────────────────────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
┌──────▼──────┐    ┌────────▼────────┐
│   Tauri 2   │    │   Web Browser   │
│  (Desktop)  │    │     (PWA)       │
└──────┬──────┘    └────────┬────────┘
       │                    │
┌──────▼──────┐    ┌────────▼────────┐
│   SQLite    │    │   IndexedDB     │
│  Database   │    │    Storage      │
└─────────────┘    └─────────────────┘
```

### 1.2 Current Strengths

- ✅ **Excellent Offline Support** - Full functionality without internet
- ✅ **Dual Platform Support** - Desktop and web from single codebase
- ✅ **Clean Architecture** - Domain-driven design with repository pattern
- ✅ **Modern Tech Stack** - Angular 21, TypeScript, Signals
- ✅ **16 Dual Repositories (32 implementations)** - Each entity has SQLite + IndexedDB implementations
- ✅ **Role-Based Access Control** - Admin, Cashier, Kitchen, Driver roles
- ✅ **Data Export/Import** - Backup/restore with optional encryption

### 1.3 Current Limitations for SaaS/On-Prem

- ❌ **No Central Database** - Each installation is isolated
- ❌ **No Multi-Tenancy** - Cannot serve multiple businesses from one deployment
- ❌ **No Real-Time Sync** - Data changes don't propagate across devices
- ❌ **No Cloud Backup** - Backups are manual and local only
- ❌ **No Centralized Management** - No admin dashboard for managing multiple locations
- ❌ **No Subscription Management** - No billing, licensing, or usage tracking
- ❌ **No Analytics Dashboard** - No aggregated reporting across tenants
- ❌ **Limited Scalability** - Single-device operation only

---

## 2. Target Architecture Overview

### 2.1 Three Deployment Modes

The transformed system will support three operational modes:

```
┌─────────────────────────────────────────────────────────────┐
│  MODE 1: LOCAL-FIRST (Current - Maintain Compatibility)     │
│  • Desktop/PWA with local storage only                      │
│  • No backend required                                      │
│  • Offline-only operation                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MODE 2: SAAS (Multi-Tenant Cloud)                          │
│  • Central cloud backend with PostgreSQL                    │
│  • Multi-tenant database with row-level security            │
│  • Subscription-based licensing                             │
│  • Real-time sync across devices                            │
│  • Centralized admin dashboard                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MODE 3: ON-PREMISE ENTERPRISE                              │
│  • Self-hosted backend on customer infrastructure           │
│  • Single-tenant dedicated database                         │
│  • Enterprise SSO integration (SAML, OAuth)                 │
│  • Air-gapped deployment support                            │
│  • Advanced audit logging                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Unified Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Angular 21 Frontend                         │
│     (Enhanced with Mode Detection & Sync Engine)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌─────────▼────────┐
│  Local Storage │      │  Backend API     │
│ (SQLite/IDB)   │◄────►│   (Optional)     │
└────────────────┘      └─────────┬────────┘
   Offline Cache                  │
   (Always Active)                │
                          ┌───────┴────────┐
                          │                │
                  ┌───────▼──────┐   ┌─────▼────────┐
                  │ PostgreSQL   │   │  Redis Cache │
                  │  (SaaS/Prem) │   │  & Job Queue │
                  └──────────────┘   └──────────────┘
```

**Key Principles:**

1. **Local-First Always** - Local storage remains primary, backend is sync target
2. **Progressive Enhancement** - Works offline, enhances when online
3. **Mode Auto-Detection** - Frontend detects available backend automatically
4. **Backward Compatible** - Existing local-only installations continue working

---

## 3. Backend API Development

### 3.1 Technology Stack Recommendation

**Backend: Node.js + NestJS**

- ✅ TypeScript-first (matches frontend)
- ✅ Angular-like architecture (familiar patterns)
- ✅ Built-in validation, guards, interceptors
- ✅ Excellent PostgreSQL support via TypeORM/Prisma
- ✅ WebSocket support for real-time features
- ✅ Comprehensive documentation

**Database: PostgreSQL 16+**

- ✅ Row-Level Security (RLS) for multi-tenancy
- ✅ JSON support for flexible schemas
- ✅ Excellent scalability
- ✅ ACID compliance
- ✅ Free and open-source

### 3.2 API Architecture

```
simple-pos-backend/
├── src/
│   ├── auth/                  # Authentication & JWT
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── guards/
│   ├── tenants/               # Multi-tenancy management
│   │   ├── tenant.entity.ts
│   │   ├── tenant.service.ts
│   │   └── tenant.middleware.ts
│   ├── users/                 # User management
│   ├── products/              # Product CRUD
│   ├── orders/                # Order management
│   ├── sync/                  # Data synchronization
│   │   ├── sync.controller.ts
│   │   ├── sync.service.ts
│   │   └── conflict-resolution.service.ts
│   ├── subscriptions/         # Billing & licensing
│   ├── analytics/             # Aggregated reporting
│   ├── webhooks/              # Integration hooks
│   ├── admin/                 # Super admin dashboard (admin.[domain].com)
│   └── common/
│       ├── decorators/
│       ├── filters/
│       └── interceptors/
├── prisma/                    # Database schema
│   └── schema.prisma
├── migrations/
├── docker-compose.yml
└── package.json
```

### 3.3 Core API Endpoints

#### Authentication

```
POST   /api/v1/auth/register          # Tenant registration
POST   /api/v1/auth/login             # User login (email/PIN)
POST   /api/v1/auth/refresh           # Refresh JWT token
POST   /api/v1/auth/logout            # Invalidate session
GET    /api/v1/auth/me                # Current user info
```

#### Synchronization

```
POST   /api/v1/sync/push              # Push local changes to cloud
GET    /api/v1/sync/pull              # Pull changes from cloud
GET    /api/v1/sync/status            # Check sync status
POST   /api/v1/sync/resolve-conflict # Manual conflict resolution
```

#### Products (Example CRUD)

```
GET    /api/v1/products               # List all products (tenant-scoped)
GET    /api/v1/products/:id           # Get product by ID
POST   /api/v1/products               # Create product
PUT    /api/v1/products/:id           # Update product
DELETE /api/v1/products/:id           # Soft delete product
POST   /api/v1/products/bulk          # Bulk create/update
```

#### Orders

```
GET    /api/v1/orders                 # List orders (with filters)
POST   /api/v1/orders                 # Create order
PATCH  /api/v1/orders/:id/status      # Update order status
GET    /api/v1/orders/:id/receipt     # Get receipt data
GET    /api/v1/orders/kitchen         # Kitchen display data
```

#### Analytics & Reporting

```
GET    /api/v1/analytics/dashboard    # Summary metrics
GET    /api/v1/analytics/sales        # Sales reports
GET    /api/v1/analytics/products     # Product performance
GET    /api/v1/analytics/staff        # Staff performance
```

#### Admin (SaaS Only)

**Super Admin Panel Endpoints** - Used by `admin.[domain].com` (see [Section 4.4](#44-subdomain-routing) for details)

```
GET    /api/v1/admin/tenants          # List all tenants
GET    /api/v1/admin/usage            # Usage statistics
POST   /api/v1/admin/tenants/:id/suspend
POST   /api/v1/admin/tenants/:id/activate
```

> **Note:** These endpoints are only accessible to platform operators via the Super Admin Panel, not to individual tenant users.

### 3.4 Cloud Data Model

To support synchronization and multi-tenancy, all entities will be extended with cloud metadata.

**Base Cloud Entity Metadata:**

```typescript
interface CloudMetadata {
  tenantId: string; // Multi-tenancy isolation
  cloudId?: string; // Cloud database UUID (Source of Truth)
  localId: number; // Local database ID (for tracking)
  version: number; // Optimistic locking for conflict detection
  syncedAt?: Date; // Last successful sync timestamp
  isDirty: boolean; // True if local changes exist
  isDeleted: boolean; // Soft delete flag
}
```

> **Full Schema Reference:** For a complete SQL and JSON schema definition, see [Appendix A: API Schema Examples](#appendix-a-api-schema-examples).

---

## 4. Multi-Tenancy Architecture

### 4.1 Tenant Isolation Strategy

**Approach: Row-Level Security (RLS) with Single Database**

✅ **Advantages:**

- Cost-effective for SaaS (shared resources)
- Centralized backups and maintenance
- Easy cross-tenant analytics
- Simpler deployment

**PostgreSQL RLS Implementation:**

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON products
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Middleware sets tenant context per request, scoped to the current transaction
SET LOCAL app.current_tenant_id = '<tenant-uuid>';
```

### 4.2 Tenant Model

```typescript
interface Tenant {
  id: string; // UUID
  name: string; // Business name
  subdomain: string; // saas-subdomain.[domain].com
  customDomain?: string; // custom.domain.com
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  maxUsers: number;
  maxLocations: number;
  maxDevices: number;
  features: string[]; // ['KITCHEN_DISPLAY', 'DELIVERY', 'ANALYTICS']
  settings: {
    timezone: string;
    currency: string;
    language: string;
    taxRate: number;
  };
  billingInfo: {
    email: string;
    stripeCustomerId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Tenant Onboarding Flow

```
1. User visits [domain].com/signup
2. Enter business details (name, email, subdomain)
3. System creates tenant record
4. Initialize tenant database (RLS context)
5. Create admin user account
6. Generate API keys
7. Show onboarding wizard (import data, configure)
8. Redirect to tenant subdomain
```

### 4.4 Subdomain Routing

**SaaS URL Structure:**

```
restaurant-abc.[domain].com  →  Tenant: restaurant-abc (Business POS application)
cafe-xyz.[domain].com        →  Tenant: cafe-xyz (Business POS application)
admin.[domain].com           →  Super Admin Panel (Platform management)
```

**What is admin.[domain].com?**

The **Super Admin Panel** (`admin.[domain].com`) is a special subdomain reserved for **SaaS platform operators** to manage the entire multi-tenant platform. This is separate from tenant-specific admin interfaces.

**Super Admin Capabilities:**

- **Tenant Management:** View, create, suspend, activate, or delete tenant accounts
- **Usage Monitoring:** Track usage statistics, active users, and resource consumption across all tenants
- **Billing & Subscriptions:** Manage subscription plans, view payment history, handle upgrades/downgrades
- **System Analytics:** Access platform-wide metrics, performance monitoring, and aggregated reports
- **Support Tools:** Assist customers, view tenant data (with proper authorization), troubleshoot issues
- **Platform Settings:** Configure system-wide settings, feature flags, and maintenance modes

**Access Control:**

- **Super Admin users only** - Platform operators, not tenant business owners
- Requires elevated authentication (separate from tenant authentication)
- Typically accessed by SaaS company employees only
- Should implement IP whitelisting and 2FA for security

**Comparison:**

| Level        | URL                               | Purpose                        | Who Has Access?       |
| ------------ | --------------------------------- | ------------------------------ | --------------------- |
| Tenant Admin | restaurant-abc.[domain].com/admin | Manage individual business POS | Business owner/admins |
| Super Admin  | admin.[domain].com                | Manage entire SaaS platform    | Platform operators    |

**API Endpoints:** See [Admin (SaaS Only) API endpoints](#admin-saas-only) in Section 3.3.

**Implementation:**

- Frontend detects subdomain from `window.location.hostname`
- Sends `X-Tenant-ID` header with all API requests (not applicable for super admin)
- Backend middleware validates and sets tenant context
- Super admin routes bypass tenant context and access all tenant data

---

## 5. Authentication & Authorization

### 5.1 Enhanced Authentication System

**Current:** PIN-based local authentication only
**Target:** Multi-mode authentication with JWT

```typescript
// Enhanced AuthService
type AuthMode =
  | 'local' // Current PIN-based (offline)
  | 'cloud' // JWT-based (online)
  | 'hybrid'; // Both (sync when online)

interface CloudAuthCredentials {
  email: string;
  password: string;
  tenantId?: string; // Auto-detected from subdomain
}

interface CloudAuthResponse {
  accessToken: string; // JWT (15 min expiry)
  refreshToken: string; // Refresh token (30 days)
  user: User;
  tenant: Tenant;
  permissions: string[];
}
```

### 5.2 JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "cashier@restaurant.com",
  "tenantId": "tenant-uuid",
  "accountId": 123,
  "role": "CASHIER",
  "permissions": ["orders:create", "orders:read", "products:read"],
  "iat": 1707390187,
  "exp": 1707391087
}
```

### 5.3 Permission Matrix

| Role    | Products | Orders | Users | Reports | Settings | Kitchen | Tables |
| ------- | -------- | ------ | ----- | ------- | -------- | ------- | ------ |
| ADMIN   | CRUD     | CRUD   | CRUD  | Read    | CRUD     | CRUD    | CRUD   |
| CASHIER | Read     | CRUD   | -     | -       | -        | -       | CRUD   |
| KITCHEN | Read     | Update | -     | -       | -        | Read    | -      |
| DRIVER  | Read     | Read   | -     | -       | -        | -       | -      |

### 5.4 SSO Integration (On-Prem Only)

**Supported Protocols:**

- **SAML 2.0** - Enterprise standard (Okta, Azure AD)
- **OAuth 2.0 / OpenID Connect** - Modern standard (Google, Auth0)
- **LDAP/Active Directory** - Legacy enterprise systems

**Implementation:**

- Install Passport.js strategies (passport-saml, passport-oauth2)
- Configure SSO in tenant settings
- Map external roles to internal roles

---

## 6. Data Synchronization

### 6.1 Sync Architecture

**Pattern: Bidirectional Sync with Conflict Resolution**

```
┌────────────────┐         ┌────────────────┐
│  Local Storage │◄───────►│  Sync Engine   │
│ (SQLite/IDB)   │         │   (Frontend)   │
└────────────────┘         └────────┬───────┘
                                    │
                                    │ HTTP/WebSocket
                                    │
                          ┌─────────▼──────────┐
                          │   Backend API      │
                          │  /api/v1/sync/*    │
                          └─────────┬──────────┘
                                    │
                          ┌─────────▼──────────┐
                          │    PostgreSQL      │
                          │ (Source of Truth)  │
                          └────────────────────┘
```

### 6.2 Sync Protocol

**Push Sync (Local → Cloud):**

```typescript
interface SyncPushRequest {
  tenantId: string;
  deviceId: string;              // Unique device identifier
  lastSyncedAt?: Date;           // Last successful sync
  changes: ChangeSet[];
}

interface ChangeSet {
  entity: 'Product' | 'Order' | 'User' | ...;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  localId: number;
  cloudId?: string;
  data: unknown;                 // Validate per-entity payload at runtime
  version: number;               // For optimistic locking
  timestamp: Date;
}

interface SyncPushResponse {
  success: boolean;
  conflicts: Conflict[];         // Items that need resolution
  accepted: Array<{
    localId: number;
    cloudId: string;             // Assigned cloud ID
  }>;
  rejected: Array<{
    localId: number;
    reason: string;
  }>;
}
```

**Pull Sync (Cloud → Local):**

```typescript
interface SyncPullRequest {
  tenantId: string;
  deviceId: string;
  lastSyncedAt?: Date;
  entities: string[]; // ['Product', 'Order', ...]
}

interface SyncPullResponse {
  changes: ChangeSet[];
  deletions: Array<{
    entity: string;
    cloudId: string;
  }>;
  syncedAt: Date;
  hasMore: boolean; // Pagination
  nextCursor?: string;
}
```

### 6.3 Conflict Resolution

**Conflict Scenarios:**

1. **Same field modified on different devices** (most common)
2. **Record deleted on one device, updated on another**
3. **Record created with same local ID on multiple devices**

**Resolution Strategies:**

```typescript
enum ConflictResolutionStrategy {
  SERVER_WINS = 'SERVER_WINS', // Cloud version takes precedence
  CLIENT_WINS = 'CLIENT_WINS', // Local version takes precedence
  LAST_WRITE_WINS = 'LAST_WRITE_WINS', // Most recent timestamp wins
  MANUAL = 'MANUAL', // User decides
  MERGE = 'MERGE', // Intelligent field-level merge
}
```

**Default Rules:**

- **Orders:** `LAST_WRITE_WINS` (operational data)
- **Products:** `SERVER_WINS` (master data)
- **Settings:** `MANUAL` (critical configurations)

**Conflict UI:**

```
┌──────────────────────────────────────────────┐
│  Sync Conflict Detected                      │
├──────────────────────────────────────────────┤
│  Product: "Espresso Coffee"                  │
│                                              │
│  Local Version:         Cloud Version:       │
│  Price: $3.50          Price: $4.00         │
│  Stock: 100            Stock: 95            │
│  Updated: 2 mins ago   Updated: 5 mins ago  │
│                                              │
│  [ Keep Local ] [ Use Cloud ] [ Merge ]     │
└──────────────────────────────────────────────┘
```

### 6.4 Sync Triggers

**Automatic Sync:**

- **On App Launch** - Pull latest changes
- **On Network Reconnect** - Resume interrupted sync
- **Every 5 Minutes** - Background sync (configurable)
- **Before Critical Operations** - Sync before checkout

**Manual Sync:**

- **Pull-to-Refresh** - User-initiated sync
- **"Sync Now" Button** - In settings

**Real-Time Sync (Optional - WebSocket):**

- **Live Order Updates** - Kitchen sees new orders instantly
- **Table Status Changes** - Real-time availability
- **Inventory Alerts** - Low stock notifications

---

## 7. Deployment Strategies

### 7.1 SaaS Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           Kubernetes Ingress (Nginx/Traefik)                │
│              SSL Termination (cert-manager)                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
┌──────▼──────┐    ┌────────▼────────┐
│  Web Tier   │    │   API Tier      │
│  (Angular)  │    │  (NestJS)       │
│  StaticSite │    │  Deployment     │
│  or CDN     │    │  HPA-enabled    │
└─────────────┘    └────────┬────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
         ┌─────────▼────────┐  ┌────▼─────────┐
         │  PostgreSQL      │  │  Redis       │
         │  StatefulSet     │  │  Deployment  │
         │  (Primary DB)    │  │  (Sessions)  │
         └──────────────────┘  └──────────────┘
```

#### Infrastructure Strategy

- **SaaS Deployment**: Kubernetes-based architecture for high availability and scalability.
- **On-Premise Deployment**: Docker Compose for simple installations, Helm charts for enterprise environments.
- **Edge Deployment**: Local-first operation with centralized cloud synchronization.

> **Full Cost Analysis:** For detailed infrastructure and server cost estimations (including Swiss hosting), see [Section 13: Cost Estimation](#13-cost-estimation).

### 7.2 On-Premise Deployment

**Deployment Options:**

**Option 1: Docker Compose (Small/Medium)**

```yaml
version: '3.8'
services:
  frontend:
    image: simplepos/frontend:latest
    ports:
      - '80:80'
      - '443:443'

  backend:
    image: simplepos/backend:latest
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/simplepos
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Option 2: Kubernetes (Enterprise)**

```yaml
# Helm chart structure
simple-pos/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── frontend-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── postgres-statefulset.yaml
│   ├── redis-deployment.yaml
│   ├── ingress.yaml
│   └── secrets.yaml
```

**System Requirements:**

- **CPU:** 4 cores minimum (8 cores recommended)
- **RAM:** 8 GB minimum (16 GB recommended)
- **Storage:** 50 GB SSD minimum (depends on data volume)
- **OS:** Linux (Ubuntu 22.04 LTS, RHEL 9, or equivalent)

### 7.3 Hybrid Deployment (Edge + Cloud)

**Use Case:** Multi-location restaurants with central oversight

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Location 1   │     │  Location 2   │     │  Location 3   │
│  ┌─────────┐  │     │  ┌─────────┐  │     │  ┌─────────┐  │
│  │ Edge DB │  │     │  │ Edge DB │  │     │  │ Edge DB │  │
│  │ SQLite  │  │     │  │ SQLite  │  │     │  │ SQLite  │  │
│  └────┬────┘  │     │  └────┬────┘  │     │  └────┬────┘  │
└───────┼───────┘     └───────┼───────┘     └───────┼───────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Cloud Backend    │
                    │   (PostgreSQL)     │
                    │ Aggregated Reports │
                    └────────────────────┘
```

**Benefits:**

- **Fast Local Operations** - No latency for POS transactions
- **Offline Resilience** - Each location works independently
- **Central Reporting** - Aggregate data across all locations
- **Inventory Sync** - Share product catalog and pricing

---

## 8. Security Enhancements

### 8.1 Data Encryption

**At Rest:**

- **SaaS:** Managed PostgreSQL encryption + encrypted backups
- **On-Prem:** PostgreSQL + dm-crypt/LUKS
- **Local:** Encrypt SQLite databases with SQLCipher

**In Transit:**

- **TLS 1.3** for all HTTPS communication
- **Certificate Pinning** in Tauri apps (optional)

### 8.2 Security Headers

```typescript
// NestJS security middleware
app.use(helmet({
  contentSecurityPolicy: {...},
  hsts: { maxAge: 31536000 },
  frameguard: { action: 'deny' },
  noSniff: true,
}));

app.enableCors({
  origin: ['https://*.[domain].com'],
  credentials: true,
});
```

### 8.3 Rate Limiting

```typescript
// Prevent brute force attacks
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per 60 seconds
@Post('auth/login')
async login() {...}
```

### 8.4 Audit Logging

**Track All Critical Operations:**

```typescript
interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string; // 'ORDER_CREATED', 'PRODUCT_DELETED'
  entity: string; // 'Order', 'Product'
  entityId: string;
  changes?: {
    // Before/after snapshot
    before: any;
    after: any;
  };
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

**GDPR Compliance:**

- **Data Export:** API endpoint to export user data
- **Right to Deletion:** Soft delete with anonymization
- **Data Retention:** Configurable retention policies

---

## 9. Infrastructure Requirements

### 9.1 Development Environment

```bash
# Required tools
- Node.js 20+
- pnpm 10+
- Docker Desktop
- PostgreSQL 16
- Redis 7
- Rust (for Tauri)

# Setup
git clone <backend-repo>
cd simple-pos-backend
cp .env.example .env
docker-compose up -d
pnpm install
pnpm run migrate
pnpm run dev
```

### 9.2 CI/CD Pipeline

**GitHub Actions Workflows:**

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm nx test api
      - run: pnpm nx build api

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: kubectl apply -f k8s/
```

**Branching Strategy:**

This project uses **trunk-based development** with a single `main` branch:

- ✅ **Feature branches** → PR → `main`
- ✅ **Hotfix branches** → PR → `main`
- ✅ **Deploy from `main`** only
- ✅ **Short-lived branches** (< 2 days preferred)
- ✅ **Semantic versioning** via conventional commits
- ✅ **CI runs on all PRs** targeting `main`
- ✅ **CD deploys only from `main`**

### 9.3 Monitoring & Observability

**Metrics to Track:**

- **Application:** Request latency, error rates, throughput
- **Database:** Query performance, connection pool, disk I/O
- **Business:** Active users, orders/hour, revenue

**Tools:**

- **APM:** Datadog, New Relic, or Sentry
- **Logs:** ELK/EFK Stack (Elasticsearch, Fluentd/Logstash, Kibana)
- **Metrics:** Prometheus + Grafana
- **Uptime:** UptimeRobot, Pingdom, or StatusCake

---

## 10. Nx Monorepo Architecture

> **Phase 0.5 Status**: ✅ Complete (February 9, 2026)
> The monorepo structure is fully operational with 5 projects: pos, native, shared-types, shared-utils, domain.

### 10.1 Strategic Choice: Nx Monorepo

To manage the addition of the NestJS backend and shared libraries while maintaining high velocity, we use an **Nx monorepo** architecture.

**Architectural Benefits:**

- **Type Safety**: Unified types across apps/libs eliminates contract drift.
- **Workflow Efficiency**: Single-command development and atomic cross-app changes.
- **CI Performance**: Computation caching and `affected` command logic significantly reduce build times.

### 10.2 Monorepo Project Map

**Current Structure (Phase 0.5):**

```
simple-pos/
├── apps/
│   ├── pos/          # Angular 21 (Frontend) ✅
│   └── native/       # Tauri Core (Desktop host) ✅
├── libs/
│   ├── domain/       # Shared business logic and validators ✅
│   └── shared/
│       ├── types/    # Contract definitions (Entities/DTOs) ✅
│       └── utils/    # Common helper functions ✅
└── tools/            # Scaffolding and custom workspace generators
```

**Planned Structure (Phase 1+):**

```
simple-pos/
├── apps/
│   ├── pos/          # Angular 21 (Frontend) ✅
│   ├── api/          # NestJS (Backend) 📋 Phase 1
│   └── native/       # Tauri Core (Desktop host) ✅
├── libs/
│   ├── domain/       # Shared business logic and validators ✅
│   ├── shared/
│   │   ├── types/    # Contract definitions (Entities/DTOs) ✅
│   │   └── utils/    # Common helper functions ✅
│   └── ui/           # Reusable Angular design system 📋 Future
└── tools/            # Scaffolding and custom workspace generators
```

### 10.3 Core Developer Workflow

**Current Commands (Phase 0.5):**

```bash
pnpm start            # Launch pos app in dev mode
pnpm run tauri:dev    # Launch desktop app
pnpm nx graph         # Visualize internal dependencies
pnpm nx affected:test # Targeted CI verification
pnpm nx build pos     # Build production bundle
```

**Future Commands (Phase 1+):**

```bash
pnpm dev              # Launch all applications in watch mode
pnpm nx serve api     # Start NestJS backend
```

> **Setup Instructions:** For detailed environment walkthrough, refer to the [README](../README.md) and [Nx Migration Plan](./nx-monorepo-migration-plan.md).

**Platform Support:**

- **Desktop**: Windows, macOS, Linux (via Tauri) ✅
- **Web**: PWA (via Angular standalone) ✅
- **Mobile**: iOS, Android (via Tauri Mobile) 📋 Future

### 10.4 Strategic Code Sharing

We enforce contract consistency by importing from specialized shared libraries using TypeScript path aliases.

**Current Implementation (Phase 0.5):**

```typescript
// Shared entities/contracts consumed by pos and native apps
import { Product, OrderStatusEnum } from '@simple-pos/shared/types';
import { calculateTaxInclusive, calculateGrandTotal } from '@simple-pos/domain';
import { formatDate } from '@simple-pos/shared/utils';
```

**Future Implementation (Phase 1+):**

```typescript
// Shared entities/contracts consumed by pos, api, and native
import { Product, CreateOrderDto } from '@simple-pos/shared/types';
import { calculateTaxInclusive, calculateGrandTotal } from '@simple-pos/domain';
```

---

## 11. Implementation Roadmap

The transformation follows a phased approach, moving from the current monolithic local-first structure to a cloud-integrated Nx monorepo.

### 11.1 Phased Rollout

| Phase         | Milestone                   | Focus                            | Status |
| :------------ | :-------------------------- | :------------------------------- | :----- |
| **Phase 0**   | **Multi-Tenant Foundation** | Core user & database logic       | ✅     |
| **Phase 0.5** | **Nx Monorepo Migration**   | Restructuring & shared types     | ✅     |
| **Phase 1**   | **Backend Foundation**      | NestJS, RLS, & Authentication    | ✅     |
| **Phase 2**   | **Sync Engine**             | Bidirectional sync & Conflict UI | 📋     |
| **Phase 3**   | **SaaS & Launch**           | Billing, Tenants, & Production   | 📋     |
| **Phase 4**   | **Enterprise/On-Prem**      | Helm charts, SSO, air-gap        | 📋     |

---

### Phase 0: Multi-Tenant Foundation ✅

Successfully implemented globally unique emails, account-scoped staff usernames, and owner verification workflows.

### Phase 0.5: Nx Monorepo Restructuring ✅

**Status**: Completed February 9, 2026

Successfully migrated from the flat structure to an Nx monorepo with clear separation of concerns:

- ✅ **Workspace Structure**: `apps/pos` (Angular), `apps/native` (Tauri), `libs/` (shared code)
- ✅ **Shared Libraries**: `@simple-pos/shared/types`, `@simple-pos/domain`, `@simple-pos/shared/utils`
- ✅ **Path Aliases**: All imports use workspace-scoped paths (`@simple-pos/*`)
- ✅ **Build System**: Nx 22.4.5 with caching and dependency graph
- ✅ **Verification**: 1000 tests passing, zero legacy imports, builds working

- 📋 **[Detailed Nx Migration Plan](./nx-monorepo-migration-plan.md)** - Complete implementation guide and verification results.

### Phase 1: Backend Foundation (Sprint 1-8) ✅

**Status**: Completed February 9, 2026

Successfully implemented the complete backend foundation with NestJS in the Nx monorepo:

- ✅ **NestJS Application**: Initialized NestJS backend in `apps/api` with Nx integration (v1.18.0)
- ✅ **Multi-Tenancy**: PostgreSQL Row-Level Security (RLS) with Prisma v7 (v1.19.0)
- ✅ **JWT Authentication**: Secure authentication system with role-based access control (v1.20.0)
- ✅ **Core CRUD APIs**: RESTful endpoints for Products, Orders, and Customers with full test coverage

**Key Achievements:**

- **Database**: PostgreSQL with automated RLS policies enforcing tenant isolation
- **API Modules**: Products, Orders, Customers, and Auth modules with controllers and services
- **Multi-Tenancy & Security**: JWT-based authentication with tenant context middleware (`X-Tenant-ID` header), `@TenantId()` decorator, and PostgreSQL RLS policies (no dedicated Tenants API module)
- **Testing**: Unit tests added for Products, Orders, Customers, and Auth controllers and services
- **Documentation**: API README with setup instructions and multi-tenancy usage examples

### Phase 2: Synchronization & Frontend (Sprint 9-14) 📋

- [ ] Bidirectional sync protocol (Push/Pull)
- [ ] Conflict detection & Merge UI
- [ ] Mode detection (Local vs Cloud)

### Phase 3: SaaS Platform (Sprint 15-18) 📋

- [ ] Tenant onboarding & management portal
- [ ] Stripe integration for subscriptions
- [ ] Platform monitoring and analytics

### Phase 4: Enterprise Ready (Sprint 19-24) 📋

- [ ] SSO integration (SAML/OAuth)
- [ ] Docker Compose & Helm chart packaging
- [ ] Professional services & custom domains

### 11.1 Data Migration Tooling

A dedicated migration service will facilitate moving existing local-only businesses to the SaaS cloud by batch-uploading local SQLite/IndexedDB records to the cloud PostgreSQL database and mapping them to assigned Cloud IDs.

---

## 12. Cost Estimation

### 12.1 Development Costs

**Team Composition:**

- **Backend Developer (Senior):** 4-5 months full-time
- **Frontend Developer (Mid-Senior):** 3-4 months full-time
- **DevOps Engineer:** 1-2 months (setup + ongoing)
- **QA Engineer:** 1 month full-time
- **UI/UX Designer:** 1 month (admin dashboard, onboarding)
- **Technical Writer:** 2 weeks (documentation)

**Estimated Hours:** 1,200 - 1,500 hours
**Cost Range:** $60,000 - $150,000 (depending on location/rates)

### 12.2 Operating Models and Infrastructure Costs

Managed solutions offer high reliability, while dedicated hosting in regions like Switzerland provides exceptional data sovereignty and cost efficiency.

| Component      | Managed Cloud (Est.) | Dedicated Swiss (Est.) |
| :------------- | :------------------- | :--------------------- |
| Core Resources | $150 - $250 (K8s)    | $80 - $130 (VM)        |
| Persistent DB  | $50 - $80            | Included/Managed       |
| Redis/Cache    | $15 - $25            | Included/Managed       |
| Total (Month)  | **$215 - $355**      | **$93 - $175**         |

**Strategic Considerations for Swiss Hosting:**

- **Data Sovereignty**: Compliance with Swiss privacy laws and banking-grade security standards.
- **Cost Savings**: Realize 40-70% reduction in OpEx vs managed cloud clusters.
- **Operational Overhead**: Dedicated setups require more standard DevOps management for scaling and patching.

### 12.3 Strategic Pricing Strategy (SaaS)

**Suggested Plans:**

| Plan           | Price/Month | Users     | Locations | Features                          |
| -------------- | ----------- | --------- | --------- | --------------------------------- |
| **Free**       | $0          | 2         | 1         | Basic POS, 50 orders/month        |
| **Basic**      | $29         | 5         | 1         | Unlimited orders, Kitchen display |
| **Pro**        | $79         | 20        | 3         | Multi-location, Analytics         |
| **Enterprise** | Custom      | Unlimited | Unlimited | SSO, On-prem, White-label         |

**On-Premise Licensing:**

- **One-Time License:** $2,999 - $9,999 (perpetual)
- **Annual Support:** 20% of license fee
- **Professional Services:** $150-200/hour

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

| Risk                        | Impact   | Mitigation                                    |
| --------------------------- | -------- | --------------------------------------------- |
| **Sync conflicts frequent** | High     | Implement intelligent merging, user education |
| **Backend downtime**        | High     | Multi-AZ deployment, fallback to local mode   |
| **Data loss during sync**   | Critical | Atomic transactions, extensive testing        |
| **Performance degradation** | Medium   | Database indexing, caching, CDN               |

### 13.2 Business Risks

| Risk                              | Impact   | Mitigation                                           |
| --------------------------------- | -------- | ---------------------------------------------------- |
| **Low adoption rate**             | High     | Beta testing, gradual rollout, free tier             |
| **Competition**                   | Medium   | Focus on unique features (thermal printing, offline) |
| **Compliance issues (GDPR, PCI)** | Critical | Legal review, security audit                         |

---

## 14. Success Metrics

### 14.1 Technical KPIs

- **Sync Success Rate:** >99%
- **API Uptime:** >99.9%
- **Sync Latency:** <2 seconds
- **Conflict Rate:** <1% of operations

### 14.2 Business KPIs

- **Active Tenants:** 100 (Month 3), 500 (Month 12)
- **User Satisfaction:** >4.5/5 stars
- **Churn Rate:** <5% monthly
- **Revenue:** $10K MRR (Month 6), $50K MRR (Month 12)

---

## 15. Strategic Summary & Next Steps

This transformation is a multi-phase evolution aimed at high-availability SaaS and flexible on-premise deployment levels while retaining local-first operational integrity.

### 15.1 Critical Success Factors

- **Maintain local-first integrity**: Core PoS transactions must always be offline-capable.
- **Unified Identity**: Seamless migration from local PIN-based login to JWT cloud-backed authentication.
- **Contract Resilience**: Strict enforcement of shared types to prevent application drift.

### 15.2 Executive Action Items

1. **Decision Matrix Check**: Confirm primary focus (SaaS vs. On-Prem) and target go-live window.
2. **Budget Calibration**: Approve initial ~1,200 hour development effort.
3. **Proof of Concept**: Execute a 2-week sync engine prototype to validate bidirectional conflict resolution.
4. **Architectural Guardrails**: Formalize Nx workspace standards for team onboarding.

---

## Appendix A: API Schema Examples

### Product Schema (PostgreSQL)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  local_id INTEGER,                     -- Original local DB ID
  account_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  variant_id UUID REFERENCES variants(id),
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  image_url VARCHAR(512),
  version INTEGER DEFAULT 1,            -- Optimistic locking
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,

  CONSTRAINT price_positive CHECK (price >= 0),
  CONSTRAINT stock_non_negative CHECK (stock_quantity >= 0)
);

-- Indexes
CREATE INDEX idx_products_tenant ON products(tenant_id) WHERE is_deleted = false;
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_deleted = false;

-- Row-Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Sync Request/Response Examples

**Push Request:**

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceId": "device-123-abc",
  "lastSyncedAt": "2026-02-08T10:00:00Z",
  "changes": [
    {
      "entity": "Product",
      "operation": "CREATE",
      "localId": 42,
      "data": {
        "name": "New Coffee",
        "price": 3.99,
        "categoryId": 1,
        "stockQuantity": 100,
        "isActive": true
      },
      "version": 1,
      "timestamp": "2026-02-08T12:30:00Z"
    },
    {
      "entity": "Order",
      "operation": "UPDATE",
      "localId": 123,
      "cloudId": "660e8400-e29b-41d4-a716-446655440000",
      "data": {
        "status": "COMPLETED",
        "completedAt": "2026-02-08T12:45:00Z"
      },
      "version": 3,
      "timestamp": "2026-02-08T12:45:00Z"
    }
  ]
}
```

**Push Response:**

```json
{
  "success": true,
  "conflicts": [],
  "accepted": [
    {
      "localId": 42,
      "cloudId": "770e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "rejected": [],
  "syncedAt": "2026-02-08T12:50:00Z"
}
```

---

## Appendix B: Quick Reference & Related Documents

### Implementation Plans

- ✅ **[Nx Monorepo Migration Plan](./nx-monorepo-migration-plan.md)** - Phase 0.5 complete implementation guide with verification results
- 📖 **[Architecture Documentation](./architecture.md)** - Current system architecture with Nx monorepo structure

### AI Agent Configuration

- 🤖 **[AI Agent Rules](../.agent/rules.md)** - Project-wide rules for AI agents
- 💬 **[GitHub Copilot Instructions](../.github/copilot-instructions.md)** - Copilot custom instructions
- 🎯 **[Custom Agents](../.github/agents/README.md)** - Specialized AI agents for specific tasks
  - [Test Specialist](../.github/agents/test-specialist.agent.md)
  - [Repository Specialist](../.github/agents/repository-specialist.agent.md)
  - [Angular Component Specialist](../.github/agents/angular-component-specialist.agent.md)

### Developer Resources

- 📘 **[README](../README.md)** - Project overview and quick start
- 🤝 **[Contributing Guide](../CONTRIBUTING.md)** - How to contribute to the project
- 📝 **[CHANGELOG](../CHANGELOG.md)** - Version history and changes

### External References

- 🔗 **[Nx Documentation](https://nx.dev/getting-started/intro)** - Nx monorepo tool
- 🔗 **[Angular Documentation](https://angular.dev/)** - Angular framework
- 🔗 **[NestJS Documentation](https://docs.nestjs.com/)** - NestJS backend framework
- 🔗 **[Tauri Documentation](https://tauri.app/v2/)** - Tauri desktop framework
- 🔗 **[Conventional Commits](https://www.conventionalcommits.org/)** - Commit message convention

### Quick Navigation

| Section                  | Link                                          |
| ------------------------ | --------------------------------------------- |
| Current Architecture     | [Section 1](#1-current-architecture-analysis) |
| Nx Monorepo Architecture | [Section 10](#10-nx-monorepo-architecture)    |
| Migration Strategy       | [Section 11](#11-implementation-roadmap)      |
| Cost Estimation          | [Section 12](#12-cost-estimation)             |

---

**Document End**

_For questions or clarifications, contact the development team or open an issue on the repository._
