import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { MembersService } from './members.service';

@Controller('admin/members')
@UseGuards(AuthGuard)
@Roles('admin')
export class AdminMembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list() {
    return this.members.listActive();
  }
}
