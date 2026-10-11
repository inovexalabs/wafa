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
  DocumentOwner,
  MemberDocumentsService,
  maxMemberDocumentBytes,
} from './member-documents.service';

type StaffProfile = { id: string; role: string };

const ownerFor = (profile: StaffProfile): DocumentOwner => ({
  kind: 'staff',
  profileId: profile.id,
});

// Staff upload their own documents from their profile, against the same
// document types as members. Each role gets its own route prefix below
// (`my-documents`, since `superadmin/documents` is the public website files).
abstract class StaffDocumentsController {
  constructor(private readonly documents: MemberDocumentsService) {}

  @Get()
  list(@CurrentProfile() profile: StaffProfile) {
    return this.documents.listFor(ownerFor(profile));
  }

  @Post(':typeId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxMemberDocumentBytes },
    }),
  )
  upload(
    @CurrentProfile() profile: StaffProfile,
    @Param('typeId') typeId: string,
    @Body() body: { documentNumber?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documents.upload(
      profile,
      ownerFor(profile),
      typeId,
      body,
      file,
    );
  }

  @Delete(':typeId')
  remove(
    @CurrentProfile() profile: StaffProfile,
    @Param('typeId') typeId: string,
  ) {
    return this.documents.remove(profile, ownerFor(profile), typeId);
  }

  @Get(':typeId/file')
  file(
    @CurrentProfile() profile: StaffProfile,
    @Param('typeId') typeId: string,
  ) {
    return this.documents.fileUrl(ownerFor(profile), typeId);
  }
}

@Controller('superadmin/my-documents')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminDocumentsController extends StaffDocumentsController {}

@Controller('admin/my-documents')
@UseGuards(AuthGuard)
@Roles('admin')
export class AdminDocumentsController extends StaffDocumentsController {}

@Controller('accountant/my-documents')
@UseGuards(AuthGuard)
@Roles('accountant')
export class AccountantDocumentsController extends StaffDocumentsController {}
