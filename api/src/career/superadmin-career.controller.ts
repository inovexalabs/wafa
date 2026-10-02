import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentProfile } from '../auth/current-profile.decorator';
import { Roles } from '../auth/roles.decorator';
import { CareerService } from './career.service';
import type { SaveCareerOpeningInput } from './career.service';

@Controller('superadmin/career')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminCareerController {
  constructor(private readonly career: CareerService) {}

  @Get()
  list() {
    return this.career.listAll();
  }

  @Post()
  create(@CurrentProfile() profile: { id: string; role: string }, @Body() body: SaveCareerOpeningInput) {
    return this.career.create(profile, body);
  }

  @Put(':id')
  update(
    @CurrentProfile() profile: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: Partial<SaveCareerOpeningInput>,
  ) {
    return this.career.update(profile, id, body);
  }

  @Delete(':id')
  remove(@CurrentProfile() profile: { id: string; role: string }, @Param('id') id: string) {
    return this.career.remove(profile, id);
  }
}
