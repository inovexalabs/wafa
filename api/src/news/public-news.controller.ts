import { Controller, Get, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import type { NewsCategory } from './news.service';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('public/news')
export class PublicNewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  list(@Query('category') category?: NewsCategory) {
    return this.news.listPublished(category);
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.news.getBySlug(slug);
  }
}
