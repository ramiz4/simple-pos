import { Injectable } from '@angular/core';

const API_BASE_STORAGE_KEY = 'simple_pos_api_base_url';

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {
  getBaseUrl(): string {
    const fromStorage = this.readFromStorage();
    if (fromStorage) {
      return fromStorage;
    }

    if (typeof window === 'undefined') {
      return 'http://localhost:3000/api/v1';
    }

    // In Tauri production builds window.location uses a custom protocol
    // (e.g. tauri://localhost or https://tauri.localhost) which would produce
    // an invalid API URL. Fall back to http://localhost in that case.
    const { protocol, hostname } = window.location;
    if (protocol === 'tauri:' || hostname === 'tauri.localhost') {
      return 'http://localhost:3000/api/v1';
    }

    const apiPort = '3000';
    return `${protocol}//${hostname}:${apiPort}/api/v1`;
  }

  setBaseUrl(url: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    const normalized = url.trim().replace(/\/$/, '');
    localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
  }

  private readFromStorage(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const value = localStorage.getItem(API_BASE_STORAGE_KEY);
    if (!value) {
      return null;
    }

    return value.trim().replace(/\/$/, '');
  }
}
