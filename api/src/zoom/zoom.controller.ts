// zoom.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';

interface ZoomWebhookPayload {
  event: string;
  payload: {
    plainToken?: string;
    object?: Record<string, any>;
  };
}

@Controller('zoom')
export class ZoomController {
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() body: ZoomWebhookPayload) {
    // 1. Handle Zoom URL Validation Handshake
    if (body.event === 'endpoint.url_validation' && body.payload.plainToken) {
      const hash = crypto
        .createHmac('sha256', process.env.ZOOM_SECRET_TOKEN!)
        .update(body.payload.plainToken)
        .digest('hex');

      return {
        plainToken: body.payload.plainToken,
        encryptedToken: hash,
      };
    }

    // 2. Handle actual Zoom events (e.g. meeting.started, recording.completed)
    switch (body.event) {
      case 'meeting.started':
        console.log('Meeting started:', body.payload.object);
        break;
      case 'meeting.ended':
        console.log('Meeting ended:', body.payload.object);
        break;
      default:
        console.log(`Unhandled event: ${body.event}`);
    }

    return { status: 'success' };
  }
}
