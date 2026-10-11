import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly client: Resend | null;
  private readonly from: string;
  private readonly replyTo: string | undefined;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.client = apiKey ? new Resend(apiKey) : null;
    this.from =
      process.env.RESEND_FROM_EMAIL ?? 'WAFA <notifications@wafa.example.com>';
    // A monitored reply address reads as a real sender to spam filters.
    this.replyTo = process.env.RESEND_REPLY_TO?.trim() || undefined;
  }

  hasCredentials(): boolean {
    return this.client !== null;
  }

  async send(
    to: string,
    subject: string,
    html: string,
    text: string,
    replyTo?: string,
  ): Promise<string | null> {
    if (!this.client) return null;
    const effectiveReplyTo = replyTo ?? this.replyTo;
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to,
      subject,
      html,
      text,
      ...(effectiveReplyTo ? { replyTo: effectiveReplyTo } : {}),
    });
    if (error) throw new Error(error.message);
    return data?.id ?? null;
  }
}
