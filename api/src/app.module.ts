import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { SupabaseService } from './supabase.service';
import { AdminMeetingsController } from './meetings/admin-meetings.controller';
import { SuperadminMeetingsController } from './meetings/superadmin-meetings.controller';
import { AccountantMeetingsController } from './meetings/accountant-meetings.controller';
import { MemberMeetingsController } from './meetings/member-meetings.controller';
import { MeetingsService } from './meetings/meetings.service';
import { AdminMembersController } from './members/admin-members.controller';
import { SuperadminMembersController } from './members/superadmin-members.controller';
import { MembersService } from './members/members.service';
import { ZoomController } from './zoom/zoom.controller';
import { ZoomService } from './zoom/zoom.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    AuthController,
    AdminMeetingsController,
    SuperadminMeetingsController,
    AccountantMeetingsController,
    MemberMeetingsController,
    AdminMembersController,
    SuperadminMembersController,
    ZoomController,
  ],
  providers: [AuthService, SupabaseService, MeetingsService, MembersService, ZoomService],
})
export class AppModule {}
