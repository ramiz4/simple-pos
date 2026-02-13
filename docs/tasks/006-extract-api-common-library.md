# Task: Extract API Common Utilities to a Shared Library

## Description

The NestJS API (`apps/api`) contains shared infrastructure code inside `apps/api/src/app/common/` (currently just Prisma module/service). As the API grows with more modules, shared concerns like guards, decorators, middleware, exception filters, and pagination utilities will accumulate in `common/`. Extracting these to a dedicated Nx library improves testability, enforces boundaries, and prepares for potential future APIs (e.g., a separate admin API or webhook service).

## Status

- **Identified**: February 13, 2026
- **Status**: Open
- **Priority**: Medium
- **Effort**: Medium

## Recommended Agent

- **Agent**: `nestjs-engineer`

## Current State

### API Module Structure

```
apps/api/src/app/
├── common/
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
├── auth/
│   ├── decorators/
│   ├── guards/
│   ├── strategies/
│   ├── interfaces/
│   ├── dto/
│   └── jwt-config.ts
├── tenants/
│   ├── tenant.decorator.ts
│   ├── tenant.middleware.ts
│   └── tenant-host.utils.ts
├── admin/
├── analytics/
├── customers/
├── enterprise/
├── orders/
├── products/
├── sso/
├── subscriptions/
└── sync/
```

### Scattered Shared Concerns

| Concern                        | Current Location               | Why It Should Be Extracted     |
| ------------------------------ | ------------------------------ | ------------------------------ |
| `PrismaModule`/`PrismaService` | `common/prisma/`               | Foundation for all data access |
| Auth guards (JWT, roles)       | `auth/guards/`                 | Used by all modules            |
| Auth decorators                | `auth/decorators/`             | Used across controllers        |
| Auth strategies                | `auth/strategies/`             | Reusable auth config           |
| Tenant middleware              | `tenants/tenant.middleware.ts` | Applied globally               |
| Tenant decorator               | `tenants/tenant.decorator.ts`  | Used across controllers        |
| JWT config                     | `auth/jwt-config.ts`           | Shared config                  |

## Impact

- The `auth/` module is both a feature module AND a provider of shared guards/decorators — mixed concerns
- Tenant resolution middleware sits inside the `tenants/` feature module but applies to all routes
- Adding a new backend app (e.g., webhook processor) would require importing directly from `apps/api`
- No isolation for testing infrastructure code independently

## Proposed Solution

### New Library Structure

```
libs/
  api-common/                       # @simple-pos/api-common
    src/
      lib/
        prisma/
          prisma.module.ts
          prisma.service.ts
          prisma.service.spec.ts
        guards/
          jwt-auth.guard.ts
          roles.guard.ts
          tenant.guard.ts
        decorators/
          current-user.decorator.ts
          tenant.decorator.ts
          roles.decorator.ts
        middleware/
          tenant.middleware.ts
        filters/
          http-exception.filter.ts   # Global exception handling
        interceptors/
          logging.interceptor.ts     # Request logging
        pagination/
          pagination.dto.ts
          paginate.util.ts
        config/
          jwt.config.ts
      index.ts
    project.json
    tsconfig.json
    tsconfig.lib.json
    tsconfig.spec.json
    vitest.config.mts
```

### Step 1: Generate the Library

```bash
pnpm nx g @nx/nest:lib api-common --directory=libs/api-common --importPath=@simple-pos/api-common
```

### Step 2: Add Path Alias

Add to `tsconfig.base.json`:

```json
"paths": {
  "@simple-pos/api-common": ["libs/api-common/src/index.ts"],
  // ... existing paths
}
```

### Step 3: Move Prisma Module

```bash
mv apps/api/src/app/common/prisma/* libs/api-common/src/lib/prisma/
```

Update re-exports from `libs/api-common/src/index.ts`:

```typescript
export * from './lib/prisma/prisma.module';
export * from './lib/prisma/prisma.service';
```

### Step 4: Extract Auth Infrastructure (guards, decorators)

Move **infrastructure** pieces from `auth/` — leave the auth **feature** (AuthService, AuthController, login/register logic) in the app:

```bash
# Guards used by other modules
mv apps/api/src/app/auth/guards/jwt-auth.guard.ts libs/api-common/src/lib/guards/
mv apps/api/src/app/auth/guards/roles.guard.ts libs/api-common/src/lib/guards/

# Decorators used by other modules
mv apps/api/src/app/auth/current-user.decorator.ts libs/api-common/src/lib/decorators/
mv apps/api/src/app/auth/decorators/* libs/api-common/src/lib/decorators/

# JWT config
mv apps/api/src/app/auth/jwt-config.ts libs/api-common/src/lib/config/
```

### Step 5: Extract Tenant Infrastructure

```bash
mv apps/api/src/app/tenants/tenant.middleware.ts libs/api-common/src/lib/middleware/
mv apps/api/src/app/tenants/tenant.decorator.ts libs/api-common/src/lib/decorators/
mv apps/api/src/app/tenants/tenant-host.utils.ts libs/api-common/src/lib/middleware/
```

### Step 6: Update All Imports in API

```typescript
// Before:
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

// After:
import { PrismaService, JwtAuthGuard, CurrentUser } from '@simple-pos/api-common';
```

### Step 7: Tag the Library

```json
// libs/api-common/project.json
{
  "tags": ["scope:api", "type:utils"]
}
```

### Step 8: Validate

```bash
pnpm nx build api
pnpm nx test api
pnpm nx test api-common
pnpm nx lint api
pnpm nx lint api-common
```

## Migration Order

To minimize risk, migrate in phases:

1. **Phase 1**: Move `PrismaModule/Service` (most impactful, touches everything)
2. **Phase 2**: Move guards and decorators
3. **Phase 3**: Move middleware and config
4. **Phase 4**: Add new shared concerns (filters, interceptors, pagination)

## Acceptance Criteria

- [ ] New `libs/api-common` library created with `@simple-pos/api-common` import path
- [ ] `PrismaModule` and `PrismaService` moved and re-exported
- [ ] Auth guards and decorators moved (feature logic remains in `apps/api`)
- [ ] Tenant middleware and decorator moved
- [ ] All API module imports updated to `@simple-pos/api-common`
- [ ] `apps/api/src/app/common/` directory removed
- [ ] All tests pass
- [ ] Lint passes with proper Nx tags

## References

- [Nx NestJS Plugin](https://nx.dev/nx-api/nest)
- [NestJS Module Structure Best Practices](https://docs.nestjs.com/modules)
- [Nx Library Types](https://nx.dev/concepts/more-concepts/library-types)
