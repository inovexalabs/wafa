import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

export type AuditActor = { userId?: string | null; memberId?: string | null };

export type AuditEntry = {
  actor?: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditListFilters = {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async log(entry: AuditEntry) {
    try {
      const { error } = await this.supabase
        .getAdminClient()
        .from('audit_logs')
        .insert({
          actor_user_id: entry.actor?.userId ?? null,
          actor_member_id: entry.actor?.memberId ?? null,
          action: entry.action,
          entity_type: entry.entityType,
          entity_id: entry.entityId ?? null,
          old_data: entry.oldData ?? null,
          new_data: entry.newData ?? null,
          ip_address: entry.ipAddress || null,
          user_agent: entry.userAgent ?? null,
        });
      if (error)
        this.logger.error(
          `Failed to write audit log for action "${entry.action}": ${error.message}`,
        );
    } catch (writeError) {
      this.logger.error(
        `Failed to write audit log for action "${entry.action}"`,
        writeError instanceof Error ? writeError.stack : undefined,
      );
    }
  }

  async list(filters: AuditListFilters) {
    const client = this.supabase.getAdminClient();
    const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
    const offset = Math.max(filters.offset ?? 0, 0);

    let query = client
      .from('audit_logs')
      .select(
        'id, actor_user_id, actor_member_id, action, entity_type, entity_id, old_data, new_data, ip_address, created_at',
        { count: 'exact' },
      );

    if (filters.actorUserId)
      query = query.eq('actor_user_id', filters.actorUserId);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.from) query = query.gte('created_at', filters.from);
    if (filters.to) query = query.lte('created_at', filters.to);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error)
      throw new InternalServerErrorException('Unable to load audit logs.');

    const items = data ?? [];
    const actorIds = Array.from(
      new Set(
        items
          .map((item) => item.actor_user_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    let actorsById = new Map<
      string,
      { full_name: string | null; email: string; role: string }
    >();
    if (actorIds.length) {
      const { data: profiles } = await client
        .from('profiles')
        .select('id, full_name, email, role')
        .in('id', actorIds);
      actorsById = new Map(
        (profiles ?? []).map((row) => [
          row.id,
          { full_name: row.full_name, email: row.email, role: row.role },
        ]),
      );
    }

    return {
      items: items.map((item) => {
        const actor = item.actor_user_id
          ? actorsById.get(item.actor_user_id)
          : undefined;
        return {
          ...item,
          actor_full_name: actor?.full_name ?? null,
          actor_email: actor?.email ?? null,
          actor_role: actor?.role ?? null,
        };
      }),
      total: count ?? 0,
    };
  }
}
