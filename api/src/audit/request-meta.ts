import type { Request } from 'express';

export type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function requestMeta(request?: Request): RequestMeta {
  if (!request) return { ipAddress: null, userAgent: null };
  const forwarded = request.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim();
  const userAgent = request.headers['user-agent'];
  return {
    ipAddress: forwardedIp || request.ip || null,
    userAgent: typeof userAgent === 'string' ? userAgent : null,
  };
}
