# Task: Share Types Between API and POS via Libs

## Description

The NestJS API (`apps/api`) defines its own DTOs and interfaces independently in each module's `dto/` folder, while the POS Angular app uses `@simple-pos/shared/types`. This creates a type duplication risk — especially for the sync layer, where the POS client must serialize/deserialize using the exact same contracts the API expects. Currently, there's no guarantee these stay in sync.

## Status

- **Identified**: February 13, 2026
- **Status**: Open
- **Priority**: Medium
- **Effort**: Medium

## Recommended Agent

- **Agent**: `software-architect`

## Current State

### API DTOs (per module, not shared)

```
apps/api/src/app/
├── auth/dto/
├── customers/dto/
├── orders/dto/
├── products/dto/
├── subscriptions/dto/
├── tenants/dto/
├── enterprise/dto/
├── sso/dto/
└── admin/dto/
```

### Shared Types (used by POS, not imported by API)

```
libs/shared/types/src/lib/
├── product.interface.ts
├── order.interface.ts
├── order-item.interface.ts
├── user.interface.ts
├── category.interface.ts
├── ... (25 files)
```

### The Mismatch Risk

- POS sends a `Product` to the API during sync — the shape is defined in `@simple-pos/shared/types`
- API validates incoming data against its own `CreateProductDto` — defined in `apps/api/src/app/products/dto/`
- If either side changes without updating the other, sync breaks silently at runtime

## Impact

- **Runtime sync failures**: Mismatched field names, missing required fields
- **Duplicated maintenance**: Interface changes require two separate updates
- **No compile-time safety**: The API and POS compile independently
- **Testing gap**: Integration tests between API and POS don't catch schema drift

## Proposed Solution

### Create a shared DTO library

Create a new library for request/response contracts that both apps import:

```
libs/
  shared/
    dto/                          # NEW: @simple-pos/shared/dto
      src/
        lib/
          auth/
            login-request.dto.ts
            login-response.dto.ts
          products/
            create-product.dto.ts
            update-product.dto.ts
            product-response.dto.ts
          orders/
            create-order.dto.ts
            order-response.dto.ts
          sync/
            sync-push.dto.ts
            sync-pull.dto.ts
            entity-change.dto.ts
          tenants/
            create-tenant.dto.ts
            tenant-response.dto.ts
        index.ts
      project.json
      tsconfig.json
      tsconfig.lib.json
```

### Step 1: Generate the Library

```bash
pnpm nx g @nx/js:lib shared-dto --directory=libs/shared/dto --importPath=@simple-pos/shared/dto
```

### Step 2: Add Path Alias

Add to `tsconfig.base.json`:

```json
"paths": {
  "@simple-pos/shared/types": ["libs/shared/types/src/index.ts"],
  "@simple-pos/shared/utils": ["libs/shared/utils/src/index.ts"],
  "@simple-pos/shared/dto": ["libs/shared/dto/src/index.ts"],    // NEW
  "@simple-pos/domain": ["libs/domain/src/index.ts"]
}
```

### Step 3: Define Shared DTOs

DTOs should be plain TypeScript classes/interfaces with no framework decorators. Use them as the **source of truth** for request/response shapes:

```typescript
// libs/shared/dto/src/lib/products/create-product.dto.ts
import { Product } from '@simple-pos/shared/types';

export interface CreateProductDto {
  name: string;
  price: number;
  categoryId: number;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductResponseDto extends Product {
  categoryName?: string;
}
```

### Step 4: API Uses Shared DTOs

```typescript
// apps/api/src/app/products/products.controller.ts
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '@simple-pos/shared/dto';

@Controller('products')
export class ProductsController {
  @Post()
  create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> { ... }
}
```

> **Note for NestJS validation**: If using `class-validator` decorators, create a thin API-specific wrapper class that extends the shared DTO and adds decorators. The shared DTO remains decorator-free.

### Step 5: POS Client Uses Same DTOs

```typescript
// apps/pos/src/app/infrastructure/http/cloud-sync-client.service.ts
import { CreateProductDto, ProductResponseDto } from '@simple-pos/shared/dto';

async pushProduct(product: Product): Promise<ProductResponseDto> {
  const dto: CreateProductDto = { name: product.name, price: product.price, ... };
  return this.http.post<ProductResponseDto>('/api/products', dto);
}
```

### Step 6: Tag the New Library

```json
// libs/shared/dto/project.json
{
  "tags": ["scope:shared", "type:dto"]
}
```

Update ESLint boundaries: apps can depend on `type:dto`, but `type:domain` and `type:types` cannot.

## Acceptance Criteria

- [ ] Shared DTO library created at `libs/shared/dto` (or shared types are imported by API)
- [ ] Path alias `@simple-pos/shared/dto` configured in `tsconfig.base.json`
- [ ] API controllers/services use shared DTOs for request/response shapes
- [ ] POS sync client uses the same shared DTOs
- [ ] Compile-time errors surface if DTO shapes diverge
- [ ] All tests pass for both `pos` and `api`
- [ ] Nx boundary rules updated to include new library

## References

- [NestJS DTOs and Validation](https://docs.nestjs.com/techniques/validation)
- [Nx Sharing Code Between Applications](https://nx.dev/concepts/more-concepts/applications-and-libraries)
