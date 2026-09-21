import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { ChatService } from './chat.service';

type SendMessageBody = { content: string };

@Controller('chat')
@UseGuards(AuthGuard)
@Roles('superadmin', 'admin', 'accountant', 'member')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(@Query('after') after?: string) {
    return this.chat.list(after);
  }

  @Post()
  send(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: SendMessageBody,
  ) {
    return this.chat.send(profile, body?.content);
  }
}
