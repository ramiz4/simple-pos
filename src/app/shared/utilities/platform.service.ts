import { Injectable } from '@angular/core';

/**
 * Service to detect the current platform (Tauri desktop or web/PWA)
 */
@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private _isTauri: boolean;

  constructor() {
    this._isTauri = '__TAURI__' in window;
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
