import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { MembersService } from './members.service';

type UpdateProfileBody = { fullName?: string; phone?: string; address?: string; occupation?: string };

@Controller('member/profile')
@UseGuards(AuthGuard)
@Roles('member')
export class MemberProfileController {
  constructor(private readonly members: MembersService) {}

  @Get()
  get(@CurrentProfile() profile: { id: string; role: string }) {
    return this.members.getOwnProfile(profile);
  }

  @Patch()
  update(@CurrentProfile() profile: { id: string; role: string }, @Body() body: UpdateProfileBody) {
    return this.members.updateOwnProfile(profile, body);
  }
}
