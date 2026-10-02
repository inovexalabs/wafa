import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { NewsService } from './news.service';
import type { SaveNewsPostInput } from './news.service';

@Controller('superadmin/news')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminNewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  list() {
    return this.news.listAll();
  }

  @Post()
  create(@CurrentProfile() profile: { id: string; role: string }, @Body() body: SaveNewsPostInput) {
    return this.news.create(profile, body);
  }

  @Put(':id')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: Partial<SaveNewsPostInput>,
  ) {
    return this.news.update(profile, id, body);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: { id: string; role: string }, @Param('id') id: string) {
    return this.news.remove(profile, id);
  }
}
