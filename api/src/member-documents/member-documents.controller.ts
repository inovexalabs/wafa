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

@Controller('member/documents')
@UseGuards(AuthGuard)
@Roles('member')
export class MemberDocumentsController {
  constructor(private readonly documents: MemberDocumentsService) {}

  @Get()
  async list(@CurrentProfile() profile: { id: string; role: string }) {
    return this.documents.listForMember(
      await this.documents.memberIdFor(profile),
    );
  }

  @Post(':typeId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxMemberDocumentBytes },
    }),
  )
  async upload(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('typeId') typeId: string,
    @Body() body: { documentNumber?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const memberId = await this.documents.memberIdFor(profile);
    return this.documents.upload(profile, memberId, typeId, body, file);
  }

  @Delete(':typeId')
  async remove(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('typeId') typeId: string,
  ) {
    return this.documents.remove(
      profile,
      await this.documents.memberIdFor(profile),
      typeId,
    );
  }

  @Get(':typeId/file')
  async file(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('typeId') typeId: string,
  ) {
    return this.documents.fileUrl(
      await this.documents.memberIdFor(profile),
      typeId,
    );
  }
}
