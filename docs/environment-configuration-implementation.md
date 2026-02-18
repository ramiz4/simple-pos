# Environment Configuration Implementation

## Summary

This implementation adds environment configuration support to the Angular POS app following Angular 21 best practices and the requirements from `docs/tasks/011-add-environment-configuration.md`.

## Changes Made

### 1. Created Environment Files

#### `apps/pos/src/environments/environment.ts` (Development)
- Development configuration with local API URLs
- Used by default when running `pnpm pos:dev` or `pnpm nx serve pos`

#### `apps/pos/src/environments/environment.prod.ts` (Production)
- Production configuration with cloud API URLs
- Used when building with `pnpm pos:build` or `pnpm nx build pos --configuration=production`

### 2. Updated Configuration Files

#### `apps/pos/project.json`
- Added `fileReplacements` configuration in the production build configuration
- When building for production, `environment.ts` will be replaced with `environment.prod.ts`

#### `apps/pos/src/app/infrastructure/http/api-config.service.ts`
- Updated to import and use `environment.apiBaseUrl` as the default value
- Removed dynamic URL construction logic
- Simplified to use environment configuration while still allowing runtime override via localStorage

## Environment Configuration

#### `apps/pos/src/environments/environment.ts` (Development)

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'ws://localhost:3000',
  enableDebugLogging: true,
  syncIntervalMs: 5000,
  sentryDsn: null as string | null,
  features: {
    cloudSync: true,
    offlineMode: true,
    analytics: true,
  },
};

export type Environment = typeof environment;
```

#### `apps/pos/src/environments/environment.prod.ts` (Production)

```typescript
import { Environment } from './environment';

export const environment: Environment = {
  production: true,
  apiBaseUrl: 'https://api.simplepos.com/api/v1',
  wsUrl: 'wss://api.simplepos.com',
  enableDebugLogging: false,
  syncIntervalMs: 30000,
  sentryDsn: null, // Set via CI/CD
  features: {
    cloudSync: true,
    offlineMode: true,
    analytics: true,
  },
};
```

## How It Works

### Build-Time Configuration

The Angular build system uses `fileReplacements` to swap environment files based on the build configuration:

- **Development mode** (`pnpm pos:dev`): Uses `environment.ts` with local API URLs
- **Production mode** (`pnpm pos:build`): Replaces `environment.ts` with `environment.prod.ts` containing production URLs

### Runtime Override

The `ApiConfigService` maintains backward compatibility by:
1. First checking localStorage for a custom API URL (allows runtime override)
2. Falling back to the environment configuration if no override is set

### Type Safety

The `Environment` type is exported from `environment.ts` and imported in `environment.prod.ts` to ensure type safety across all environment configurations.

## Usage in Services

To use environment configuration in other services:

```typescript
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MyService {
  private readonly wsUrl = environment.wsUrl;
  private readonly syncInterval = environment.syncIntervalMs;
  
  constructor() {
    if (environment.enableDebugLogging) {
      console.log('Debug mode enabled');
    }
  }
}
```

## Testing

The environment files can be mocked in tests:

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock the environment
vi.mock('../../../environments/environment', () => ({
  environment: {
    production: false,
    apiBaseUrl: 'http://test-api:3000/api/v1',
    enableDebugLogging: true,
    // ... other config
  },
}));
```

## Build Commands

- **Development**: `pnpm pos:dev` - Uses `environment.ts`
- **Production**: `pnpm pos:build` - Uses `environment.prod.ts`
- **Test**: `pnpm pos:test` - Uses `environment.ts` (can be mocked)

## Future Enhancements

Consider implementing runtime configuration (Option C from the task document) if:
- The same build needs to serve multiple environments (e.g., Docker containers)
- Configuration needs to change without rebuilding
- SaaS multi-tenant deployment is required

This would involve:
1. Creating an `AppConfigService` with signal-based reactive configuration
2. Loading configuration from `/assets/config.json` via `APP_INITIALIZER`
3. Providing environment configuration as the fallback default

## Acceptance Criteria Status

- ✅ Environment files created: `environment.ts` (dev) and `environment.prod.ts` (prod)
- ✅ `fileReplacements` configured in `apps/pos/project.json` production build
- ✅ `ApiConfigService` reads from environment rather than hardcoding
- ✅ Dev mode uses local API URL (`http://localhost:3000/api/v1`)
- ✅ Production build uses production API URL (`https://api.simplepos.com/api/v1`)
- ✅ Type safety with `Environment` type export
- ✅ Backward compatibility with localStorage override

## Notes

- The `sentryDsn` field is set to `null` in both environments and should be configured via CI/CD for production deployments
- All feature flags are enabled by default; these can be adjusted per environment as needed
- The environment configuration follows Angular 21 best practices with proper TypeScript typing
