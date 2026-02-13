import { Injectable, signal } from '@angular/core';
import { APP_VERSION } from '@simple-pos/shared/utils';
import { getVersion } from '@tauri-apps/api/app';
import { PlatformService } from '../../infrastructure/services/platform.service';

@Injectable({
  providedIn: 'root',
})
export class AppInfoService {
  private _version = signal<string>(APP_VERSION);
  version = this._version.asReadonly();

  constructor(private platformService: PlatformService) {
    this.init();
  }

  private async init() {
    if (this.platformService.isTauri()) {
      try {
        const tauriVersion = await getVersion();
        this._version.set(tauriVersion);
      } catch (err) {
        console.error('Failed to get Tauri version:', err);
      }
    }
  }
}
