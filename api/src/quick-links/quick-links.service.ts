import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

type Profile = { id: string; role: string };

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  createdByName: string | null;
  createdAt: string;
  // Only returned to managers (superadmin/admin). Empty means everyone.
  recipientIds?: string[];
}

export interface SaveQuickLinkInput {
  title: string;
  url: string;
  description?: string;
  recipientIds?: string[];
}

type QuickLinkRow = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

const managerRoles = new Set(['superadmin', 'admin']);
const maxTitleLength = 200;

@Injectable()
export class QuickLinksService {
  private readonly logger = new Logger(QuickLinksService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(profile: Profile): Promise<QuickLink[]> {
    const client = this.supabase.getAdminClient();
    const [
      { data: links, error: linksError },
      { data: shares, error: sharesError },
    ] = await Promise.all([
      client
        .from('quick_links')
        .select('id, title, url, description, created_by, created_at')
        .order('created_at', { ascending: false }),
      client.from('quick_link_recipients').select('link_id, profile_id'),
    ]);
    if (linksError || sharesError) {
      this.logger.error(
        `list: ${(linksError ?? sharesError)?.message}`,
        linksError ?? sharesError,
      );
      throw new InternalServerErrorException('Unable to load quick links.');
    }

    const recipientsByLink = new Map<string, string[]>();
    for (const share of shares ?? []) {
      const ids = recipientsByLink.get(share.link_id) ?? [];
      ids.push(share.profile_id);
      recipientsByLink.set(share.link_id, ids);
    }

    const isManager = managerRoles.has(profile.role);
    const visible = (links ?? []).filter((link) => {
      if (isManager) return true;
      const recipients = recipientsByLink.get(link.id);
      return !recipients || recipients.includes(profile.id);
    });

    const names = await this.creatorNames(visible);
    return visible.map((link) => ({
      ...this.map(link, names),
      ...(isManager
        ? { recipientIds: recipientsByLink.get(link.id) ?? [] }
        : {}),
    }));
  }

  async create(
    profile: Profile,
    input: SaveQuickLinkInput,
  ): Promise<QuickLink> {
    const title = this.cleanTitle(input?.title);
    const url = this.cleanUrl(input?.url);
    const recipientIds = this.cleanRecipients(input?.recipientIds);
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('quick_links')
      .insert({
        title,
        url,
        description: input.description?.trim() || null,
        created_by: profile.id,
      })
      .select('id, title, url, description, created_by, created_at')
      .single();
    if (error) throw new BadRequestException(error.message);

    if (recipientIds.length) {
      const { error: shareError } = await client
        .from('quick_link_recipients')
        .insert(
          recipientIds.map((profileId) => ({
            link_id: data.id,
            profile_id: profileId,
          })),
        );
      if (shareError) {
        await client.from('quick_links').delete().eq('id', data.id);
        throw new BadRequestException(
          `Unable to share this link with the selected people: ${shareError.message}`,
        );
      }
    }

    const names = await this.creatorNames([data]);
    await this.notifyShared(
      profile,
      data,
      names,
      recipientIds.length ? recipientIds : await this.everyoneExcept([]),
    );

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'quick_link.created',
      entityType: 'quick_link',
      entityId: data.id,
      newData: { title, url, recipientCount: recipientIds.length },
    });

    return { ...this.map(data, names), recipientIds };
  }

  async update(
    profile: Profile,
    id: string,
    input: Partial<SaveQuickLinkInput>,
  ): Promise<QuickLink> {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = this.cleanTitle(input.title);
    if (input.url !== undefined) patch.url = this.cleanUrl(input.url);
    if (input.description !== undefined)
      patch.description = input.description?.trim() || null;

    const client = this.supabase.getAdminClient();
    const columns = 'id, title, url, description, created_by, created_at';
    const { data, error } = Object.keys(patch).length
      ? await client
          .from('quick_links')
          .update(patch)
          .eq('id', id)
          .select(columns)
          .maybeSingle()
      : await client
          .from('quick_links')
          .select(columns)
          .eq('id', id)
          .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Quick link not found.');

    const { data: previousShares, error: previousError } = await client
      .from('quick_link_recipients')
      .select('profile_id')
      .eq('link_id', id);
    if (previousError)
      throw new InternalServerErrorException(
        'Unable to load who this link is shared with.',
      );
    const previousIds = (previousShares ?? []).map(
      (share) => share.profile_id as string,
    );

    let recipientIds: string[];
    let newlyShared: string[] = [];
    if (input.recipientIds !== undefined) {
      recipientIds = this.cleanRecipients(input.recipientIds);
      // Only people who could not see the link before hear about it. A link
      // shared with everyone (no rows) was already visible to all.
      if (previousIds.length)
        newlyShared = recipientIds.length
          ? recipientIds.filter((pid) => !previousIds.includes(pid))
          : await this.everyoneExcept(previousIds);
      const { error: clearError } = await client
        .from('quick_link_recipients')
        .delete()
        .eq('link_id', id);
      if (clearError) throw new BadRequestException(clearError.message);
      if (recipientIds.length) {
        const { error: shareError } = await client
          .from('quick_link_recipients')
          .insert(
            recipientIds.map((profileId) => ({
              link_id: id,
              profile_id: profileId,
            })),
          );
        if (shareError) throw new BadRequestException(shareError.message);
      }
    } else {
      recipientIds = previousIds;
    }

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'quick_link.updated',
      entityType: 'quick_link',
      entityId: id,
      newData: {
        ...patch,
        ...(input.recipientIds !== undefined
          ? { recipientCount: recipientIds.length }
          : {}),
      },
    });

    const names = await this.creatorNames([data]);
    await this.notifyShared(profile, data, names, newlyShared);
    return { ...this.map(data, names), recipientIds };
  }

  async remove(profile: Profile, id: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('quick_links')
      .delete()
      .eq('id', id)
      .select('id, title')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Quick link not found.');

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'quick_link.deleted',
      entityType: 'quick_link',
      entityId: id,
      oldData: { title: data.title },
    });

    return { success: true };
  }

  private cleanTitle(value?: string) {
    const title = value?.trim();
    if (!title) throw new BadRequestException('Title is required.');
    if (title.length > maxTitleLength)
      throw new BadRequestException(
        `Title must be ${maxTitleLength} characters or fewer.`,
      );
    return title;
  }

  // Only http(s) URLs are stored so a shared link can never be a javascript: or
  // data: URL rendered as an href. A bare domain is treated as https.
  private cleanUrl(value?: string) {
    const raw = value?.trim();
    if (!raw) throw new BadRequestException('URL is required.');
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw)
      ? raw
      : `https://${raw}`;
    let parsed: URL;
    try {
      parsed = new URL(withScheme);
    } catch {
      throw new BadRequestException(
        'Enter a valid URL, e.g. https://example.com.',
      );
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      throw new BadRequestException('Only http and https links can be shared.');
    return parsed.toString();
  }

  // Sends the in-app notification and email (with a button straight to the
  // link) to everyone the link was just shared with, except whoever shared it.
  private async notifyShared(
    actor: Profile,
    link: QuickLinkRow,
    names: Map<string, string>,
    recipientIds: string[],
  ) {
    const targets = recipientIds.filter((pid) => pid !== actor.id);
    if (!targets.length) return;
    const sharer = names.get(actor.id) ?? 'An administrator';
    const description = link.description ? ` ${link.description}` : '';
    try {
      await this.notifications.notifyRecipients(targets, {
        type: 'system',
        title: `New quick link: ${link.title}`,
        message: `${sharer} shared "${link.title}" with you.${description} You can also find it under Quick links in the WAFA app.`,
        referenceType: 'quick_link',
        referenceId: link.id,
        actionUrl: link.url,
        actionLabel: 'Open link',
        secondaryUrl: process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim(),
        secondaryLabel: 'Open WAFA',
      });
    } catch (error) {
      // Notification delivery is best-effort and should never block sharing a link.
      this.logger.warn(
        `notifyShared: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  // "Everyone" is resolved to explicit ids so the sharer can be left out.
  private async everyoneExcept(excludedIds: string[]) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('id');
    if (error) {
      this.logger.warn(`everyoneExcept: ${error.message}`);
      return [];
    }
    return (data ?? [])
      .map((row) => row.id as string)
      .filter((pid) => !excludedIds.includes(pid));
  }

  private cleanRecipients(ids?: string[]) {
    return Array.from(new Set(ids ?? [])).filter(Boolean);
  }

  private async creatorNames(rows: Pick<QuickLinkRow, 'created_by'>[]) {
    const ids = Array.from(
      new Set(
        rows.map((row) => row.created_by).filter((id): id is string => !!id),
      ),
    );
    const names = new Map<string, string>();
    if (!ids.length) return names;
    const { data } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ids);
    for (const row of data ?? []) names.set(row.id, row.full_name || row.email);
    return names;
  }

  private map(row: QuickLinkRow, names: Map<string, string>): QuickLink {
    return {
      id: row.id,
      title: row.title,
      url: row.url,
      description: row.description,
      createdByName: row.created_by
        ? (names.get(row.created_by) ?? null)
        : null,
      createdAt: row.created_at,
    };
  }
}
