import { Logger } from '@nestjs/common';

const logger = new Logger('JwtConfig');

const DEV_JWT_SECRET = 'simple-pos-jwt-secret-dev-only';
const DEV_REFRESH_SECRET = 'simple-pos-refresh-secret-dev-only';

const ALLOWED_INSECURE_JWT_ENVS = new Set(['development', 'test']);

function resolveSecret(envKey: string, devFallback: string): string {
  const value = process.env[envKey];
  if (value) {
    return value;
  }

  const nodeEnv = process.env['NODE_ENV'] ?? 'development';

  if (!ALLOWED_INSECURE_JWT_ENVS.has(nodeEnv)) {
    throw new Error(
      `${envKey} environment variable must be set when NODE_ENV=${nodeEnv}. ` +
        `Set ${envKey} to a secure secret value.`,
    );
  }

  logger.warn(
    `${envKey} not set — using development fallback. ` +
      `This is only safe in local development/test. For other environments, set ${envKey}.`,
  );
  return devFallback;
}

export function getJwtSecret(): string {
  return resolveSecret('JWT_SECRET', DEV_JWT_SECRET);
}

export function getJwtRefreshSecret(): string {
  return resolveSecret('JWT_REFRESH_SECRET', DEV_REFRESH_SECRET);
}
