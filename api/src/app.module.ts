import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { SupabaseService } from './supabase.service';
import { AdminMeetingsController } from './meetings/admin-meetings.controller';
import { SuperadminMeetingsController } from './meetings/superadmin-meetings.controller';
import { AccountantMeetingsController } from './meetings/accountant-meetings.controller';
import { MemberMeetingsController } from './meetings/member-meetings.controller';
import { MeetingsService } from './meetings/meetings.service';
import { MeetingsSchedulerService } from './meetings/meetings-scheduler.service';
import { AdminMembersController } from './members/admin-members.controller';
import { SuperadminMembersController } from './members/superadmin-members.controller';
import { AccountantMembersController } from './members/accountant-members.controller';
import { MemberProfileController } from './members/member-profile.controller';
import { MembersService } from './members/members.service';
import { AdminProfileController } from './profiles/admin-profile.controller';
import { SuperadminProfileController } from './profiles/superadmin-profile.controller';
import { AccountantProfileController } from './profiles/accountant-profile.controller';
import { ProfilesService } from './profiles/profiles.service';
import { MemberReceiptsController } from './receipts/member-receipts.controller';
import { AccountantReceiptsController } from './receipts/accountant-receipts.controller';
import { SuperadminReceiptsController } from './receipts/superadmin-receipts.controller';
import { ReceiptsService } from './receipts/receipts.service';
import { MemberPaymentsController } from './payments/member-payments.controller';
import { PaymentsService } from './payments/payments.service';
import { AdminCertificatesController } from './certificates/admin-certificates.controller';
import { MemberCertificatesController } from './certificates/member-certificates.controller';
import { AccountantCertificatesController } from './certificates/accountant-certificates.controller';
import { SuperadminCertificatesController } from './certificates/superadmin-certificates.controller';
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
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { MemberLedgerController } from './ledger/member-ledger.controller';
import { AccountantLedgerController } from './ledger/accountant-ledger.controller';
import { SuperadminLedgerController } from './ledger/superadmin-ledger.controller';
import { AdminLedgerController } from './ledger/admin-ledger.controller';
import { LedgerService } from './ledger/ledger.service';
import { PublicLandingController } from './landing/public-landing.controller';
import { SuperadminLandingController } from './landing/superadmin-landing.controller';
import { LandingService } from './landing/landing.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ScheduleModule.forRoot()],
  controllers: [
    HealthController,
    AuthController,
    AdminMeetingsController,
    SuperadminMeetingsController,
    AccountantMeetingsController,
    MemberMeetingsController,
    AdminMembersController,
    SuperadminMembersController,
    AccountantMembersController,
    MemberProfileController,
    AdminProfileController,
    SuperadminProfileController,
    AccountantProfileController,
    MemberReceiptsController,
    AccountantReceiptsController,
    SuperadminReceiptsController,
    MemberPaymentsController,
    AdminCertificatesController,
    MemberCertificatesController,
    AccountantCertificatesController,
    SuperadminCertificatesController,
    ZoomController,
    AdminNotificationsController,
    SuperadminNotificationsController,
    AccountantNotificationsController,
    MemberNotificationsController,
    SuperadminAuditController,
    ChatController,
    MemberLedgerController,
    AccountantLedgerController,
    SuperadminLedgerController,
    AdminLedgerController,
    PublicLandingController,
    SuperadminLandingController,
  ],
  providers: [
    AuthService,
    SupabaseService,
    MeetingsService,
    MeetingsSchedulerService,
    MembersService,
    ProfilesService,
    ReceiptsService,
    PaymentsService,
    CertificatesService,
    ZoomService,
    NotificationsService,
    ResendService,
    AuditService,
    ChatService,
    LedgerService,
    LandingService,
  ],
})
export class AppModule {}
