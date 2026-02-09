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
import { GlobalErrorHandler } from './core/error-handler.global';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
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
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
