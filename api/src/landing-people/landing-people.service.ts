import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';

type Profile = { id: string; role: string };
export type LandingPersonKind = 'team' | 'board';

export interface LandingPerson {
  id: string;
  kind: LandingPersonKind;
  name: string;
  title: string | null;
  photoUrl: string | null;
  bio: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface SaveLandingPersonInput {
  kind: LandingPersonKind;
  name: string;
  title?: string;
  photoUrl?: string;
  bio?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

const validKinds = new Set(['team', 'board']);

@Injectable()
export class LandingPeopleService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async listPublished(kind: LandingPersonKind): Promise<LandingPerson[]> {
    if (!validKinds.has(kind)) throw new BadRequestException('Invalid kind.');
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('landing_people')
      .select('*')
      .eq('kind', kind)
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    if (error) throw new InternalServerErrorException('Unable to load content.');
    return (data ?? []).map(this.map);
  }

  async listAll(kind?: LandingPersonKind): Promise<LandingPerson[]> {
    let query = this.supabase
      .getAdminClient()
      .from('landing_people')
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

  async create(profile: Profile, input: SaveLandingPersonInput) {
    if (!validKinds.has(input?.kind)) throw new BadRequestException('A valid kind is required.');
    if (!input?.name?.trim()) throw new BadRequestException('Name is required.');

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('landing_people')
      .insert({
        kind: input.kind,
        name: input.name.trim(),
        title: input.title?.trim() || null,
        photo_url: input.photoUrl?.trim() || null,
        bio: input.bio?.trim() || null,
        sort_order: input.sortOrder ?? 0,
        is_published: input.isPublished ?? true,
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'landing_people.created',
      entityType: 'landing_people',
      entityId: data.id,
      newData: { kind: input.kind, name: input.name },
    });

    return this.map(data);
  }

  async update(profile: Profile, id: string, input: Partial<SaveLandingPersonInput>) {
    const patch: Record<string, unknown> = {};
    if (input.kind !== undefined) {
      if (!validKinds.has(input.kind)) throw new BadRequestException('Invalid kind.');
      patch.kind = input.kind;
    }
    if (input.name !== undefined) {
      if (!input.name.trim()) throw new BadRequestException('Name is required.');
      patch.name = input.name.trim();
    }
    if (input.title !== undefined) patch.title = input.title?.trim() || null;
    if (input.photoUrl !== undefined) patch.photo_url = input.photoUrl?.trim() || null;
    if (input.bio !== undefined) patch.bio = input.bio?.trim() || null;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
    if (input.isPublished !== undefined) patch.is_published = input.isPublished;

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('landing_people')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Record not found.');

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'landing_people.updated',
      entityType: 'landing_people',
      entityId: id,
      newData: patch,
    });

    return this.map(data);
  }

  async remove(profile: Profile, id: string) {
    const { error } = await this.supabase.getAdminClient().from('landing_people').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'landing_people.deleted',
      entityType: 'landing_people',
      entityId: id,
    });

    return { success: true };
  }

  private map(row: {
    id: string;
    kind: string;
    name: string;
    title: string | null;
    photo_url: string | null;
    bio: string | null;
    sort_order: number;
    is_published: boolean;
  }): LandingPerson {
    return {
      id: row.id,
      kind: row.kind as LandingPersonKind,
      name: row.name,
      title: row.title,
      photoUrl: row.photo_url,
      bio: row.bio,
      sortOrder: row.sort_order,
      isPublished: row.is_published,
    };
  }
}
