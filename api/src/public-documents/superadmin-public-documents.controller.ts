import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { PublicDocumentsService } from './public-documents.service';
import type { SaveDocumentMetaInput } from './public-documents.service';

@Controller('superadmin/documents')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminPublicDocumentsController {
  constructor(private readonly documents: PublicDocumentsService) {}

  @Get()
  list() {
    return this.documents.listAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  upload(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: SaveDocumentMetaInput,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documents.upload(profile, body, file);
  }

  @Put(':id')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: Partial<SaveDocumentMetaInput>,
  ) {
    return this.documents.update(profile, id, body);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: { id: string; role: string }, @Param('id') id: string) {
    return this.documents.remove(profile, id);
  }
}
