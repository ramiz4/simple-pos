export const environment = {
  production: true,
  apiBaseUrl: 'https://api.simplepos.com/api/v1',
  wsUrl: 'wss://api.simplepos.com',
  enableDebugLogging: false,
  syncIntervalMs: 30000,
  sentryDsn: null as string | null, // Set via CI/CD
  features: {
    cloudSync: true,
    offlineMode: true,
    analytics: true,
  },
};

export type Environment = typeof environment;
