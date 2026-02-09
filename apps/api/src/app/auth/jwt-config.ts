import { Logger } from '@nestjs/common';

const logger = new Logger('JwtConfig');

const DEV_JWT_SECRET = 'simple-pos-jwt-secret-dev-only';
const DEV_REFRESH_SECRET = 'simple-pos-refresh-secret-dev-only';

function resolveSecret(envKey: string, devFallback: string): string {
  const value = process.env[envKey];
  if (value) {
    return value;
  }
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error(`${envKey} environment variable must be set in production`);
  }
  logger.warn(`${envKey} not set — using development fallback. Set this variable in production.`);
  return devFallback;
}

export function getJwtSecret(): string {
  return resolveSecret('JWT_SECRET', DEV_JWT_SECRET);
}

export function getJwtRefreshSecret(): string {
  return resolveSecret('JWT_REFRESH_SECRET', DEV_REFRESH_SECRET);
}
