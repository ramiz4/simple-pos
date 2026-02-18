import { Environment } from './environment';

export const environment: Environment = {
  production: true,
  apiBaseUrl: 'https://api.simplepos.com/api/v1',
  wsUrl: 'wss://api.simplepos.com',
  enableDebugLogging: false,
  syncIntervalMs: 30000,
  sentryDsn: null, // Set via CI/CD
  features: {
    cloudSync: true,
    offlineMode: true,
    analytics: true,
  },
};
