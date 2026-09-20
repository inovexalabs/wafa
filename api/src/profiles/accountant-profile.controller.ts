import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { ProfilesService } from './profiles.service';

type UpdateProfileBody = { fullName?: string; phone?: string };

@Controller('accountant/profile')
@UseGuards(AuthGuard)
@Roles('accountant')
export class AccountantProfileController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  get(@CurrentProfile() profile: { id: string; role: string }) {
    return this.profiles.getOwn(profile);
  }

  @Patch()
  update(@CurrentProfile() profile: { id: string; role: string }, @Body() body: UpdateProfileBody) {
    return this.profiles.updateOwn(profile, body);
  }
}
