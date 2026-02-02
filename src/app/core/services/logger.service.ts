import { Injectable } from '@angular/core';
import { attachConsole, error, info, warn } from '@tauri-apps/plugin-log';
import { PlatformService } from '../../shared/utilities/platform.service';

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  stack?: string;
  userAgent?: string;
  url?: string;
  count?: number; // For deduplication
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly MAX_LOGS = 1000; // Maximum number of logs to keep
  private readonly STORAGE_KEY = 'simple-pos-error-logs';
  private readonly DEDUP_WINDOW_MS = 5000; // 5 seconds deduplication window
  private recentErrors = new Map<string, { timestamp: number; count: number }>();

  constructor(private platformService: PlatformService) {
    if (this.platformService.isTauri()) {
      // Detach implies stopping strict forwarding, but attachConsole helps seeing logs in devtools too
      attachConsole().catch((err) => console.error('Failed to attach console logger', err));
    }
    this.cleanupOldDedupEntries();
  }

  async info(message: string, context?: Record<string, any>) {
    await this.log('info', message, context);

    if (this.platformService.isTauri()) {
      await info(this.format(message, context));
    } else {
      console.log(`[INFO] ${message}`, context);
    }
  }

  async warn(message: string, context?: Record<string, any>) {
    await this.log('warn', message, context);

    if (this.platformService.isTauri()) {
      await warn(this.format(message, context));
    } else {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  async error(message: string, context?: Record<string, any>) {
    await this.log('error', message, context);

    if (this.platformService.isTauri()) {
      await error(this.format(message, context));
    } else {
      console.error(`[ERROR] ${message}`, context);
    }
  }

  /**
   * Get all stored error logs
   */
  getErrorLogs(): ErrorLogEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as ErrorLogEntry[];
    } catch (err) {
      console.error('Failed to retrieve error logs:', err);
      return [];
    }
  }

  /**
   * Clear all error logs
   */
  clearErrorLogs(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear error logs:', err);
    }
  }

  /**
   * Export error logs as JSON
   */
  exportErrorLogs(): string {
    const logs = this.getErrorLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { total: number; byLevel: Record<string, number>; last24Hours: number } {
    const logs = this.getErrorLogs();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const stats = {
      total: logs.length,
      byLevel: { info: 0, warn: 0, error: 0 },
      last24Hours: 0,
    };

    logs.forEach((log) => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      if (new Date(log.timestamp).getTime() > oneDayAgo) {
        stats.last24Hours++;
      }
    });

    return stats;
  }

  private async log(
    level: 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, any>,
  ) {
    try {
      // Create error signature for deduplication
      const signature = this.createSignature(level, message);

      // Check for duplicate
      const recent = this.recentErrors.get(signature);
      const now = Date.now();

      if (recent && now - recent.timestamp < this.DEDUP_WINDOW_MS) {
        // Update count instead of creating new entry
        recent.count++;
        this.updateLogCount(signature, recent.count);
        return;
      }

      // Create new log entry
      const entry: ErrorLogEntry = {
        id: signature,
        timestamp: new Date().toISOString(),
        level,
        message,
        context: this.sanitizeContext(context),
        stack: context?.['stack'],
        userAgent: navigator.userAgent,
        url: window.location.href,
        count: 1,
      };

      // Store in deduplication map
      this.recentErrors.set(signature, { timestamp: now, count: 1 });

      // Persist to storage
      this.persistLog(entry);
    } catch (err) {
      // Fail silently to avoid infinite loops
      console.error('Failed to log error:', err);
    }
  }

  private persistLog(entry: ErrorLogEntry): void {
    try {
      const logs = this.getErrorLogs();
      logs.unshift(entry); // Add to beginning

      // Trim to max size
      if (logs.length > this.MAX_LOGS) {
        logs.splice(this.MAX_LOGS);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to persist log:', err);
    }
  }

  private updateLogCount(signature: string, count: number): void {
    try {
      const logs = this.getErrorLogs();
      const log = logs.find((l) => l.id === signature);
      if (log) {
        log.count = count;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
      }
    } catch (err) {
      console.error('Failed to update log count:', err);
    }
  }

  private createSignature(level: string, message: string): string {
    // Create a simple hash for deduplication
    const str = `${level}:${message}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${level}-${hash}`;
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    // Remove sensitive data and circular references
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(context)) {
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        try {
          sanitized[key] = JSON.parse(JSON.stringify(value)); // Deep clone and remove circular refs
        } catch {
          sanitized[key] = '[Circular or Non-Serializable]';
        }
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private cleanupOldDedupEntries(): void {
    // Periodically clean up old deduplication entries
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.recentErrors.entries()) {
        if (now - value.timestamp > this.DEDUP_WINDOW_MS * 2) {
          this.recentErrors.delete(key);
        }
      }
    }, 60000); // Run every minute
  }

  private format(message: string, context?: Record<string, any>): string {
    if (!context) return message;
    return `${message} ${JSON.stringify(context)}`;
  }
}
