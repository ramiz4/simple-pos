import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { ScheduledBackupService } from './application/services/scheduled-backup.service';
import { SyncEngineService } from './application/services/sync-engine.service';
import { SyncModeService } from './application/services/sync-mode.service';
import { GlobalErrorHandler } from './core/error-handler.global';
import { LoggerService } from './core/services/logger.service';
import { syncAuthInterceptor } from './infrastructure/http/sync-auth.interceptor';

/**
 * Check if the app is running inside a Tauri WebView.
 * Service workers are not supported in Tauri's custom protocol and would
 * cause CSP violations or infinite stability waits.
 */
function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as Record<string, unknown>)['__TAURI__'] === 'object'
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([syncAuthInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // Initialize scheduled backup service on app startup
    {
      provide: APP_INITIALIZER,
      useFactory: (_scheduledBackupService: ScheduledBackupService) => () => {
        // Service is initialized via constructor
        return Promise.resolve();
      },
      deps: [ScheduledBackupService],
      multi: true,
    },
    // Start sync services non-blocking so they don't delay app bootstrap.
    // Both services have internal guards and catch errors gracefully.
    {
      provide: APP_INITIALIZER,
      useFactory: (syncModeService: SyncModeService, logger: LoggerService) => () => {
        // Fire-and-forget: don't block app startup on HTTP connectivity check
        syncModeService.start().catch((err) => {
          logger.error('Failed to start SyncModeService during APP_INITIALIZER', { error: err });
        });
        return Promise.resolve();
      },
      deps: [SyncModeService, LoggerService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (syncEngineService: SyncEngineService, logger: LoggerService) => () => {
        // Fire-and-forget: don't block app startup on initial sync
        syncEngineService.start().catch((err) => {
          logger.error('Failed to start SyncEngineService during APP_INITIALIZER', { error: err });
        });
        return Promise.resolve();
      },
      deps: [SyncEngineService, LoggerService],
      multi: true,
    },
    // Disable service worker inside Tauri — Tauri's custom protocol
    // (tauri://localhost) does not support service worker registration.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !isTauriEnvironment(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
