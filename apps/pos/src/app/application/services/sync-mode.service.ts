import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { CloudSyncClientService } from '../../infrastructure/http/cloud-sync-client.service';
import { AuthService } from './auth.service';

export type SyncRuntimeMode = 'local' | 'cloud' | 'hybrid';

@Injectable({
  providedIn: 'root',
})
export class SyncModeService implements OnDestroy {
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : false);
  readonly backendReachable = signal(false);
  readonly mode = signal<SyncRuntimeMode>('local');
  readonly lastCheckedAt = signal<string | null>(null);
  readonly hasCloudSession = computed(() => this.authService.hasCloudSession());

  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private started = false;

  constructor(
    private readonly cloudSyncClient: CloudSyncClientService,
    private readonly authService: AuthService,
  ) {}

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }

    await this.refreshConnectivity();

    this.intervalHandle = setInterval(() => {
      void this.refreshConnectivity();
    }, 30_000);
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async refreshConnectivity(): Promise<void> {
    this.isOnline.set(typeof navigator !== 'undefined' ? navigator.onLine : false);

    if (!this.isOnline()) {
      this.backendReachable.set(false);
      this.mode.set('local');
      this.lastCheckedAt.set(new Date().toISOString());
      return;
    }

    try {
      await this.cloudSyncClient.status();
      this.backendReachable.set(true);

      if (this.authService.hasCloudSession()) {
        this.mode.set('hybrid');
      } else {
        this.mode.set('cloud');
      }
    } catch {
      this.backendReachable.set(false);
      this.mode.set('local');
    }

    this.lastCheckedAt.set(new Date().toISOString());
  }

  private handleOnline = () => {
    this.isOnline.set(true);
    void this.refreshConnectivity();
  };

  private handleOffline = () => {
    this.isOnline.set(false);
    this.backendReachable.set(false);
    this.mode.set('local');
    this.lastCheckedAt.set(new Date().toISOString());
  };
}
