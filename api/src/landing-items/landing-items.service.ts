import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';

type Profile = { id: string; role: string };
export type LandingItemKind = 'partner' | 'investment' | 'gallery';

export interface LandingItem {
  id: string;
  kind: LandingItemKind;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface SaveLandingItemInput {
  kind: LandingItemKind;
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

const validKinds = new Set(['partner', 'investment', 'gallery']);

@Injectable()
export class LandingItemsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async listPublished(kind: LandingItemKind): Promise<LandingItem[]> {
    if (!validKinds.has(kind)) throw new BadRequestException('Invalid kind.');
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('landing_items')
      .select('*')
      .eq('kind', kind)
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    if (error) throw new InternalServerErrorException('Unable to load content.');
    return (data ?? []).map(this.map);
  }

  async listAll(kind?: LandingItemKind): Promise<LandingItem[]> {
    let query = this.supabase
      .getAdminClient()
      .from('landing_items')
      .select('*')
      .order('sort_order', { ascending: true });
    if (kind) {
      if (!validKinds.has(kind)) throw new BadRequestException('Invalid kind.');
      query = query.eq('kind', kind);
    }
    const { data, error } = await query;
    if (error) throw new InternalServerErrorException('Unable to load content.');
    return (data ?? []).map(this.map);
  }

  async create(profile: Profile, input: SaveLandingItemInput) {
    if (!validKinds.has(input?.kind)) throw new BadRequestException('A valid kind is required.');

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('landing_items')
      .insert({
        kind: input.kind,
        title: input.title?.trim() || null,
        description: input.description?.trim() || null,
        image_url: input.imageUrl?.trim() || null,
        link_url: input.linkUrl?.trim() || null,
        sort_order: input.sortOrder ?? 0,
        is_published: input.isPublished ?? true,
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'landing_items.created',
      entityType: 'landing_items',
      entityId: data.id,
      newData: { kind: input.kind, title: input.title },
    });

    return this.map(data);
  }

  async update(profile: Profile, id: string, input: Partial<SaveLandingItemInput>) {
    const patch: Record<string, unknown> = {};
    if (input.kind !== undefined) {
      if (!validKinds.has(input.kind)) throw new BadRequestException('Invalid kind.');
      patch.kind = input.kind;
    }
    if (input.title !== undefined) patch.title = input.title?.trim() || null;
    if (input.description !== undefined) patch.description = input.description?.trim() || null;
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl?.trim() || null;
    if (input.linkUrl !== undefined) patch.link_url = input.linkUrl?.trim() || null;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
    if (input.isPublished !== undefined) patch.is_published = input.isPublished;

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('landing_items')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Record not found.');

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'landing_items.updated',
      entityType: 'landing_items',
      entityId: id,
      newData: patch,
    });

    return this.map(data);
  }

  async remove(profile: Profile, id: string) {
    const { error } = await this.supabase.getAdminClient().from('landing_items').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'landing_items.deleted',
      entityType: 'landing_items',
      entityId: id,
    });

    return { success: true };
  }

  private map(row: {
    id: string;
    kind: string;
    title: string | null;
    description: string | null;
    image_url: string | null;
    link_url: string | null;
    sort_order: number;
    is_published: boolean;
  }): LandingItem {
    return {
      id: row.id,
      kind: row.kind as LandingItemKind,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      linkUrl: row.link_url,
      sortOrder: row.sort_order,
      isPublished: row.is_published,
    };
  }
}
