import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { MemberDocumentsService } from './member-documents.service';
import type { SaveDocumentTypeInput } from './member-documents.service';

@Controller('superadmin/document-types')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminDocumentTypesController {
  constructor(private readonly documents: MemberDocumentsService) {}

  @Get()
  list() {
    return this.documents.listTypes();
  }

  @Post()
  create(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: SaveDocumentTypeInput,
  ) {
    return this.documents.createType(profile, body);
  }

  @Put(':id')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: Partial<SaveDocumentTypeInput>,
  ) {
    return this.documents.updateType(profile, id, body);
  }

  @Delete(':id')
  remove(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
  ) {
    return this.documents.removeType(profile, id);
  }
}
