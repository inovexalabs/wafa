import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { NotificationsService } from './notifications.service';

type AnnounceBody = { title: string; message: string; recipientIds?: string[] };

@Controller('admin/notifications')
@UseGuards(AuthGuard)
@Roles('admin')
export class AdminNotificationsController {
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

  @Post()
  announce(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: AnnounceBody,
  ) {
    return this.notifications.announce(body, profile);
  }
}
