import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { BlogService } from './blog.service';

@Public()
@Controller('public/blog')
export class PublicBlogController {
  constructor(private readonly blog: BlogService) {}

  // Published posts whose publish date has arrived, newest first, without bodies.
  @Get()
  list(@Query('tag') tag?: string) {
    return this.blog.listPublished(tag);
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.blog.getPublishedBySlug(slug);
  }
}
