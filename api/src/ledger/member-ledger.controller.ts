import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { LedgerService } from './ledger.service';

type Profile = { id: string; role: string };

@Controller('member/ledger')
@UseGuards(AuthGuard)
@Roles('member')
export class MemberLedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Get('summary')
  async summary(@CurrentProfile() profile: Profile) {
    const memberId = await this.ledger.memberIdFor(profile);
    return this.ledger.getSummaryForMember(memberId);
  }

  @Get('entries')
  async entries(
    @CurrentProfile() profile: Profile,
    @Query('year') year?: string,
  ) {
    const memberId = await this.ledger.memberIdFor(profile);
    return this.ledger.listEntriesForMember(
      memberId,
      year ? Number(year) : undefined,
    );
  }
}
