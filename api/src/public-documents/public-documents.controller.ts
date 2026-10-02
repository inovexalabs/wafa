import { Controller, Get } from '@nestjs/common';
import { PublicDocumentsService } from './public-documents.service';

@Controller('public/documents')
export class PublicDocumentsController {
  constructor(private readonly documents: PublicDocumentsService) {}

  @Get()
  list() {
    return this.documents.listPublished();
  }
}
