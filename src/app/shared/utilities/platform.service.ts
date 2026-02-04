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
    // In Tauri v2, __TAURI_INTERNALS__ is the most reliable internal marker
    // that is injected even if globals are disabled.
    this._isTauri =
      typeof window !== 'undefined' &&
      ((window as any).__TAURI_INTERNALS__ !== undefined ||
        (window as any).__TAURI_IPC__ !== undefined);
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
