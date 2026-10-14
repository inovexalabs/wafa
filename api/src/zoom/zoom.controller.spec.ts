import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import type { Request } from 'express';
import { ZoomController } from './zoom.controller';

const SECRET = 'test-zoom-secret';

function sign(rawBody: string, timestampSeconds: number, secret = SECRET) {
  const digest = crypto
    .createHmac('sha256', secret)
    .update(`v0:${timestampSeconds}:${rawBody}`)
    .digest('hex');
  return `v0=${digest}`;
}

function call(
  controller: ZoomController,
  rawBody: string,
  headers: { signature?: string; timestamp?: string | number },
  parsedBody: unknown = JSON.parse(rawBody),
) {
  const request = { rawBody: Buffer.from(rawBody) } as unknown as Request;
  return controller.handleWebhook(
    parsedBody as never,
    headers.signature,
    headers.timestamp === undefined ? undefined : String(headers.timestamp),
    request,
  );
}

describe('ZoomController webhook', () => {
  const now = () => Math.floor(Date.now() / 1000);
  const event = JSON.stringify({ event: 'meeting.started', payload: { object: { id: 1 } } });
  let controller: ZoomController;

  beforeEach(() => {
    process.env.ZOOM_SECRET_TOKEN = SECRET;
    controller = new ZoomController();
  });
  afterAll(() => {
    delete process.env.ZOOM_SECRET_TOKEN;
  });

  it('accepts a correctly signed, fresh event (timestamp in seconds)', () => {
    const ts = now();
    expect(call(controller, event, { signature: sign(event, ts), timestamp: ts })).toEqual({
      status: 'success',
    });
  });

  it('rejects a replay of an accepted request', () => {
    const ts = now();
    const headers = { signature: sign(event, ts), timestamp: ts };
    call(controller, event, headers);
    expect(() => call(controller, event, headers)).toThrow(BadRequestException);
  });

  it.each([
    ['missing signature', (ts: number) => ({ timestamp: ts })],
    ['missing timestamp', (ts: number) => ({ signature: sign(event, ts) })],
    ['wrong secret', (ts: number) => ({ signature: sign(event, ts, 'other'), timestamp: ts })],
    ['expired (6 minutes old)', (ts: number) => ({ signature: sign(event, ts - 360), timestamp: ts - 360 })],
    ['from the future (2 minutes ahead)', (ts: number) => ({ signature: sign(event, ts + 120), timestamp: ts + 120 })],
    ['timestamp swapped after signing', (ts: number) => ({ signature: sign(event, ts - 10), timestamp: ts })],
    ['garbage timestamp', (ts: number) => ({ signature: sign(event, ts), timestamp: 'abc' })],
  ])('rejects %s', (_label, headers) => {
    expect(() => call(controller, event, headers(now()))).toThrow(BadRequestException);
  });

  it('verifies the raw bytes, not the parsed body', () => {
    const ts = now();
    const tampered = event.replace('"id":1', '"id":2');
    // Same JSON object passed as the parsed body, but the raw bytes differ.
    expect(() =>
      call(controller, tampered, { signature: sign(event, ts), timestamp: ts }, JSON.parse(event)),
    ).toThrow(BadRequestException);
  });

  it('rejects an unsigned URL-validation handshake (no HMAC oracle)', () => {
    const forgedTarget = `v0:${now()}:${event}`;
    const handshake = JSON.stringify({
      event: 'endpoint.url_validation',
      payload: { plainToken: forgedTarget },
    });
    expect(() => call(controller, handshake, {})).toThrow(BadRequestException);
  });

  it('answers a signed URL-validation handshake', () => {
    const ts = now();
    const handshake = JSON.stringify({ event: 'endpoint.url_validation', payload: { plainToken: 'abc' } });
    const expected = crypto.createHmac('sha256', SECRET).update('abc').digest('hex');
    expect(call(controller, handshake, { signature: sign(handshake, ts), timestamp: ts })).toEqual({
      plainToken: 'abc',
      encryptedToken: expected,
    });
  });

  it('rejects everything when no secret is configured', () => {
    delete process.env.ZOOM_SECRET_TOKEN;
    const ts = now();
    expect(() => call(controller, event, { signature: sign(event, ts), timestamp: ts })).toThrow(
      BadRequestException,
    );
  });
});
