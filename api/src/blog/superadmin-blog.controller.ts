import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { BlogService } from './blog.service';
import type { SaveBlogPostInput } from './blog.service';

@Controller('superadmin/blog')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminBlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  list() {
    return this.blog.listAll();
  }

  @Post()
  create(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: SaveBlogPostInput,
  ) {
    return this.blog.create(profile, body);
  }

  @Put(':id')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<SaveBlogPostInput>,
  ) {
    return this.blog.update(profile, id, body);
  }

  @Delete(':id')
  remove(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.blog.remove(profile, id);
  }
}
