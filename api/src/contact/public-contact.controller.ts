import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator';
import { ContactService, type ContactMessageInput } from './contact.service';

@Public()
@Controller('public/contact')
export class PublicContactController {
  constructor(private readonly contact: ContactService) {}

  // Unauthenticated and sends real email, so keep the per-IP budget tight
  // to protect the Resend monthly quota.
  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 10 * 60_000 } })
  submit(@Body() body: ContactMessageInput, @Req() request: Request) {
    return this.contact.submit(body, request.ip);
  }
}
