import { Logger } from '@nestjs/common';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const logger = new Logger('Turnstile');
let warnedUnconfigured = false;

/**
 * Verifies a Cloudflare Turnstile token. Returns true when no secret is
 * configured (captcha disabled), so local development works without keys.
 */
export async function verifyCaptcha(token: unknown, remoteIp?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (!warnedUnconfigured && process.env.NODE_ENV === 'production') {
      logger.warn('TURNSTILE_SECRET_KEY is not set; public forms have no captcha.');
      warnedUnconfigured = true;
    }
    return true;
  }
  if (typeof token !== 'string' || !token || token.length > 2048) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    // Fail closed: if Cloudflare can't be reached the form rejects the message
    // and the page offers the email fallback instead.
    logger.error(
      `Captcha verification failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
    return false;
  }
}
