import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlatformService } from '../../shared/utilities/platform.service';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let platformService: PlatformService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        LoggerService,
        {
          provide: PlatformService,
          useValue: {
            isTauri: () => false,
          },
        },
      ],
    });

    service = TestBed.inject(LoggerService);
    platformService = TestBed.inject(PlatformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Error Logging', () => {
    it('should log error with context', async () => {
      const message = 'Test error';
      const context = { userId: '123', action: 'test' };

      await service.error(message, context);

      const logs = service.getErrorLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe(message);
      expect(logs[0].level).toBe('error');
      expect(logs[0].context).toBeDefined();
    });

    it('should sanitize sensitive data in context', async () => {
      const message = 'Test error';
      const context = { password: 'secret123', token: 'abc123', userId: '123' };

      await service.error(message, context);

      const logs = service.getErrorLogs();
      expect(logs[0].context?.['password']).toBe('[REDACTED]');
      expect(logs[0].context?.['token']).toBe('[REDACTED]');
      expect(logs[0].context?.['userId']).toBe('123');
    });

    it('should deduplicate errors within time window', async () => {
      const message = 'Duplicate error';

      await service.error(message);
      await service.error(message);
      await service.error(message);

      const logs = service.getErrorLogs();
      // Should only have one entry due to deduplication
      expect(logs.length).toBe(1);
      expect(logs[0].count).toBeGreaterThan(1);
    });
  });

  describe('Log Management', () => {
    it('should retrieve all error logs', async () => {
      await service.error('Error 1');
      await service.warn('Warning 1');
      await service.info('Info 1');

      const logs = service.getErrorLogs();
      expect(logs.length).toBe(3);
    });

    it('should clear all error logs', async () => {
      await service.error('Error 1');
      await service.error('Error 2');

      expect(service.getErrorLogs().length).toBe(2);

      service.clearErrorLogs();

      expect(service.getErrorLogs().length).toBe(0);
    });

    it('should export error logs as JSON', async () => {
      await service.error('Error 1');
      await service.warn('Warning 1');

      const exported = service.exportErrorLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    it('should limit logs to MAX_LOGS', async () => {
      // Create more than MAX_LOGS entries
      const maxLogs = 1000;
      for (let i = 0; i < maxLogs + 100; i++) {
        await service.error(`Error ${i}`);
      }

      const logs = service.getErrorLogs();
      expect(logs.length).toBeLessThanOrEqual(maxLogs);
    });
  });

  describe('Error Statistics', () => {
    it('should calculate error statistics correctly', async () => {
      await service.error('Error 1');
      await service.error('Error 2');
      await service.warn('Warning 1');
      await service.info('Info 1');

      const stats = service.getErrorStats();

      expect(stats.total).toBe(4);
      expect(stats.byLevel['error']).toBe(2);
      expect(stats.byLevel['warn']).toBe(1);
      expect(stats.byLevel['info']).toBe(1);
    });

    it('should count last 24 hours correctly', async () => {
      await service.error('Recent error');

      const stats = service.getErrorStats();
      expect(stats.last24Hours).toBe(1);
    });
  });

  describe('Context Capture', () => {
    it('should capture user agent', async () => {
      await service.error('Test error');

      const logs = service.getErrorLogs();
      expect(logs[0].userAgent).toBeDefined();
      expect(typeof logs[0].userAgent).toBe('string');
    });

    it('should capture current URL', async () => {
      await service.error('Test error');

      const logs = service.getErrorLogs();
      expect(logs[0].url).toBeDefined();
      expect(typeof logs[0].url).toBe('string');
    });

    it('should capture timestamp', async () => {
      await service.error('Test error');

      const logs = service.getErrorLogs();
      expect(logs[0].timestamp).toBeDefined();
      expect(new Date(logs[0].timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});
