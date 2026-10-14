import { BadRequestException } from '@nestjs/common';

/**
 * Normalises an optional URL a user typed into a CMS field. Only http(s) is
 * accepted, so a stored value can never be a javascript: or data: URL that
 * the public site later renders as an href or image src. A bare domain is
 * treated as https. Empty input gives null.
 */
export function cleanOptionalHttpUrl(value: unknown, label = 'URL') {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string')
    throw new BadRequestException(`${label} must be text.`);
  const raw = value.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new BadRequestException(
      `${label} must be a valid link, e.g. https://example.com.`,
    );
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    throw new BadRequestException(`${label} must start with http:// or https://.`);
  return parsed.toString();
}
