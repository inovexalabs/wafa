import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { MeetingsService } from './meetings.service';

type CreateMeetingBody = { title: string; description?: string; scheduledAt: string; durationMinutes?: number; meetingType?: 'online' | 'physical' | 'hybrid'; meetingUrl?: string; memberIds?: string[] };

@Controller('admin/meetings')
@UseGuards(AuthGuard)
@Roles('admin')
export class AdminMeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  list(@CurrentProfile() profile: { id: string; role: string }) {
    return this.meetings.list(profile);
  }

  @Post()
  create(@CurrentProfile() profile: { id: string; role: string }, @Body() body: CreateMeetingBody) {
    return this.meetings.create(profile, body);
  }

  @Get(':id/shares')
  shares(@Param('id') id: string) {
    return this.meetings.sharedMemberIds(id);
  }

  @Post(':id/share')
  share(@Param('id') id: string, @Body() body: { memberIds: string[] }) {
    return this.meetings.addMembers(id, body?.memberIds ?? []);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.meetings.cancel(id);
  }
}
