import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { NotificationsService } from './notifications.service';

@Controller('member/notifications')
@UseGuards(AuthGuard)
@Roles('member')
export class MemberNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentProfile() profile: { id: string; role: string }) {
    return this.notifications.list(profile);
  }

  @Get('unread-count')
  unreadCount(@CurrentProfile() profile: { id: string; role: string }) {
    return this.notifications.unreadCount(profile);
  }

  @Post(':id/read')
  markRead(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
  ) {
    return this.notifications.markRead(profile, id);
  }

  @Post('read-all')
  markAllRead(@CurrentProfile() profile: { id: string; role: string }) {
    return this.notifications.markAllRead(profile);
  }
}
