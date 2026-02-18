import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

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

    // Use environment configuration as the default
    return environment.apiBaseUrl;
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
