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

  /**
   * Sends many emails through Resend's batch endpoint (100 per request).
   * Firing one request per email trips Resend's per-second rate limit as
   * soon as an announcement reaches more than a handful of people.
   * Results line up with `messages`: a provider id, or the error for that chunk.
   */
  async sendBatch(
    messages: { to: string; subject: string; html: string; text: string }[],
  ): Promise<({ id: string | null } | { error: string })[]> {
    if (!this.client) return messages.map(() => ({ id: null }));
    const results: ({ id: string | null } | { error: string })[] = [];
    for (let start = 0; start < messages.length; start += 100) {
      const chunk = messages.slice(start, start + 100);
      try {
        const { data, error } = await this.client.batch.send(
          chunk.map((message) => ({
            from: this.from,
            ...message,
            ...(this.replyTo ? { replyTo: this.replyTo } : {}),
          })),
        );
        if (error) throw new Error(error.message);
        chunk.forEach((_, index) =>
          results.push({ id: data?.data[index]?.id ?? null }),
        );
      } catch (sendError) {
        const message =
          sendError instanceof Error ? sendError.message : 'Unknown error';
        chunk.forEach(() => results.push({ error: message }));
      }
    }
    return results;
  }
}
