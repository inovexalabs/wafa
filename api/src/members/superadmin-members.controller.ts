import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { MembersService } from './members.service';

@Controller('superadmin/members')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminMembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list() {
    return this.members.listActive();
  }
}
