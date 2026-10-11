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
  MemberDocumentsService,
  maxMemberDocumentBytes,
} from './member-documents.service';

// The superadmin's view of staff users' documents, mirroring
// superadmin/members/:memberId/documents for members.
@Controller('superadmin/staff')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminStaffDocumentsController {
  constructor(private readonly documents: MemberDocumentsService) {}

  @Get('directory')
  directory() {
    return this.documents.staffDirectory();
  }

  @Get(':profileId/documents')
  list(@Param('profileId') profileId: string) {
    return this.documents.listFor({ kind: 'staff', profileId });
  }

  @Post(':profileId/documents/:typeId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxMemberDocumentBytes },
    }),
  )
  upload(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('profileId') profileId: string,
    @Param('typeId') typeId: string,
    @Body() body: { documentNumber?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documents.upload(
      profile,
      { kind: 'staff', profileId },
      typeId,
      body,
      file,
    );
  }

  @Delete(':profileId/documents/:typeId')
  remove(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('profileId') profileId: string,
    @Param('typeId') typeId: string,
  ) {
    return this.documents.remove(profile, { kind: 'staff', profileId }, typeId);
  }

  @Get(':profileId/documents/:typeId/file')
  file(@Param('profileId') profileId: string, @Param('typeId') typeId: string) {
    return this.documents.fileUrl({ kind: 'staff', profileId }, typeId);
  }
}
