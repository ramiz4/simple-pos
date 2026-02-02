import 'fake-indexeddb/auto';
import { vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', () => {
  return {
    default: {
      load: vi.fn(),
    },
  };
});

// import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// If jest-preset-angular is not used, we might need basic zone.js setup for Angular testing
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import 'zone.js';
import 'zone.js/testing';

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
