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
import { QuickLinksService } from './quick-links.service';
import type { SaveQuickLinkInput } from './quick-links.service';

@Controller('quick-links')
@UseGuards(AuthGuard)
@Roles('superadmin', 'admin', 'accountant', 'member')
export class QuickLinksController {
  constructor(private readonly quickLinks: QuickLinksService) {}

  @Get()
  list(@CurrentProfile() profile: { id: string; role: string }) {
    return this.quickLinks.list(profile);
  }

  @Post()
  @Roles('superadmin', 'admin')
  create(
    @CurrentProfile() profile: { id: string; role: string },
    @Body() body: SaveQuickLinkInput,
  ) {
    return this.quickLinks.create(profile, body);
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: Partial<SaveQuickLinkInput>,
  ) {
    return this.quickLinks.update(profile, id, body);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  remove(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
  ) {
    return this.quickLinks.remove(profile, id);
  }
}
