import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

export type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function requestMeta(request?: Request): RequestMeta {
  if (!request) return { ipAddress: null, userAgent: null };
  const userAgent = request.headers['user-agent'];
  return {
    // With `trust proxy` configured, Express resolves this from the
    // X-Forwarded-For chain validated against the trusted hop count,
    // instead of trusting a client-suppliable header directly.
    ipAddress: request.ip || null,
    userAgent: typeof userAgent === 'string' ? userAgent : null,
  };
}

const requestMetaStorage = new AsyncLocalStorage<RequestMeta>();

/**
 * Express middleware that makes the current request's IP and user agent
 * available to AuditService, so every audit entry records them without each
 * service having to pass the request through.
 */
export function requestMetaContext(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  requestMetaStorage.run(requestMeta(request), next);
}

export function currentRequestMeta(): RequestMeta | undefined {
  return requestMetaStorage.getStore();
}
