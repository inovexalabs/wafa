import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { LandingPeopleService } from './landing-people.service';
import type { LandingPersonKind, SaveLandingPersonInput } from './landing-people.service';

@Controller('superadmin/landing-people')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminLandingPeopleController {
  constructor(private readonly landingPeople: LandingPeopleService) {}

  @Get()
  list(@Query('kind') kind?: LandingPersonKind) {
    return this.landingPeople.listAll(kind);
  }

  @Post()
  create(@CurrentProfile() profile: { id: string; role: string }, @Body() body: SaveLandingPersonInput) {
    return this.landingPeople.create(profile, body);
  }

  @Put(':id')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: Partial<SaveLandingPersonInput>,
  ) {
    return this.landingPeople.update(profile, id, body);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: { id: string; role: string }, @Param('id') id: string) {
    return this.landingPeople.remove(profile, id);
  }
}
