import 'dotenv/config';
import type { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

const isProduction = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    // No debug/verbose logging in production.
    ...(isProduction
      ? { logger: ['log', 'warn', 'error', 'fatal'] satisfies LogLevel[] }
      : {}),
  });

  configureApp(app, { production: isProduction });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
