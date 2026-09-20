// zoom.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class ZoomService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Fetches or returns a cached Server-to-Server OAuth token.
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
    ).toString('base64');

    try {
      const response = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'account_credentials',
          account_id: process.env.ZOOM_ACCOUNT_ID!,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Expire token slightly early (5-minute buffer) to avoid race conditions
      this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

      return this.accessToken!;
    } catch (error) {
      throw new HttpException(
        `Zoom OAuth Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * True when Zoom Server-to-Server OAuth credentials are configured.
   */
  hasCredentials(): boolean {
    return Boolean(
      process.env.ZOOM_ACCOUNT_ID &&
        process.env.ZOOM_CLIENT_ID &&
        process.env.ZOOM_CLIENT_SECRET,
    );
  }

  /**
   * Creates a scheduled Zoom meeting and returns its id and join/start URLs.
   */
  async createMeeting(input: {
    topic: string;
    startTime: string;
    durationMinutes?: number;
    agenda?: string;
    userId?: string;
  }) {
    const token = await this.getAccessToken();
    const userId = input.userId ?? process.env.ZOOM_USER_ID ?? 'me';

    const response = await fetch(
      `https://api.zoom.us/v2/users/${encodeURIComponent(userId)}/meetings`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: input.topic,
          type: 2,
          start_time: input.startTime,
          duration: input.durationMinutes ?? 60,
          agenda: input.agenda ?? '',
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            waiting_room: false,
          },
        }),
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new HttpException(data, response.status);
    }

    return {
      id: String(data.id),
      joinUrl: data.join_url as string,
      startUrl: data.start_url as string,
    };
  }
}
