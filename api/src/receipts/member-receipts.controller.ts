import { Body, Controller, Get, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { ReceiptsService } from './receipts.service';

type CreateReceiptBody = { amount: string; paymentType: 'monthly_deposit' | 'share_contribution' | 'loan_payment' | 'other'; paymentDate: string };

@Controller('member/receipts')
@UseGuards(AuthGuard)
@Roles('member')
export class MemberReceiptsController {
  constructor(private readonly receipts: ReceiptsService) {}

  @Get()
  list(@CurrentProfile() profile: { id: string; role: string }) {
    return this.receipts.listForMember(profile);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  create(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: CreateReceiptBody,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.receipts.createForMember(profile, body, file);
  }
}
