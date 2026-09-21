import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from './audit.service';

type AuditQuery = {
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  limit?: string;
  offset?: string;
};

@Controller('superadmin/audit-logs')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class SuperadminAuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: AuditQuery) {
    return this.audit.list({
      actorUserId: query.actorId,
      action: query.action,
      entityType: query.entityType,
      from: query.from,
      to: query.to,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined,
    });
  }
}
