import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { MeetingsService } from './meetings.service';

type CreateMeetingBody = {
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingType?: 'online' | 'physical' | 'hybrid';
  meetingUrl?: string;
  recipientIds?: string[];
};
type UpdateMeetingBody = {
  title?: string;
  description?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  meetingType?: 'online' | 'physical' | 'hybrid';
};

@Controller('superadmin/meetings')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminMeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  list(@CurrentProfile() profile: { id: string; role: string }) {
    return this.meetings.list(profile);
  }

  @Post()
  create(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: CreateMeetingBody,
  ) {
    return this.meetings.create(profile, body);
  }

  @Get('recipients')
  recipients() {
    return this.meetings.listRecipients();
  }

  @Get(':id/recipients')
  sharedRecipients(@Param('id') id: string) {
    return this.meetings.sharedRecipientIds(id);
  }

  @Put(':id/recipients')
  setRecipients(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: { recipientIds: string[] },
  ) {
    return this.meetings.setRecipients(id, body?.recipientIds ?? [], profile);
  }

  @Patch(':id')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: UpdateMeetingBody,
  ) {
    return this.meetings.update(id, body, profile);
  }

  @Delete(':id')
  cancel(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
  ) {
    return this.meetings.cancel(id, profile);
  }
}
