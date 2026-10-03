import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { MembersService } from './members.service';

@Controller('superadmin/members')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminMembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list() {
    return this.members.listActive();
  }

  @Get('directory')
  directory() {
    return this.members.directory();
  }

  @Patch(':id')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: { joinedAt: string },
  ) {
    return this.members.updateJoinedAt(profile, id, body?.joinedAt);
  }
}
