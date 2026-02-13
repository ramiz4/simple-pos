# Task: Dissolve `apps/pos/shared/` Into Correct Architecture Layers

## Description

The `apps/pos/src/app/shared/` folder contains a mix of utilities, services, and directives that belong in different Clean Architecture layers. This folder also shadows the monorepo's `libs/shared/`, creating naming confusion and diluting the principle that truly shared code lives in `libs/`.

## Status

- **Identified**: February 13, 2026
- **Status**: Completed
- **Priority**: Medium
- **Effort**: Low

## Recommended Agent

- **Agent**: `software-architect`

## Current State

### Contents of `apps/pos/src/app/shared/`

```
shared/
├── directives/
│   └── auto-focus.directive.ts
└── utilities/
    ├── input-sanitizer.service.spec.ts
    ├── input-sanitizer.service.ts
    ├── platform.service.spec.ts
    ├── platform.service.ts
    ├── rate-limiter.service.spec.ts
    └── rate-limiter.service.ts
```

### Why It's Problematic

1. **Name collision**: `apps/pos/src/app/shared/` vs `libs/shared/` — developers may confuse which to use for new code
2. **Misplaced services**: `PlatformService` is an infrastructure concern (platform detection), not a generic utility
3. **Missed sharing opportunity**: `InputSanitizerService` and `RateLimiterService` are reusable across apps (API could use them too)
4. **UI concern in utilities**: `AutoFocusDirective` is a pure UI directive

## Proposed Solution

### Migration Map

| Current Location                                   | New Location                                                | Rationale                                       |
| -------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| `shared/utilities/platform.service.ts`             | `infrastructure/services/platform.service.ts`               | Platform detection is an infrastructure concern |
| `shared/utilities/platform.service.spec.ts`        | `infrastructure/services/platform.service.spec.ts`          | Co-locate test                                  |
| `shared/utilities/input-sanitizer.service.ts`      | `libs/shared/utils/src/lib/input-sanitizer.service.ts`      | Reusable across apps                            |
| `shared/utilities/input-sanitizer.service.spec.ts` | `libs/shared/utils/src/lib/input-sanitizer.service.spec.ts` | Co-locate test                                  |
| `shared/utilities/rate-limiter.service.ts`         | `core/services/rate-limiter.service.ts`                     | App-level cross-cutting concern                 |
| `shared/utilities/rate-limiter.service.spec.ts`    | `core/services/rate-limiter.service.spec.ts`                | Co-locate test                                  |
| `shared/directives/auto-focus.directive.ts`        | `ui/directives/auto-focus.directive.ts`                     | Pure UI concern                                 |

### Step 1: Move `PlatformService` to Infrastructure

```bash
# Move files
mv apps/pos/src/app/shared/utilities/platform.service.ts \
   apps/pos/src/app/infrastructure/services/platform.service.ts

mv apps/pos/src/app/shared/utilities/platform.service.spec.ts \
   apps/pos/src/app/infrastructure/services/platform.service.spec.ts
```

Update all imports in `apps/pos/`:

```typescript
// Before:
import { PlatformService } from '../../shared/utilities/platform.service';
import { PlatformService } from '../shared/utilities/platform.service';

// After:
import { PlatformService } from '../../infrastructure/services/platform.service';
import { PlatformService } from '../infrastructure/services/platform.service';
```

### Step 2: Move `InputSanitizerService` to `libs/shared/utils`

```bash
mv apps/pos/src/app/shared/utilities/input-sanitizer.service.ts \
   libs/shared/utils/src/lib/input-sanitizer.service.ts

mv apps/pos/src/app/shared/utilities/input-sanitizer.service.spec.ts \
   libs/shared/utils/src/lib/input-sanitizer.service.spec.ts
```

> **Note**: If `InputSanitizerService` uses Angular's `@Injectable` decorator, it will need to be refactored into a plain function/class for the lib. If it's framework-agnostic already, it can move as-is.

Update exports in `libs/shared/utils/src/index.ts`:

```typescript
export * from './lib/input-sanitizer.service';
```

Update imports in `apps/pos/`:

```typescript
// Before:
import { InputSanitizerService } from '../../shared/utilities/input-sanitizer.service';

// After:
import { InputSanitizerService } from '@simple-pos/shared/utils';
```

### Step 3: Move `RateLimiterService` to Core

```bash
mv apps/pos/src/app/shared/utilities/rate-limiter.service.ts \
   apps/pos/src/app/core/services/rate-limiter.service.ts

mv apps/pos/src/app/shared/utilities/rate-limiter.service.spec.ts \
   apps/pos/src/app/core/services/rate-limiter.service.spec.ts
```

### Step 4: Move `AutoFocusDirective` to UI

```bash
mkdir -p apps/pos/src/app/ui/directives

mv apps/pos/src/app/shared/directives/auto-focus.directive.ts \
   apps/pos/src/app/ui/directives/auto-focus.directive.ts
```

### Step 5: Delete the Empty `shared/` Directory

```bash
rm -rf apps/pos/src/app/shared/
```

### Step 6: Validate

```bash
pnpm pos:build
pnpm pos:test
pnpm nx test shared-utils   # if InputSanitizer moved there
pnpm lint
```

## Acceptance Criteria

- [x] `apps/pos/src/app/shared/` directory no longer exists
- [x] `PlatformService` is in `infrastructure/services/`
- [x] `InputSanitizerService` is in `libs/shared/utils/` and re-exported
- [x] `RateLimiterService` is in `core/services/`
- [x] `AutoFocusDirective` is in `ui/directives/`
- [x] All imports updated — no broken references
- [x] All tests pass
- [x] No `shared/` naming confusion remains in `apps/pos`

## Related Tasks

- Task 003: Move `BaseRepository` to `libs/shared/types` (similar pattern)
