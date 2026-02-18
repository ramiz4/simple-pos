# Task: Add Environment Configuration Pattern for POS App

## Description

The Angular POS application (`apps/pos`) has no `environment.ts` / `environment.prod.ts` files or equivalent configuration mechanism. This means API URLs, feature flags, and environment-specific settings are likely hardcoded or missing entirely. As the app connects to both a local/cloud API and potentially different backends per environment (dev, staging, production), a proper configuration pattern is essential.

## Status

- **Identified**: February 13, 2026
- **Status**: Completed
- **Priority**: Low
- **Effort**: Low
- **Implemented**: February 13, 2026
- **Implementation Notes**: See `docs/environment-configuration-implementation.md`

## Recommended Agent

- **Agent**: `angular-engineer`

## Current State

### What Exists

- **API**: Has `.env.example` with `PORT`, `DATABASE_URL`, `JWT_SECRET`, `STRIPE_*` variables — properly configured
- **POS**: No environment files found. API URL is likely hardcoded in services like `api-config.service.ts` or `cloud-sync-client.service.ts`
- **Infrastructure HTTP services** in `apps/pos/src/app/infrastructure/http/`:
  - `api-config.service.ts` — likely manages base URL
  - `cloud-sync-client.service.ts` — makes HTTP calls to API
  - `cloud-auth-client.service.ts` — auth HTTP calls

### Missing Configuration Points

| Setting                   | Dev Value                   | Production Value                |
| ------------------------- | --------------------------- | ------------------------------- |
| API Base URL              | `http://localhost:3000/api` | `https://api.simplepos.com/api` |
| WebSocket URL             | `ws://localhost:3000`       | `wss://api.simplepos.com`       |
| Enable Debug Logging      | `true`                      | `false`                         |
| Sync Interval (ms)        | `5000`                      | `30000`                         |
| Feature Flags             | All enabled                 | Per-plan                        |
| Sentry/Error Tracking DSN | `null`                      | `https://...@sentry.io/...`     |

## Proposed Solution

### Option A: Angular `fileReplacements` (Traditional)

#### Step 1: Create Environment Files

```typescript
// apps/pos/src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
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

```typescript
// apps/pos/src/environments/environment.prod.ts
import { Environment } from './environment';

export const environment: Environment = {
  production: true,
  apiBaseUrl: 'https://api.simplepos.com/api',
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

#### Step 2: Configure File Replacement in `project.json`

```json
// apps/pos/project.json → build target
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "apps/pos/src/environments/environment.ts",
        "with": "apps/pos/src/environments/environment.prod.ts"
      }
    ],
    "budgets": [ ... ]
  }
}
```

#### Step 3: Use in Services

```typescript
// apps/pos/src/app/infrastructure/http/api-config.service.ts
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  readonly apiBaseUrl = environment.apiBaseUrl;
  readonly wsUrl = environment.wsUrl;
  readonly syncInterval = environment.syncIntervalMs;
}
```

### Option B: Vite `define` (Modern, Build-Time)

Since Angular 21 uses Vite under the hood via `@angular/build`:

#### Step 1: Define Environment Variables

```typescript
// apps/pos/src/environments/environment.ts
// Same as Option A — this is the source of truth for types

export const environment = {
  production: import.meta.env['PROD'] ?? false,
  apiBaseUrl: import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000/api',
  wsUrl: import.meta.env['VITE_WS_URL'] ?? 'ws://localhost:3000',
  enableDebugLogging: import.meta.env['VITE_DEBUG'] === 'true',
  syncIntervalMs: Number(import.meta.env['VITE_SYNC_INTERVAL'] ?? 5000),
};
```

#### Step 2: Set Variables per Environment

```bash
# .env.development (for POS dev)
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_DEBUG=true
VITE_SYNC_INTERVAL=5000

# .env.production
VITE_API_URL=https://api.simplepos.com/api
VITE_WS_URL=wss://api.simplepos.com
VITE_DEBUG=false
VITE_SYNC_INTERVAL=30000
```

> **Note**: Check if `@angular/build` supports `import.meta.env` — it may depend on the Vite adapter configuration. Option A is safer if unsure.

### Option C: Runtime Configuration via `APP_INITIALIZER` (Most Flexible)

For deployments where the same build serves multiple environments (Docker, SaaS):

```typescript
// apps/pos/src/app/core/services/app-config.service.ts
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config = signal<AppConfig | null>(null);

  readonly apiBaseUrl = computed(() => this.config()?.apiBaseUrl ?? 'http://localhost:3000/api');

  async loadConfig(): Promise<void> {
    try {
      const res = await fetch('/assets/config.json');
      this._config.set(await res.json());
    } catch {
      // Use defaults (offline mode)
    }
  }
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (config: AppConfigService) => () => config.loadConfig(),
      deps: [AppConfigService],
      multi: true,
    },
  ],
};
```

With a `public/assets/config.json` that can be swapped per deployment without rebuilding.

### Recommended Approach

**Use Option A (fileReplacements)** as the primary mechanism — it's the standard Angular pattern, works with the Angular CLI build pipeline, and provides compile-time type safety. Add **Option C** later if you need runtime configurability for SaaS multi-tenant deployment.

## Tauri Desktop Considerations

For the desktop app, the environment may also need:

- Local SQLite database path
- Auto-update server URL
- License/activation endpoints

These should be handled separately via Tauri's config (`tauri.conf.json`) or Rust-side configuration, not in the Angular environment files.

## Acceptance Criteria

- [x] Environment files created: `environment.ts` (dev) and `environment.prod.ts` (prod)
- [x] `fileReplacements` configured in `apps/pos/project.json` production build
- [x] `ApiConfigService` (or equivalent) reads from environment rather than hardcoding
- [x] Dev mode uses local API URL
- [x] Production build uses production API URL
- [x] `pnpm pos:build` produces a production build with correct URLs
- [x] `pnpm pos:dev` uses dev configuration

## Implementation Summary

All acceptance criteria have been met. See `docs/environment-configuration-implementation.md` for details.

### Files Created:
1. `apps/pos/src/environments/environment.ts` - Development configuration with local API URLs
2. `apps/pos/src/environments/environment.prod.ts` - Production configuration with cloud API URLs

### Files Modified:
1. `apps/pos/project.json` - Added fileReplacements configuration
2. `apps/pos/src/app/infrastructure/http/api-config.service.ts` - Updated to use environment configuration

### Key Features:
- Type-safe environment configuration with `Environment` type export
- Build-time file replacement for production builds
- Backward compatibility with localStorage override in `ApiConfigService`
- Follows Angular 21 best practices

## References

- [Angular Build Environments](https://angular.dev/tools/cli/environments)
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode)
