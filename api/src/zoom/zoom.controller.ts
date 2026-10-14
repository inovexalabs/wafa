// zoom.controller.ts
import { BadRequestException, Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, Req } from '@nestjs/common';
import type { Request } from 'express';
import * as crypto from 'crypto';
import { Public } from '../auth/public.decorator';

interface ZoomWebhookPayload {
  event: string;
  payload: {
    plainToken?: string;
    object?: Record<string, any>;
  };
}

// Signed requests older than this (or this far in the future) are rejected.
const MAX_AGE_MS = 5 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 30 * 1000;

@Public()
@Controller('zoom')
export class ZoomController {
  private readonly logger = new Logger(ZoomController.name);
  // Signatures already accepted, with when they stop being valid anyway. A
  // captured request replayed inside the freshness window is refused. This is
  // per instance; with several API instances a replay could land on another
  // one, which only matters once events trigger real side effects.
  private readonly seenSignatures = new Map<string, number>();

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Body() body: ZoomWebhookPayload,
    @Headers('x-zm-signature') signature: string | undefined,
    @Headers('x-zm-request-timestamp') timestamp: string | undefined,
    @Req() request: Request,
  ) {
    // 1. Verify the signature before anything else, including the URL
    // validation handshake (Zoom signs those too). Answering an unsigned
    // handshake would hand out HMAC(secret, plainToken) for any plainToken,
    // and plainToken = "v0:<ts>:<forged body>" is a valid event signature.
    if (!this.isValidSignature(request, signature, timestamp)) {
      throw new BadRequestException('Invalid webhook signature.');
    }
    if (!this.markFirstUse(signature!)) {
      throw new BadRequestException('Webhook request already processed.');
    }

    // 2. Handle Zoom URL Validation Handshake
    if (body?.event === 'endpoint.url_validation' && body.payload?.plainToken) {
      const hash = crypto
        .createHmac('sha256', process.env.ZOOM_SECRET_TOKEN!)
        .update(body.payload.plainToken)
        .digest('hex');

      return {
        plainToken: body.payload.plainToken,
        encryptedToken: hash,
      };
    }

    // 3. Handle actual Zoom events (e.g. meeting.started, recording.completed).
    // Log identifiers only: the payload carries host emails and participant details.
    const meetingId = body?.payload?.object?.id as string | number | undefined;
    switch (body?.event) {
      case 'meeting.started':
      case 'meeting.ended':
        this.logger.log(`${body.event} (meeting ${meetingId ?? 'unknown'})`);
        break;
      default:
        this.logger.log(`Unhandled event: ${body?.event}`);
    }

    return { status: 'success' };
  }

  private markFirstUse(signature: string) {
    const now = Date.now();
    for (const [seen, expiresAt] of this.seenSignatures) {
      if (expiresAt <= now) this.seenSignatures.delete(seen);
    }
    if (this.seenSignatures.has(signature)) return false;
    this.seenSignatures.set(signature, now + MAX_AGE_MS + MAX_CLOCK_SKEW_MS);
    return true;
  }

  private isValidSignature(
    request: Request & { rawBody?: Buffer },
    signature: string | undefined,
    timestamp: string | undefined,
  ): boolean {
    const secret = process.env.ZOOM_SECRET_TOKEN;
    if (!secret || !signature || !timestamp || !request.rawBody) return false;

    // Reject stale requests to prevent replay of a captured signed payload.
    // Zoom sends the timestamp in seconds; allow a little clock skew.
    const ageMs = Date.now() - Number(timestamp) * 1000;
    if (!Number.isFinite(ageMs) || ageMs < -MAX_CLOCK_SKEW_MS || ageMs > MAX_AGE_MS) return false;

    // Signed over the exact bytes received, not the re-serialised JSON body.
    const message = `v0:${timestamp}:${request.rawBody.toString('utf8')}`;
    const expected = `v0=${crypto.createHmac('sha256', secret).update(message).digest('hex')}`;

    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  }
}
