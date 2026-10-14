import { Controller, Get, Header, Param, ParseUUIDPipe, Redirect } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { PublicDocumentsService } from './public-documents.service';

@Public()
@Controller('public/documents')
export class PublicDocumentsController {
  constructor(private readonly documents: PublicDocumentsService) {}

  @Get()
  list() {
    return this.documents.listPublished();
  }

  // Redirects to a one-minute signed link, only for published documents.
  @Get(':id/file')
  @Redirect()
  @Header('Cache-Control', 'no-store')
  async file(@Param('id', ParseUUIDPipe) id: string) {
    return { url: await this.documents.publishedFileUrl(id), statusCode: 302 };
  }
}
