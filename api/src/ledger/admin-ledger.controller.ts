import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { LedgerService } from './ledger.service';

type Profile = { id: string; role: string };
type UpsertEntryBody = {
  bsYear: number;
  bsMonth: number;
  bsDay?: number;
  shareValue?: number;
  monthlyDeposit?: number;
  wafaKosh?: number;
  additionalDeposit?: number;
  interest?: number;
  fine?: number;
  notes?: string;
};
type UpdateSettingsBody = {
  openingBalance?: number;
  openingBsYear?: number;
  openingBsMonth?: number;
  openingBsDay?: number;
  availableBalance?: number | null;
};

@Controller('admin/ledger')
@UseGuards(AuthGuard)
@Roles('admin')
export class AdminLedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Get('totals')
  orgTotals(@Query('year') year?: string) {
    return this.ledger.getOrgTotals(year ? Number(year) : undefined);
  }

  @Get(':memberId/summary')
  summary(@Param('memberId') memberId: string) {
    return this.ledger.getSummaryForMember(memberId);
  }

  @Get(':memberId/entries')
  entries(@Param('memberId') memberId: string, @Query('year') year?: string) {
    return this.ledger.listEntriesForMember(
      memberId,
      year ? Number(year) : undefined,
    );
  }

  @Post(':memberId/entries')
  upsertEntry(
    @CurrentProfile() profile: Profile,
    @Param('memberId') memberId: string,
    @Body() body: UpsertEntryBody,
  ) {
    return this.ledger.upsertEntry(profile, memberId, body);
  }

  @Patch(':memberId/settings')
  updateSettings(
    @CurrentProfile() profile: Profile,
    @Param('memberId') memberId: string,
    @Body() body: UpdateSettingsBody,
  ) {
    return this.ledger.updateSettings(profile, memberId, body);
  }
}
