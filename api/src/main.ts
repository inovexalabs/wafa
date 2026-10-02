import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SESSION_COOKIE_NAMES = [
  'wafa_access_token',
  'wafa_refresh_token',
];

function hasSessionCookie(request: Request) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return false;
  return SESSION_COOKIE_NAMES.some((name) =>
    cookieHeader.split(';').some((part) => part.trim().startsWith(`${name}=`)),
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Trust the first hop reverse proxy/CDN so req.ip, req.secure and
  // X-Forwarded-For are resolved correctly instead of taken from
  // client-supplied headers (prevents IP spoofing in audit logs and
  // keeps secure-cookie/HTTPS detection correct behind the hosting proxy).
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(
    helmet({
      // This is a JSON API with no HTML responses of its own, so a
      // restrictive default-deny CSP is safe and blocks it being
      // embedded as an unexpected rendering surface.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  const allowedOrigins = (
    process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'
  ).split(',');

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Defense in depth against CSRF: browsers always send the session
  // cookies on cross-site requests too, so reject state-changing
  // requests that carry our cookies but declare an Origin/Referer
  // outside the configured frontends. Non-browser callers (Bearer
  // token clients, the Zoom webhook) never send these cookies, so
  // they are unaffected.
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (!MUTATING_METHODS.has(request.method) || !hasSessionCookie(request)) {
      next();
      return;
    }
    const origin = request.headers.origin ?? request.headers.referer;
    if (!origin || allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      next();
      return;
    }
    response.status(403).json({ message: 'Cross-origin request blocked.' });
  });

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
