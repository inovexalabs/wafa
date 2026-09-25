import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { LandingContent, LandingService } from './landing.service';

@Controller('superadmin/landing')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminLandingController {
  constructor(private readonly landing: LandingService) {}

  @Get()
  get() {
    return this.landing.get();
  }

  @Put()
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: Partial<LandingContent>,
  ) {
    return this.landing.update(profile, body);
  }
}
