import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService } from './services/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    const logger = this.injector.get(LoggerService);
    const router = this.injector.get(Router);

    const message = error.message ? error.message : error.toString();
    const stack = error.stack ? error.stack : 'No stack trace';

    // Capture rich context
    const context = {
      stack,
      errorType: error.name || 'UnknownError',
      route: router.url,
      timestamp: new Date().toISOString(),
      // Add any additional context that might be helpful
      errorCode: this.categorizeError(error),
    };

    // Wrap in try/catch to prevent infinite error loops if logger fails
    try {
      logger.error(`Unhandled Exception: ${message}`, context);
    } catch {
      // If logging fails, just continue - console.error below will still show the error
    }

    // Allow the default console error to happen as well so developers see it
    console.error('GlobalErrorHandler caught:', error);
  }

  /**
   * Categorize errors for better tracking and filtering
   */
  private categorizeError(error: any): string {
    if (error.name === 'HttpErrorResponse') return 'HTTP_ERROR';
    if (error.message?.includes('Cannot find')) return 'NOT_FOUND_ERROR';
    if (error.message?.includes('Permission')) return 'PERMISSION_ERROR';
    if (error.message?.includes('Network')) return 'NETWORK_ERROR';
    if (error.message?.includes('Timeout')) return 'TIMEOUT_ERROR';
    return 'GENERAL_ERROR';
  }
}
