import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { LandingMediaService } from './landing-media.service';

@Controller('superadmin/landing-media')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminLandingMediaController {
  constructor(private readonly landingMedia: LandingMediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(@UploadedFile() file?: Express.Multer.File) {
    return this.landingMedia.upload(file);
  }
}
