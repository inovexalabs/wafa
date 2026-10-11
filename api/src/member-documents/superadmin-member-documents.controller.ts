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

@Controller('superadmin/members/:memberId/documents')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminMemberDocumentsController {
  constructor(private readonly documents: MemberDocumentsService) {}

  @Get()
  list(@Param('memberId') memberId: string) {
    return this.documents.listFor({ kind: 'member', memberId });
  }

  @Post(':typeId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxMemberDocumentBytes },
    }),
  )
  upload(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('memberId') memberId: string,
    @Param('typeId') typeId: string,
    @Body() body: { documentNumber?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documents.upload(
      profile,
      { kind: 'member', memberId },
      typeId,
      body,
      file,
    );
  }

  @Delete(':typeId')
  remove(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('memberId') memberId: string,
    @Param('typeId') typeId: string,
  ) {
    return this.documents.remove(profile, { kind: 'member', memberId }, typeId);
  }

  @Get(':typeId/file')
  file(@Param('memberId') memberId: string, @Param('typeId') typeId: string) {
    return this.documents.fileUrl({ kind: 'member', memberId }, typeId);
  }
}
