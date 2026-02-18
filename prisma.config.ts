import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

if (!process.env['DATABASE_URL']) {
  config({ path: 'apps/api/.env' });
}

export default defineConfig({
  schema: 'apps/api/prisma/schema.prisma',
  migrations: {
    path: 'apps/api/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
