import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { LandingPeopleService } from './landing-people.service';
import type { LandingPersonKind } from './landing-people.service';

@Controller('public/landing-people')
export class PublicLandingPeopleController {
  constructor(private readonly landingPeople: LandingPeopleService) {}

  @Get()
  list(@Query('kind') kind: string) {
    if (kind !== 'team' && kind !== 'board') {
      throw new BadRequestException('A valid kind (team or board) is required.');
    }
    return this.landingPeople.listPublished(kind as LandingPersonKind);
  }
}
