import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LandingService } from '../landing/landing.service';
import { ResendService } from '../notifications/resend.service';
import { verifyCaptcha } from './turnstile';

export type ContactMessageInput = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  // Honeypot: hidden from people, filled in by naive bots.
  website?: unknown;
  // Cloudflare Turnstile token, required when TURNSTILE_SECRET_KEY is set.
  captchaToken?: unknown;
};

type ContactField = 'name' | 'email' | 'phone' | 'message';

const LIMITS = { name: 100, email: 200, phone: 40, message: 5000 } as const;
const MIN_MESSAGE_LENGTH = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BRAND_COLOR = '#1f6752';

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ] as string,
  );
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly landing: LandingService,
    private readonly resend: ResendService,
  ) {}

  async submit(input: ContactMessageInput, remoteIp?: string | null) {
    // Pretend success so bots don't learn to skip the honeypot.
    if (asText(input?.website)) return { ok: true };

    const name = asText(input?.name);
    const email = asText(input?.email);
    const phone = asText(input?.phone);
    const message = asText(input?.message);

    const fields: Partial<Record<ContactField, string>> = {};
    if (!name) fields.name = 'Please enter your name.';
    else if (name.length > LIMITS.name) fields.name = 'Name is too long.';
    if (!email) fields.email = 'Please enter your email so we can reply.';
    else if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email))
      fields.email = 'Please enter a valid email address.';
    if (phone.length > LIMITS.phone) fields.phone = 'Phone number is too long.';
    if (message.length < MIN_MESSAGE_LENGTH)
      fields.message = `Please write at least ${MIN_MESSAGE_LENGTH} characters.`;
    else if (message.length > LIMITS.message)
      fields.message = `Please keep your message under ${LIMITS.message} characters.`;

    if (Object.keys(fields).length)
      throw new BadRequestException({
        message: 'Please check the highlighted fields.',
        fields,
      });

    if (!(await verifyCaptcha(input?.captchaToken, remoteIp)))
      throw new BadRequestException(
        'The verification check failed or expired. Please try again.',
      );

    if (!this.resend.hasCredentials())
      throw new ServiceUnavailableException(
        'Messages cannot be sent right now. Please email or call us instead.',
      );

    const { contact } = await this.landing.get();
    // Collapse whitespace so a name can't smuggle line breaks into the header.
    const subject = `Website enquiry from ${name.replace(/\s+/g, ' ')}`;
    const rows: [string, string][] = [
      ['Name', name],
      ['Email', email],
      ...(phone ? ([['Phone', phone]] as [string, string][]) : []),
    ];

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17201d">
        <h2 style="font-size:18px;color:${BRAND_COLOR};margin:0 0 16px">New message from the WAFA website</h2>
        <table style="font-size:14px;border-collapse:collapse;margin:0 0 16px">
          ${rows
            .map(
              ([label, value]) =>
                `<tr><td style="padding:4px 16px 4px 0;color:#5b6b63">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
            )
            .join('')}
        </table>
        <p style="font-size:14px;line-height:1.6;white-space:pre-wrap;margin:0;padding:16px;background:#f7f8f4;border-radius:8px">${escapeHtml(message)}</p>
        <p style="font-size:12px;color:#5b6b63;margin:16px 0 0">Reply to this email to respond directly to ${escapeHtml(name)}.</p>
      </div>`;
    const text = `New message from the WAFA website\n\n${rows
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n')}\n\n${message}`;

    try {
      await this.resend.send(contact.email, subject, html, text, email);
    } catch (error) {
      this.logger.error(
        `Contact message failed to send: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new ServiceUnavailableException(
        'Your message could not be sent. Please try again or email us directly.',
      );
    }
    return { ok: true };
  }
}
