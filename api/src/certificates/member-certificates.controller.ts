import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { CertificatesService } from './certificates.service';

@Controller('member/certificates')
@UseGuards(AuthGuard)
@Roles('member')
export class MemberCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get()
  list(@CurrentProfile() profile: { id: string; role: string }) {
    return this.certificates.listForProfile(profile);
  }
}

@Controller('accountant/certificates')
@UseGuards(AuthGuard)
@Roles('accountant')
export class AccountantCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get()
  list(@CurrentProfile() profile: { id: string; role: string }) {
    return this.certificates.listForProfile(profile);
  }
}
