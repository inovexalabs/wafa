import { Controller, Get } from '@nestjs/common';
import { LandingService } from './landing.service';

@Controller('public/landing')
export class PublicLandingController {
  constructor(private readonly landing: LandingService) {}

  @Get()
  get() {
    return this.landing.get();
  }
}
