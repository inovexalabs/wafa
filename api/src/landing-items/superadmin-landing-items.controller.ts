import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { LandingItemsService } from './landing-items.service';
import type { LandingItemKind, SaveLandingItemInput } from './landing-items.service';

@Controller('superadmin/landing-items')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminLandingItemsController {
  constructor(private readonly landingItems: LandingItemsService) {}

  @Get()
  list(@Query('kind') kind?: LandingItemKind) {
    return this.landingItems.listAll(kind);
  }

  @Post()
  create(@CurrentProfile() profile: { id: string; role: string }, @Body() body: SaveLandingItemInput) {
    return this.landingItems.create(profile, body);
  }

  @Put(':id')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: Partial<SaveLandingItemInput>,
  ) {
    return this.landingItems.update(profile, id, body);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: { id: string; role: string }, @Param('id') id: string) {
    return this.landingItems.remove(profile, id);
  }
}
