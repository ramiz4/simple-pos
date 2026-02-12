import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggerService } from '../../core/services/logger.service';
import { PlatformService } from '../../shared/utilities/platform.service';
import { BackupData, BackupService } from './backup.service';
import { ScheduledBackupConfig, ScheduledBackupService } from './scheduled-backup.service';

describe('ScheduledBackupService', () => {
  let service: ScheduledBackupService;
  let backupService: BackupService;
  let loggerService: LoggerService;

  beforeEach(() => {
    // Clear localStorage and timers before each test
    localStorage.clear();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Mock dependencies
    const mockBackupService = {
      createBackup: vi.fn().mockResolvedValue({
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        encrypted: false,
        data: {
          codeTables: [{ id: 1, codeType: 'test', code: 'test', sortOrder: 1, isActive: true }],
          codeTranslations: [],
          users: [],
          tables: [],
          categories: [],
          products: [],
          variants: [],
          extras: [],
          ingredients: [],
          productExtras: [],
          productIngredients: [],
          orders: [],
          orderItems: [],
          orderItemExtras: [],
        },
      } as BackupData),
    };

    const mockLoggerService = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ScheduledBackupService,
        { provide: BackupService, useValue: mockBackupService },
        {
          provide: PlatformService,
          useValue: { isTauri: () => false },
        },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(ScheduledBackupService);
    backupService = TestBed.inject(BackupService);
    loggerService = TestBed.inject(LoggerService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Configuration Management', () => {
    it('should load default configuration', () => {
      const config = service.config();
      expect(config.enabled).toBe(false);
      expect(config.frequency).toBe('daily');
      expect(config.retentionCount).toBe(7);
      expect(config.encryptBackups).toBe(false);
    });

    it('should update and persist configuration', () => {
      const newConfig: ScheduledBackupConfig = {
        enabled: true,
        frequency: 'weekly',
        retentionCount: 14,
        encryptBackups: true,
        password: 'test-password',
      };

      service.updateConfig(newConfig);

      expect(service.config()).toEqual(newConfig);

      // Verify persistence
      const stored = localStorage.getItem('simple-pos-backup-config');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored ?? '{}')).toEqual(newConfig);
    });

    it('should load persisted configuration on initialization', () => {
      const config: ScheduledBackupConfig = {
        enabled: true,
        frequency: 'custom',
        customIntervalHours: 6,
        retentionCount: 10,
        encryptBackups: false,
      };

      localStorage.setItem('simple-pos-backup-config', JSON.stringify(config));

      // Create new service instance
      const newService = new ScheduledBackupService(
        backupService,
        TestBed.inject(PlatformService),
        loggerService,
      );

      expect(newService.config()).toEqual(config);
    });
  });

  describe('Backup Creation', () => {
    it('should trigger manual backup', async () => {
      await service.triggerBackup();

      expect(backupService.createBackup).toHaveBeenCalled();
      expect(service.backupHistory().length).toBe(1);
    });

    it('should store backup metadata', async () => {
      await service.triggerBackup();

      const history = service.backupHistory();
      expect(history.length).toBe(1);

      const backup = history[0];
      expect(backup.id).toBeDefined();
      expect(backup.filename).toContain('simple-pos-backup');
      expect(backup.createdAt).toBeDefined();
      expect(backup.size).toBeGreaterThan(0);
      expect(backup.itemCount).toBeGreaterThan(0);
      expect(backup.status).toBe('success');
    });

    it('should handle backup creation errors', async () => {
      const error = new Error('Backup failed');
      vi.mocked(backupService.createBackup).mockRejectedValueOnce(error);

      await service.triggerBackup();

      const history = service.backupHistory();
      expect(history.length).toBe(1);
      expect(history[0].status).toBe('failed');
      expect(history[0].error).toBe('Backup failed');
    });

    it('should calculate backup size correctly', async () => {
      await service.triggerBackup();

      const backup = service.backupHistory()[0];
      expect(backup.size).toBeGreaterThan(0);
    });

    it('should count backup items correctly', async () => {
      await service.triggerBackup();

      const backup = service.backupHistory()[0];
      expect(backup.itemCount).toBe(1); // One codeTable in mock
    });
  });

  describe('Backup Retrieval and Deletion', () => {
    it('should retrieve backup by ID', async () => {
      await service.triggerBackup();

      const history = service.backupHistory();
      const backupId = history[0].id;

      const backup = service.getBackup(backupId);
      expect(backup).toBeTruthy();
      expect(backup?.version).toBe('1.0.0');
    });

    it('should return null for non-existent backup', () => {
      const backup = service.getBackup('non-existent-id');
      expect(backup).toBeNull();
    });

    it('should delete backup by ID', async () => {
      await service.triggerBackup();

      const backupId = service.backupHistory()[0].id;
      service.deleteBackup(backupId);

      expect(service.backupHistory().length).toBe(0);
      expect(service.getBackup(backupId)).toBeNull();
    });

    it('should clear all backups', async () => {
      await service.triggerBackup();
      await service.triggerBackup();
      await service.triggerBackup();

      expect(service.backupHistory().length).toBe(3);

      service.clearAllBackups();

      expect(service.backupHistory().length).toBe(0);
    });
  });

  describe('Retention Policy', () => {
    it('should apply retention policy when limit exceeded', async () => {
      service.updateConfig({
        enabled: false,
        frequency: 'daily',
        retentionCount: 3,
        encryptBackups: false,
      });

      // Create 5 backups
      for (let i = 0; i < 5; i++) {
        await service.triggerBackup();
        // Advance time to ensure different timestamps
        vi.advanceTimersByTime(1000);
      }

      // Should only keep 3 most recent
      expect(service.backupHistory().length).toBe(3);
    });

    it('should delete oldest backups first', async () => {
      service.updateConfig({
        enabled: false,
        frequency: 'daily',
        retentionCount: 2,
        encryptBackups: false,
      });

      await service.triggerBackup();
      vi.advanceTimersByTime(1000);
      await service.triggerBackup();
      vi.advanceTimersByTime(1000);
      await service.triggerBackup();

      const history = service.backupHistory();
      expect(history.length).toBe(2);

      // Most recent should be first
      const timestamps = history.map((b) => new Date(b.createdAt).getTime());
      expect(timestamps[0]).toBeGreaterThan(timestamps[1]);
    });
  });

  describe('Storage Management', () => {
    it('should calculate total storage used', async () => {
      await service.triggerBackup();
      await service.triggerBackup();

      const totalStorage = service.getTotalStorageUsed();
      expect(totalStorage).toBeGreaterThan(0);
    });

    it('should return zero storage for no backups', () => {
      const totalStorage = service.getTotalStorageUsed();
      expect(totalStorage).toBe(0);
    });
  });

  describe('Health Monitoring', () => {
    it('should report critical status when no backups exist', () => {
      const health = service.getBackupHealth();
      expect(health.status).toBe('critical');
      expect(health.message).toBe('No backups found');
    });

    it('should report critical status when last backup failed', async () => {
      vi.mocked(backupService.createBackup).mockRejectedValueOnce(new Error('Failed'));
      await service.triggerBackup();

      const health = service.getBackupHealth();
      expect(health.status).toBe('critical');
      expect(health.message).toBe('Last backup failed');
    });

    it('should report warning status when backup is old', async () => {
      await service.triggerBackup();

      // Advance time by 50 hours
      vi.advanceTimersByTime(50 * 60 * 60 * 1000);

      const health = service.getBackupHealth();
      expect(health.status).toBe('warning');
      expect(health.message).toContain('48 hours old');
    });

    it('should report healthy status for recent successful backup', async () => {
      await service.triggerBackup();

      const health = service.getBackupHealth();
      expect(health.status).toBe('healthy');
      expect(health.message).toBe('Backups are up to date');
    });

    it('should include last backup age in health status', async () => {
      await service.triggerBackup();

      const health = service.getBackupHealth();
      expect(health.lastBackupAge).toBeDefined();
      expect(health.lastBackupAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Scheduled Backups', () => {
    it('should not start scheduler when disabled', () => {
      service.updateConfig({
        enabled: false,
        frequency: 'daily',
        retentionCount: 7,
        encryptBackups: false,
      });

      expect(service.nextBackupTime()).toBeNull();
    });

    it('should start scheduler when enabled', () => {
      service.updateConfig({
        enabled: true,
        frequency: 'daily',
        retentionCount: 7,
        encryptBackups: false,
      });

      expect(service.nextBackupTime()).toBeTruthy();
    });

    it('should schedule daily backups correctly', () => {
      service.updateConfig({
        enabled: true,
        frequency: 'daily',
        retentionCount: 7,
        encryptBackups: false,
      });

      const nextBackup = new Date(service.nextBackupTime() ?? 0);
      const now = new Date();
      const diffHours = (nextBackup.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(diffHours).toBeCloseTo(24, 0);
    });

    it('should schedule weekly backups correctly', () => {
      service.updateConfig({
        enabled: true,
        frequency: 'weekly',
        retentionCount: 7,
        encryptBackups: false,
      });

      const nextBackup = new Date(service.nextBackupTime() ?? 0);
      const now = new Date();
      const diffHours = (nextBackup.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(diffHours).toBeCloseTo(24 * 7, 0);
    });

    it('should schedule custom interval backups correctly', () => {
      service.updateConfig({
        enabled: true,
        frequency: 'custom',
        customIntervalHours: 6,
        retentionCount: 7,
        encryptBackups: false,
      });

      const nextBackup = new Date(service.nextBackupTime() ?? 0);
      const now = new Date();
      const diffHours = (nextBackup.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(diffHours).toBeCloseTo(6, 0);
    });

    it('should stop scheduler when disabled', () => {
      service.updateConfig({
        enabled: true,
        frequency: 'daily',
        retentionCount: 7,
        encryptBackups: false,
      });

      expect(service.nextBackupTime()).toBeTruthy();

      service.updateConfig({
        enabled: false,
        frequency: 'daily',
        retentionCount: 7,
        encryptBackups: false,
      });

      expect(service.nextBackupTime()).toBeNull();
    });
  });

  describe('Encryption Support', () => {
    it('should mark backup as encrypted when encryption is enabled', async () => {
      service.updateConfig({
        enabled: false,
        frequency: 'daily',
        retentionCount: 7,
        encryptBackups: true,
        password: 'test-password',
      });

      await service.triggerBackup();

      const backup = service.backupHistory()[0];
      expect(backup.encrypted).toBe(true);
    });

    it('should pass encryption options to backup service', async () => {
      service.updateConfig({
        enabled: false,
        frequency: 'daily',
        retentionCount: 7,
        encryptBackups: true,
        password: 'secure-password',
      });

      await service.triggerBackup();

      expect(backupService.createBackup).toHaveBeenCalledWith({
        encrypt: true,
        password: 'secure-password',
      });
    });
  });

  describe('Persistence', () => {
    it('should persist backup history to localStorage', async () => {
      await service.triggerBackup();

      const stored = localStorage.getItem('simple-pos-backups-metadata');
      expect(stored).toBeTruthy();

      const history = JSON.parse(stored ?? '[]');
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(1);
    });

    it('should load backup history from localStorage', async () => {
      await service.triggerBackup();

      // Create new service instance
      const newService = new ScheduledBackupService(
        backupService,
        TestBed.inject(PlatformService),
        loggerService,
      );

      expect(newService.backupHistory().length).toBe(1);
    });
  });

  describe('Logging', () => {
    it('should log when backup starts', async () => {
      await service.triggerBackup();

      expect(loggerService.info).toHaveBeenCalledWith('Starting scheduled backup');
    });

    it('should log when backup completes successfully', async () => {
      await service.triggerBackup();

      expect(loggerService.info).toHaveBeenCalledWith(
        'Scheduled backup completed successfully',
        expect.any(Object),
      );
    });

    it('should log when backup fails', async () => {
      vi.mocked(backupService.createBackup).mockRejectedValueOnce(new Error('Test error'));
      await service.triggerBackup();

      expect(loggerService.error).toHaveBeenCalledWith(
        'Scheduled backup failed',
        expect.any(Object),
      );
    });

    it('should log retention policy application', async () => {
      service.updateConfig({
        enabled: false,
        frequency: 'daily',
        retentionCount: 1,
        encryptBackups: false,
      });

      await service.triggerBackup();
      await service.triggerBackup();

      expect(loggerService.info).toHaveBeenCalledWith(
        'Applied backup retention policy',
        expect.objectContaining({
          deleted: 1,
          retained: 1,
        }),
      );
    });
  });
});
