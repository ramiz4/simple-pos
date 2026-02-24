import { Injectable, OnDestroy, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { PlatformService } from '../../infrastructure/services/platform.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateService implements OnDestroy {
  updateAvailable = signal<boolean>(false);
  updateStatus = signal<string | null>(null);

  private visibilityChangeHandler?: () => void;

  constructor(
    private swUpdate: SwUpdate,
    private platformService: PlatformService,
  ) {
    this.checkForUpdates();

    if (this.swUpdate.isEnabled) {
      setInterval(() => this.swUpdate.checkForUpdate(), 6 * 60 * 60 * 1000); // Every 6 hours

      // Check for updates when the app returns to the foreground.
      // This is critical for iOS Chrome homescreen apps where background
      // timers are heavily throttled and the periodic interval may not fire.
      this.visibilityChangeHandler = () => {
        if (document.visibilityState === 'visible') {
          this.swUpdate.checkForUpdate().catch((err) => {
            console.error('[PWA] Failed to check for update on visibility change:', err);
          });
        }
      };
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  async checkForUpdates() {
    if (this.platformService.isTauri()) {
      this.checkDesktopUpdate();
    } else if (this.swUpdate.isEnabled) {
      this.checkPWAUpdate();
    }
  }

  private async checkDesktopUpdate() {
    try {
      const update = await check();
      if (update) {
        console.log(`[Update] Found update ${update.version} from ${update.date}`);
        this.updateAvailable.set(true);
        this.updateStatus.set(`New version ${update.version} available`);
      }
    } catch (error) {
      console.error('[Update] Failed to check for desktop updates:', error);
    }
  }

  private checkPWAUpdate() {
    this.swUpdate.versionUpdates.subscribe((evt) => {
      switch (evt.type) {
        case 'VERSION_DETECTED':
          console.log(`[PWA] Downloading new app version: ${evt.version.hash}`);
          break;
        case 'VERSION_READY':
          console.log(`[PWA] Current app version: ${evt.currentVersion.hash}`);
          console.log(`[PWA] New app version ready for use: ${evt.latestVersion.hash}`);
          this.updateAvailable.set(true);
          this.updateStatus.set('New version available');
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.log(`[PWA] Failed to install app version '${evt.version.hash}': ${evt.error}`);
          break;
      }
    });
  }

  async applyUpdate() {
    if (this.platformService.isTauri()) {
      await this.installDesktopUpdate();
    } else if (this.swUpdate.isEnabled) {
      await this.swUpdate.activateUpdate();
      window.location.reload();
    }
  }

  private async installDesktopUpdate() {
    try {
      const update = await check();
      if (update) {
        this.updateStatus.set('Downloading update...');
        let downloaded = 0;
        let contentLength = 0;

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength || 0;
              console.log(`[Update] started downloading ${contentLength} bytes`);
              break;
            case 'Progress':
              downloaded += event.data.chunkLength;
              console.log(`[Update] downloaded ${downloaded} from ${contentLength}`);
              break;
            case 'Finished':
              console.log('[Update] download finished');
              break;
          }
        });

        this.updateStatus.set('Restarting...');
        await relaunch();
      }
    } catch (error) {
      console.error('[Update] Failed to install desktop update:', error);
      this.updateStatus.set('Update failed');
    }
  }
}
