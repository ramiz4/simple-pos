/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  const portEnv = process.env['PORT'];
  const port = portEnv !== undefined ? Number(portEnv) : 3000;
  if (Number.isNaN(port)) {
    throw new Error(`Invalid PORT environment variable: ${portEnv}`);
  }
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
