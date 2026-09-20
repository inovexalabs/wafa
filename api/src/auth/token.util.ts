import type { Request } from 'express';

export function extractAccessToken(request: Request, authorization?: string) {
  if (authorization?.startsWith('Bearer ')) return authorization.slice('Bearer '.length);
  const cookies = request.headers.cookie?.split(';') ?? [];
  const match = cookies.find((cookie) => cookie.trim().startsWith('wafa_access_token='));
  return match ? decodeURIComponent(match.trim().slice('wafa_access_token='.length)) : undefined;
}
