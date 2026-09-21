import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { ReceiptsService } from './receipts.service';

type ReviewProfile = { id: string; role: string };
type RejectReceiptBody = { reason: string };

@Controller('superadmin/receipts')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminReceiptsController {
  constructor(private readonly receipts: ReceiptsService) {}

  @Get()
  list(@Query('status') status?: string, @Query('memberId') memberId?: string) {
    return this.receipts.listForReview({ status, memberId });
  }

  @Get(':id/file')
  file(@Param('id') id: string) {
    return this.receipts.getFileUrl(id);
  }

  @Post(':id/approve')
  approve(@CurrentProfile() profile: ReviewProfile, @Param('id') id: string) {
    return this.receipts.approve(profile, id);
  }

  @Post(':id/reject')
  reject(
    @CurrentProfile() profile: ReviewProfile,
    @Param('id') id: string,
    @Body() body: RejectReceiptBody,
  ) {
    return this.receipts.reject(profile, id, body.reason);
  }
}
