import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly client: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.client = apiKey ? new Resend(apiKey) : null;
    this.from =
      process.env.RESEND_FROM_EMAIL ?? 'WAFA <notifications@wafa.example.com>';
  }

  hasCredentials(): boolean {
    return this.client !== null;
  }

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<string | null> {
    if (!this.client) return null;
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });
    if (error) throw new Error(error.message);
    return data?.id ?? null;
  }
}
