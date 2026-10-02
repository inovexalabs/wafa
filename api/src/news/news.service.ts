import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';

type Profile = { id: string; role: string };
export type NewsCategory = 'news' | 'notice';

export interface NewsPost {
  id: string;
  category: NewsCategory;
  title: string;
  slug: string;
  body: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string;
}

export interface SaveNewsPostInput {
  category: NewsCategory;
  title: string;
  slug?: string;
  body: string;
  coverImageUrl?: string;
  isPublished?: boolean;
  publishedAt?: string;
}

const validCategories = new Set(['news', 'notice']);

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

@Injectable()
export class NewsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async listPublished(category?: NewsCategory): Promise<NewsPost[]> {
    let query = this.supabase
      .getAdminClient()
      .from('news_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (category) {
      if (!validCategories.has(category)) throw new BadRequestException('Invalid category.');
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw new InternalServerErrorException('Unable to load news.');
    return (data ?? []).map(this.map);
  }

  async getBySlug(slug: string): Promise<NewsPost> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('news_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw new InternalServerErrorException('Unable to load this post.');
    if (!data) throw new NotFoundException('Post not found.');
    return this.map(data);
  }

  async listAll(): Promise<NewsPost[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('news_posts')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Unable to load news.');
    return (data ?? []).map(this.map);
  }

  async create(profile: Profile, input: SaveNewsPostInput) {
    if (!validCategories.has(input?.category)) throw new BadRequestException('A valid category is required.');
    if (!input?.title?.trim()) throw new BadRequestException('Title is required.');
    if (!input?.body?.trim()) throw new BadRequestException('Body is required.');

    const baseSlug = slugify(input.slug || input.title);
    if (!baseSlug) throw new BadRequestException('Unable to derive a slug from the title.');
    const slug = await this.uniqueSlug(baseSlug);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('news_posts')
      .insert({
        category: input.category,
        title: input.title.trim(),
        slug,
        body: input.body.trim(),
        cover_image_url: input.coverImageUrl?.trim() || null,
        is_published: input.isPublished ?? true,
        published_at: input.publishedAt ?? new Date().toISOString(),
        author_id: profile.id,
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'news_posts.created',
      entityType: 'news_posts',
      entityId: data.id,
      newData: { category: input.category, title: input.title },
    });

    return this.map(data);
  }

  async update(profile: Profile, id: string, input: Partial<SaveNewsPostInput>) {
    const patch: Record<string, unknown> = {};
    if (input.category !== undefined) {
      if (!validCategories.has(input.category)) throw new BadRequestException('Invalid category.');
      patch.category = input.category;
    }
    if (input.title !== undefined) {
      if (!input.title.trim()) throw new BadRequestException('Title is required.');
      patch.title = input.title.trim();
    }
    if (input.slug !== undefined) {
      const baseSlug = slugify(input.slug);
      if (!baseSlug) throw new BadRequestException('Invalid slug.');
      patch.slug = await this.uniqueSlug(baseSlug, id);
    }
    if (input.body !== undefined) {
      if (!input.body.trim()) throw new BadRequestException('Body is required.');
      patch.body = input.body.trim();
    }
    if (input.coverImageUrl !== undefined) patch.cover_image_url = input.coverImageUrl?.trim() || null;
    if (input.isPublished !== undefined) patch.is_published = input.isPublished;
    if (input.publishedAt !== undefined) patch.published_at = input.publishedAt;

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('news_posts')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Record not found.');

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'news_posts.updated',
      entityType: 'news_posts',
      entityId: id,
      newData: patch,
    });

    return this.map(data);
  }

  async remove(profile: Profile, id: string) {
    const { error } = await this.supabase.getAdminClient().from('news_posts').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'news_posts.deleted',
      entityType: 'news_posts',
      entityId: id,
    });

    return { success: true };
  }

  private async uniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    const client = this.supabase.getAdminClient();
    let candidate = baseSlug;
    let suffix = 1;
    // Small bounded loop: collision is rare, and titles are short, so this never runs long.
    while (true) {
      let query = client.from('news_posts').select('id').eq('slug', candidate);
      if (excludeId) query = query.neq('id', excludeId);
      const { data, error } = await query.maybeSingle();
      if (error) throw new InternalServerErrorException('Unable to validate the slug.');
      if (!data) return candidate;
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  private map(row: {
    id: string;
    category: string;
    title: string;
    slug: string;
    body: string;
    cover_image_url: string | null;
    is_published: boolean;
    published_at: string;
  }): NewsPost {
    return {
      id: row.id,
      category: row.category as NewsCategory,
      title: row.title,
      slug: row.slug,
      body: row.body,
      coverImageUrl: row.cover_image_url,
      isPublished: row.is_published,
      publishedAt: row.published_at,
    };
  }
}
