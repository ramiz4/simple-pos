/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app/app.module';

function resolveCorsOrigins(): string[] {
  const configuredOrigins = process.env['CORS_ORIGINS']
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:4300',
    'http://127.0.0.1:4300',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  app.use(`/${globalPrefix}/subscriptions/webhook`, express.raw({ type: 'application/json' }));
  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });
  const portEnv = process.env['PORT'];
  const port = portEnv !== undefined ? Number(portEnv) : 3000;
  if (Number.isNaN(port)) {
    throw new Error(`Invalid PORT environment variable: ${portEnv}`);
  }
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
