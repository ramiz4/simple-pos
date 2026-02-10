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
import { syncAuthInterceptor } from './infrastructure/http/sync-auth.interceptor';

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
    {
      provide: APP_INITIALIZER,
      useFactory: (syncModeService: SyncModeService) => async () => {
        await syncModeService.start();
      },
      deps: [SyncModeService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (syncEngineService: SyncEngineService) => async () => {
        await syncEngineService.start();
      },
      deps: [SyncEngineService],
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
