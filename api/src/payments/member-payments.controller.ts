import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { PaymentsService } from './payments.service';

@Controller('member/payments')
@UseGuards(AuthGuard)
@Roles('member')
export class MemberPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  overview(@CurrentProfile() profile: { id: string; role: string }) {
    return this.payments.getOverviewForMember(profile);
  }
}
