import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import {
  CertificatesService,
  maxCertificateBytes,
} from './certificates.service';
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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxCertificateBytes },
    }),
  )
  create(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: CreateCertificateInput,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.certificates.issue(profile, body, file);
  }

  @Delete(':id')
  remove(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
  ) {
    return this.certificates.remove(profile, id);
  }
}
