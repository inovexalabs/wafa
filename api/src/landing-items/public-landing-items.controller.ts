import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { LandingItemsService } from './landing-items.service';
import type { LandingItemKind } from './landing-items.service';
import { Public } from '../auth/public.decorator';

const validKinds = new Set(['partner', 'investment', 'gallery']);

@Public()
@Controller('public/landing-items')
export class PublicLandingItemsController {
  constructor(private readonly landingItems: LandingItemsService) {}

  @Get()
  list(@Query('kind') kind: string) {
    if (!validKinds.has(kind)) {
      throw new BadRequestException('A valid kind (partner, investment, or gallery) is required.');
    }
    return this.landingItems.listPublished(kind as LandingItemKind);
  }
}
