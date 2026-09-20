import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { MeetingsService } from './meetings.service';

@Controller('accountant/meetings')
@UseGuards(AuthGuard)
@Roles('accountant')
export class AccountantMeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  list(@CurrentProfile() profile: { id: string; role: string }) {
    return this.meetings.list(profile);
  }
}
