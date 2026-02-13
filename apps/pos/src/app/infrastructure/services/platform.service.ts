import { Injectable } from '@angular/core';

/**
 * Service to detect the current platform (Tauri desktop or web/PWA)
 */
@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private readonly _isTauri: boolean;

  constructor() {
    // In Tauri v2, the presence of the documented global `__TAURI__` indicates
    // that the app is running in a Tauri context:
    // https://tauri.app/v2/reference/javascript/global-tauri/
    if (typeof window !== 'undefined' && window !== null) {
      const windowObj = window as unknown as Record<string, unknown>;
      this._isTauri = typeof windowObj['__TAURI__'] === 'object' && windowObj['__TAURI__'] !== null;
    } else {
      this._isTauri = false;
    }
  }

  /**
   * Check if running in Tauri desktop mode
   */
  isTauri(): boolean {
    return this._isTauri;
  }

  /**
   * Check if running in web/PWA mode
   */
  isWeb(): boolean {
    return !this._isTauri;
  }
}
