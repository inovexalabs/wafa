import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { requestMetaContext } from './audit/request-meta';

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

/**
 * Number of reverse proxies in front of the API that append to
 * X-Forwarded-For. 1 fits a single hosting proxy (Vercel, Render, Railway,
 * Fly). Behind a CDN plus a host proxy (e.g. Cloudflare -> Render) use 2.
 * Too low and every client shares the proxy's IP for rate limiting; too high
 * (or the API reachable directly) and clients can spoof their IP.
 */
function trustProxyHops() {
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  return Number.isInteger(hops) && hops >= 0 ? hops : 1;
}

/**
 * Security middleware and request handling shared by main.ts and the e2e
 * tests, so the tests exercise the real configuration.
 */
export function configureApp(
  app: INestApplication,
  { production = process.env.NODE_ENV === 'production' } = {},
) {
  // Trust only the configured proxy hops so req.ip, req.secure and
  // X-Forwarded-For are resolved from what the proxy added instead of taken
  // from client-supplied headers (prevents IP spoofing in audit logs and rate
  // limits, and keeps secure-cookie/HTTPS detection correct behind the proxy).
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops());

  // Force HTTPS in production. The hosting proxy terminates TLS and reports
  // the original scheme in X-Forwarded-Proto (read via trust proxy above).
  // Plain-HTTP requests are refused rather than redirected so a session
  // cookie or password is never accepted over an unencrypted hop. Health
  // checks are exempt because some platforms probe them over internal HTTP.
  if (production) {
    app.use((request: Request, response: Response, next: NextFunction) => {
      if (request.secure || request.path === '/api/health') {
        next();
        return;
      }
      response.status(403).json({ message: 'HTTPS is required.' });
    });
  }

  app.use(requestMetaContext);

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
  )
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

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
    const source = request.headers.origin ?? request.headers.referer;
    if (!source) {
      next();
      return;
    }
    // Compare exact origins: a prefix match would let
    // https://wafa.example.evil.com through for https://wafa.example.
    let origin: string | null = null;
    try {
      origin = new URL(source).origin;
    } catch {
      origin = null;
    }
    if (origin && allowedOrigins.includes(origin)) {
      next();
      return;
    }
    response.status(403).json({ message: 'Cross-origin request blocked.' });
  });

  app.setGlobalPrefix('api');
}
