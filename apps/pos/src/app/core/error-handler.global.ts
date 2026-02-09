import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService } from './services/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: unknown): void {
    const logger = this.injector.get(LoggerService);
    const router = this.injector.get(Router);

    const err = error instanceof Error ? error : new Error(String(error));
    const message = err.message;
    const stack = err.stack || 'No stack trace';

    // Capture rich context
    const context: Record<string, unknown> = {
      stack,
      errorType: err.name || 'UnknownError',
      route: router.url,
      timestamp: new Date().toISOString(),
      // Add any additional context that might be helpful
      errorCode: this.categorizeError(error),
    };

    // Wrap in try/catch to prevent infinite error loops if logger fails
    try {
      logger.error(`Unhandled Exception: ${message}`, context);
    } catch (loggingError) {
      // If logging fails, just continue - console.error below will still show the error
      console.error('LoggerService.error failed in GlobalErrorHandler:', loggingError);
    }

    // Allow the default console error to happen as well so developers see it
    console.error('GlobalErrorHandler caught:', error);
  }

  /**
   * Categorize errors for better tracking and filtering
   */
  private categorizeError(error: unknown): string {
    const err = error as Record<string, unknown>;
    if (err['name'] === 'HttpErrorResponse') return 'HTTP_ERROR';
    const message = typeof err['message'] === 'string' ? err['message'] : '';
    if (message.includes('Cannot find')) return 'NOT_FOUND_ERROR';
    if (message.includes('Permission')) return 'PERMISSION_ERROR';
    if (message.includes('Network')) return 'NETWORK_ERROR';
    if (message.includes('Timeout')) return 'TIMEOUT_ERROR';
    return 'GENERAL_ERROR';
  }
}
