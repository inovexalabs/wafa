import type { Request } from 'express';

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
