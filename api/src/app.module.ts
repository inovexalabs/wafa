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
import { MemberProfileController } from './members/member-profile.controller';
import { MembersService } from './members/members.service';
import { AdminProfileController } from './profiles/admin-profile.controller';
import { SuperadminProfileController } from './profiles/superadmin-profile.controller';
import { AccountantProfileController } from './profiles/accountant-profile.controller';
import { ProfilesService } from './profiles/profiles.service';
import { MemberReceiptsController } from './receipts/member-receipts.controller';
import { ReceiptsService } from './receipts/receipts.service';
import { MemberPaymentsController } from './payments/member-payments.controller';
import { PaymentsService } from './payments/payments.service';
import { AdminCertificatesController } from './certificates/admin-certificates.controller';
import { MemberCertificatesController, AccountantCertificatesController } from './certificates/member-certificates.controller';
import { CertificatesService } from './certificates/certificates.service';
import { ZoomController } from './zoom/zoom.controller';
import { ZoomService } from './zoom/zoom.service';
import { HealthController } from './health/health.controller';
import { AdminNotificationsController } from './notifications/admin-notifications.controller';
import { SuperadminNotificationsController } from './notifications/superadmin-notifications.controller';
import { AccountantNotificationsController } from './notifications/accountant-notifications.controller';
import { MemberNotificationsController } from './notifications/member-notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { ResendService } from './notifications/resend.service';
import { SuperadminAuditController } from './audit/superadmin-audit.controller';
import { AuditService } from './audit/audit.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    HealthController,
    AuthController,
    AdminMeetingsController,
    SuperadminMeetingsController,
    AccountantMeetingsController,
    MemberMeetingsController,
    AdminMembersController,
    SuperadminMembersController,
    MemberProfileController,
    AdminProfileController,
    SuperadminProfileController,
    AccountantProfileController,
    MemberReceiptsController,
    MemberPaymentsController,
    AdminCertificatesController,
    MemberCertificatesController,
    AccountantCertificatesController,
    ZoomController,
    AdminNotificationsController,
    SuperadminNotificationsController,
    AccountantNotificationsController,
    MemberNotificationsController,
    SuperadminAuditController,
  ],
  providers: [
    AuthService,
    SupabaseService,
    MeetingsService,
    MembersService,
    ProfilesService,
    ReceiptsService,
    PaymentsService,
    CertificatesService,
    ZoomService,
    NotificationsService,
    ResendService,
    AuditService,
  ],
})
export class AppModule {}
