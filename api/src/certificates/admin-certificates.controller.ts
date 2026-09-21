import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { CertificatesService } from './certificates.service';
import type { CreateCertificateInput } from './certificates.service';

@Controller('admin/certificates')
@UseGuards(AuthGuard)
@Roles('admin')
export class AdminCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get('recipients')
  recipients() {
    return this.certificates.listRecipients();
  }

  @Get()
  list() {
    return this.certificates.listAll();
  }

  @Post()
  create(@CurrentProfile() profile: { id: string; role: string }, @Body() body: CreateCertificateInput) {
    return this.certificates.issue(profile, body);
  }
}
