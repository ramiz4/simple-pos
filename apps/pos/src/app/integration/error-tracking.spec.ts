import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { GlobalErrorHandler } from '../core/error-handler.global';
import { LoggerService } from '../core/services/logger.service';
import { PlatformService } from '../shared/utilities/platform.service';

describe('Error Tracking Integration', () => {
  let errorHandler: GlobalErrorHandler;
  let loggerService: LoggerService;
  let _router: Router;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        LoggerService,
        {
          provide: PlatformService,
          useValue: {
            isTauri: () => false,
          },
        },
        {
          provide: Router,
          useValue: {
            url: '/test-route',
          },
        },
      ],
    });

    errorHandler = TestBed.inject(GlobalErrorHandler);
    loggerService = TestBed.inject(LoggerService);
    _router = TestBed.inject(Router);
  });

  describe('End-to-End Error Tracking', () => {
    it('should capture and persist errors through the global error handler', async () => {
      // Create a test error
      const testError = new Error('Test error for tracking');
      testError.name = 'TestError';

      // Trigger error through global error handler
      errorHandler.handleError(testError);

      // Wait for async logging to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify error was logged
      const logs = loggerService.getErrorLogs();
      expect(logs.length).toBe(1);

      const errorLog = logs[0];
      expect(errorLog.level).toBe('error');
      expect(errorLog.message).toContain('Test error for tracking');
      expect(errorLog.context).toBeDefined();
    });

    it('should capture error context including route and error type', async () => {
      const testError = new Error('Context test error');
      testError.name = 'ContextTestError';

      errorHandler.handleError(testError);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggerService.getErrorLogs();
      const errorLog = logs[0];

      // Verify context was captured
      expect(errorLog.context?.['route']).toBe('/test-route');
      expect(errorLog.context?.['errorType']).toBe('ContextTestError');
      expect(errorLog.context?.['timestamp']).toBeDefined();
      expect(errorLog.context?.['errorCode']).toBeDefined();
    });

    it('should categorize different error types correctly', async () => {
      // Test HTTP error
      const httpError = new Error('HTTP request failed');
      httpError.name = 'HttpErrorResponse';
      errorHandler.handleError(httpError);

      // Test Network error
      const networkError = new Error('Network connection lost');
      errorHandler.handleError(networkError);

      // Test Permission error
      const permissionError = new Error('Permission denied');
      errorHandler.handleError(permissionError);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggerService.getErrorLogs();
      expect(logs.length).toBe(3);

      // Verify categorization
      expect(logs[0].context?.['errorCode']).toBe('PERMISSION_ERROR');
      expect(logs[1].context?.['errorCode']).toBe('NETWORK_ERROR');
      expect(logs[2].context?.['errorCode']).toBe('HTTP_ERROR');
    });

    it('should persist errors across service instances', async () => {
      // Log an error
      const error = new Error('Persistence test');
      errorHandler.handleError(error);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create a new logger service instance
      const newLoggerService = new LoggerService(TestBed.inject(PlatformService));

      // Verify error is still available
      const logs = newLoggerService.getErrorLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('Persistence test');
    });

    it('should capture stack traces', async () => {
      const error = new Error('Stack trace test');
      errorHandler.handleError(error);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggerService.getErrorLogs();
      expect(logs[0].context?.['stack']).toBeDefined();
      expect(logs[0].context?.['stack']).toContain('Error: Stack trace test');
    });

    it('should capture browser context (user agent, URL)', async () => {
      const error = new Error('Browser context test');
      errorHandler.handleError(error);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggerService.getErrorLogs();
      expect(logs[0].userAgent).toBeDefined();
      expect(logs[0].url).toBeDefined();
      expect(typeof logs[0].userAgent).toBe('string');
      expect(typeof logs[0].url).toBe('string');
    });

    it('should provide error statistics', async () => {
      // Create multiple errors of different levels
      await loggerService.error('Error 1');
      await loggerService.error('Error 2');
      await loggerService.warn('Warning 1');
      await loggerService.info('Info 1');

      const stats = loggerService.getErrorStats();

      expect(stats.total).toBe(4);
      expect(stats.byLevel['error']).toBe(2);
      expect(stats.byLevel['warn']).toBe(1);
      expect(stats.byLevel['info']).toBe(1);
      expect(stats.last24Hours).toBe(4);
    });

    it('should allow clearing all error logs', async () => {
      // Create some errors
      await loggerService.error('Error 1');
      await loggerService.error('Error 2');
      await loggerService.warn('Warning 1');

      expect(loggerService.getErrorLogs().length).toBe(3);

      // Clear logs
      loggerService.clearErrorLogs();

      expect(loggerService.getErrorLogs().length).toBe(0);
    });

    it('should export error logs as JSON', async () => {
      await loggerService.error('Export test error');
      await loggerService.warn('Export test warning');

      const exported = loggerService.exportErrorLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0].level).toBe('warn');
      expect(parsed[1].level).toBe('error');
    });

    it('should handle multiple errors in quick succession', async () => {
      // Trigger multiple errors rapidly
      for (let i = 0; i < 10; i++) {
        const error = new Error(`Rapid error ${i}`);
        errorHandler.handleError(error);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      const logs = loggerService.getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.length).toBeLessThanOrEqual(10);
    });

    it('should sanitize sensitive data in error context', async () => {
      const _error = new Error('Sensitive data test');

      // Manually log with sensitive context
      await loggerService.error('Sensitive error', {
        password: 'secret123',
        token: 'bearer-token-xyz',
        userId: 'user-123',
      });

      const logs = loggerService.getErrorLogs();
      expect(logs[0].context?.['password']).toBe('[REDACTED]');
      expect(logs[0].context?.['token']).toBe('[REDACTED]');
      expect(logs[0].context?.['userId']).toBe('user-123');
    });
  });

  describe('Error Handler Categorization', () => {
    it('should categorize HTTP errors', async () => {
      const error = new Error('Request failed');
      error.name = 'HttpErrorResponse';
      errorHandler.handleError(error);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggerService.getErrorLogs();
      expect(logs[0].context?.['errorCode']).toBe('HTTP_ERROR');
    });

    it('should categorize not found errors', async () => {
      const error = new Error('Cannot find module');
      errorHandler.handleError(error);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggerService.getErrorLogs();
      expect(logs[0].context?.['errorCode']).toBe('NOT_FOUND_ERROR');
    });

    it('should categorize timeout errors', async () => {
      const error = new Error('Request Timeout exceeded');
      errorHandler.handleError(error);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggerService.getErrorLogs();
      expect(logs[0].context?.['errorCode']).toBe('TIMEOUT_ERROR');
    });

    it('should default to general error for unknown types', async () => {
      const error = new Error('Unknown error type');
      errorHandler.handleError(error);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const logs = loggerService.getErrorLogs();
      expect(logs[0].context?.['errorCode']).toBe('GENERAL_ERROR');
    });
  });
});
