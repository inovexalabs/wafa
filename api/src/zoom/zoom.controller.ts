// zoom.controller.ts
import { BadRequestException, Controller, Post, Body, Headers, HttpCode, HttpStatus, Req } from '@nestjs/common';
import type { Request } from 'express';
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
  handleWebhook(
    @Body() body: ZoomWebhookPayload,
    @Headers('x-zm-signature') signature: string | undefined,
    @Headers('x-zm-request-timestamp') timestamp: string | undefined,
    @Req() request: Request,
  ) {
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

    // 2. Verify the signature on every other (real) event before trusting the payload.
    if (!this.isValidSignature(request, signature, timestamp)) {
      throw new BadRequestException('Invalid webhook signature.');
    }

    // 3. Handle actual Zoom events (e.g. meeting.started, recording.completed)
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

  private isValidSignature(
    request: Request & { rawBody?: Buffer },
    signature: string | undefined,
    timestamp: string | undefined,
  ): boolean {
    const secret = process.env.ZOOM_SECRET_TOKEN;
    if (!secret || !signature || !timestamp || !request.rawBody) return false;

    // Reject stale requests to prevent replay of a captured signed payload.
    const ageMs = Date.now() - Number(timestamp);
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 5 * 60 * 1000) return false;

    const message = `v0:${timestamp}:${request.rawBody.toString('utf8')}`;
    const expected = `v0=${crypto.createHmac('sha256', secret).update(message).digest('hex')}`;

    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  }
}
