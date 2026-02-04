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
    this._isTauri = typeof window !== 'undefined' && typeof (window as any).__TAURI__ === 'object';
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
