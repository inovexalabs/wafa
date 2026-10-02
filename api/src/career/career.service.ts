import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';

type Profile = { id: string; role: string };

export interface CareerOpening {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  employmentType: string | null;
  applyEmail: string | null;
  applyUrl: string | null;
  isOpen: boolean;
  postedAt: string;
}

export interface SaveCareerOpeningInput {
  title: string;
  description?: string;
  location?: string;
  employmentType?: string;
  applyEmail?: string;
  applyUrl?: string;
  isOpen?: boolean;
  postedAt?: string;
}

@Injectable()
export class CareerService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async listOpen(): Promise<CareerOpening[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('career_openings')
      .select('*')
      .eq('is_open', true)
      .order('posted_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Unable to load career openings.');
    return (data ?? []).map(this.map);
  }

  async listAll(): Promise<CareerOpening[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('career_openings')
      .select('*')
      .order('posted_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Unable to load career openings.');
    return (data ?? []).map(this.map);
  }

  async create(profile: Profile, input: SaveCareerOpeningInput) {
    if (!input?.title?.trim()) throw new BadRequestException('Title is required.');

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('career_openings')
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        location: input.location?.trim() || null,
        employment_type: input.employmentType?.trim() || null,
        apply_email: input.applyEmail?.trim() || null,
        apply_url: input.applyUrl?.trim() || null,
        is_open: input.isOpen ?? true,
        posted_at: input.postedAt ?? new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'career_openings.created',
      entityType: 'career_openings',
      entityId: data.id,
      newData: { title: input.title },
    });

    return this.map(data);
  }

  async update(profile: Profile, id: string, input: Partial<SaveCareerOpeningInput>) {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) {
      if (!input.title.trim()) throw new BadRequestException('Title is required.');
      patch.title = input.title.trim();
    }
    if (input.description !== undefined) patch.description = input.description?.trim() || null;
    if (input.location !== undefined) patch.location = input.location?.trim() || null;
    if (input.employmentType !== undefined) patch.employment_type = input.employmentType?.trim() || null;
    if (input.applyEmail !== undefined) patch.apply_email = input.applyEmail?.trim() || null;
    if (input.applyUrl !== undefined) patch.apply_url = input.applyUrl?.trim() || null;
    if (input.isOpen !== undefined) patch.is_open = input.isOpen;
    if (input.postedAt !== undefined) patch.posted_at = input.postedAt;

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('career_openings')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Record not found.');

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'career_openings.updated',
      entityType: 'career_openings',
      entityId: id,
      newData: patch,
    });

    return this.map(data);
  }

  async remove(profile: Profile, id: string) {
    const { error } = await this.supabase.getAdminClient().from('career_openings').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'career_openings.deleted',
      entityType: 'career_openings',
      entityId: id,
    });

    return { success: true };
  }

  private map(row: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    employment_type: string | null;
    apply_email: string | null;
    apply_url: string | null;
    is_open: boolean;
    posted_at: string;
  }): CareerOpening {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      employmentType: row.employment_type,
      applyEmail: row.apply_email,
      applyUrl: row.apply_url,
      isOpen: row.is_open,
      postedAt: row.posted_at,
    };
  }
}
