export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'ws://localhost:3000',
  enableDebugLogging: true,
  syncIntervalMs: 5000,
  sentryDsn: null as string | null,
  features: {
    cloudSync: true,
    offlineMode: true,
    analytics: true,
  },
};

export type Environment = typeof environment;
