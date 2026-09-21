import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { CertificatesService } from './certificates.service';
import type { CreateCertificateInput } from './certificates.service';

@Controller('superadmin/certificates')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get('recipients')
  recipients() {
    return this.certificates.listRecipients();
  }

  @Get()
  list() {
    return this.certificates.listAll();
  }

  @Get('mine')
  mine(@CurrentProfile() profile: { id: string; role: string }) {
    return this.certificates.listForProfile(profile);
  }

  @Post()
  create(@CurrentProfile() profile: { id: string; role: string }, @Body() body: CreateCertificateInput) {
    return this.certificates.issue(profile, body);
  }
}
