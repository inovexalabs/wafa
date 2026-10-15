import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';
import { cleanOptionalHttpUrl } from '../safe-url';
import { slugify } from '../slug';

type Profile = { id: string; role: string };

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  authorName: string | null;
  tags: string[];
  readingMinutes: number;
  isPublished: boolean;
  publishedAt: string;
  updatedAt: string;
}

export interface BlogPost extends BlogPostSummary {
  body: string;
}

export interface SaveBlogPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  coverImageUrl?: string;
  authorName?: string;
  tags?: string[] | string;
  isPublished?: boolean;
  publishedAt?: string;
}

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  author_name: string | null;
  tags: string[] | null;
  is_published: boolean;
  published_at: string;
  updated_at: string;
};

const LIMITS = {
  title: 200,
  excerpt: 300,
  body: 50_000,
  authorName: 120,
  tag: 40,
  tags: 10,
};
const summaryColumns =
  'id, title, slug, excerpt, body, cover_image_url, author_name, tags, is_published, published_at, updated_at';

// Markdown-lite source -> plain text, for auto excerpts and word counts.
function plainText(body: string) {
  return body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function autoExcerpt(body: string, length = 200) {
  const text = plainText(body);
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

function readingMinutes(body: string) {
  const words = plainText(body).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

@Injectable()
export class BlogService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async listPublished(tag?: string): Promise<BlogPostSummary[]> {
    let query = this.supabase
      .getAdminClient()
      .from('blog_posts')
      .select(summaryColumns)
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });
    if (tag) query = query.contains('tags', [this.cleanTag(tag)]);
    const { data, error } = await query;
    if (error)
      throw new InternalServerErrorException('Unable to load blog posts.');
    return (data ?? []).map((row) => this.summary(row));
  }

  async getPublishedBySlug(slug: string): Promise<BlogPost> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('blog_posts')
      .select(summaryColumns)
      .eq('slug', slug)
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException('Unable to load this post.');
    if (!data) throw new NotFoundException('Post not found.');
    return this.full(data);
  }

  async listAll(): Promise<BlogPost[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('blog_posts')
      .select(summaryColumns)
      .order('published_at', { ascending: false });
    if (error)
      throw new InternalServerErrorException('Unable to load blog posts.');
    return (data ?? []).map((row) => this.forEditor(row));
  }

  async create(profile: Profile, input: SaveBlogPostInput) {
    const title = this.cleanTitle(input?.title);
    const body = this.cleanBody(input?.body);
    const baseSlug = slugify(input.slug || title);
    if (!baseSlug)
      throw new BadRequestException('Unable to derive a slug from the title.');

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('blog_posts')
      .insert({
        title,
        slug: await this.uniqueSlug(baseSlug),
        excerpt: this.cleanOptional(input.excerpt, LIMITS.excerpt, 'Excerpt'),
        body,
        cover_image_url: cleanOptionalHttpUrl(
          input.coverImageUrl,
          'Cover image URL',
        ),
        author_name: this.cleanOptional(
          input.authorName,
          LIMITS.authorName,
          'Author name',
        ),
        tags: this.cleanTags(input.tags),
        is_published: input.isPublished === true,
        published_at:
          this.cleanDate(input.publishedAt) ?? new Date().toISOString(),
        author_id: profile.id,
      })
      .select(summaryColumns)
      .single();
    if (error) throw new BadRequestException('Unable to save this post.');

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'blog_posts.created',
      entityType: 'blog_posts',
      entityId: data.id,
      newData: { title, slug: data.slug, isPublished: data.is_published },
    });

    return this.forEditor(data);
  }

  async update(
    profile: Profile,
    id: string,
    input: Partial<SaveBlogPostInput>,
  ) {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = this.cleanTitle(input.title);
    if (input.slug !== undefined) {
      const baseSlug = slugify(input.slug);
      if (!baseSlug) throw new BadRequestException('Invalid slug.');
      patch.slug = await this.uniqueSlug(baseSlug, id);
    }
    if (input.excerpt !== undefined)
      patch.excerpt = this.cleanOptional(
        input.excerpt,
        LIMITS.excerpt,
        'Excerpt',
      );
    if (input.body !== undefined) patch.body = this.cleanBody(input.body);
    if (input.coverImageUrl !== undefined)
      patch.cover_image_url = cleanOptionalHttpUrl(
        input.coverImageUrl,
        'Cover image URL',
      );
    if (input.authorName !== undefined)
      patch.author_name = this.cleanOptional(
        input.authorName,
        LIMITS.authorName,
        'Author name',
      );
    if (input.tags !== undefined) patch.tags = this.cleanTags(input.tags);
    if (input.isPublished !== undefined)
      patch.is_published = input.isPublished === true;
    if (input.publishedAt !== undefined) {
      const publishedAt = this.cleanDate(input.publishedAt);
      if (publishedAt) patch.published_at = publishedAt;
    }
    if (!Object.keys(patch).length)
      throw new BadRequestException('Nothing to update.');

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('blog_posts')
      .update(patch)
      .eq('id', id)
      .select(summaryColumns)
      .maybeSingle();
    if (error) throw new BadRequestException('Unable to save this post.');
    if (!data) throw new NotFoundException('Post not found.');

    // The body can be long; log which fields changed rather than their contents.
    await this.audit.log({
      actor: { userId: profile.id },
      action: 'blog_posts.updated',
      entityType: 'blog_posts',
      entityId: id,
      newData: {
        fields: Object.keys(patch),
        ...(patch.title ? { title: patch.title } : {}),
        ...(patch.is_published !== undefined
          ? { isPublished: patch.is_published }
          : {}),
      },
    });

    return this.forEditor(data);
  }

  async remove(profile: Profile, id: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .select('id, title')
      .maybeSingle();
    if (error) throw new BadRequestException('Unable to delete this post.');
    if (!data) throw new NotFoundException('Post not found.');

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'blog_posts.deleted',
      entityType: 'blog_posts',
      entityId: id,
      oldData: { title: data.title },
    });

    return { success: true };
  }

  // ---------- helpers ----------

  private async uniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    const client = this.supabase.getAdminClient();
    for (let suffix = 1; suffix < 50; suffix++) {
      const candidate = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
      let query = client.from('blog_posts').select('id').eq('slug', candidate);
      if (excludeId) query = query.neq('id', excludeId);
      const { data, error } = await query.maybeSingle();
      if (error)
        throw new InternalServerErrorException('Unable to validate the slug.');
      if (!data) return candidate;
    }
    throw new BadRequestException('Choose a different slug.');
  }

  private cleanTitle(value: unknown) {
    const title = typeof value === 'string' ? value.trim() : '';
    if (!title) throw new BadRequestException('Title is required.');
    if (title.length > LIMITS.title)
      throw new BadRequestException(
        `Title must be ${LIMITS.title} characters or fewer.`,
      );
    return title;
  }

  private cleanBody(value: unknown) {
    const body = typeof value === 'string' ? value.trim() : '';
    if (!body) throw new BadRequestException('Body is required.');
    if (body.length > LIMITS.body)
      throw new BadRequestException(
        `Body must be ${LIMITS.body.toLocaleString()} characters or fewer.`,
      );
    return body;
  }

  private cleanOptional(value: unknown, max: number, label: string) {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string')
      throw new BadRequestException(`${label} must be text.`);
    const text = value.trim();
    if (text.length > max)
      throw new BadRequestException(
        `${label} must be ${max} characters or fewer.`,
      );
    return text || null;
  }

  private cleanDate(value: unknown) {
    if (value === undefined || value === null || value === '') return null;
    const date = typeof value === 'string' ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime()))
      throw new BadRequestException('Publish date is not a valid date.');
    return date.toISOString();
  }

  private cleanTag(value: string) {
    const tag = value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!tag || tag.length > LIMITS.tag || !/^[\p{L}\p{N} -]+$/u.test(tag))
      throw new BadRequestException(
        `Tags may use letters, numbers, spaces and dashes, up to ${LIMITS.tag} characters.`,
      );
    return tag;
  }

  private cleanTags(value: unknown): string[] {
    if (value === undefined || value === null || value === '') return [];
    const raw = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',')
        : null;
    if (!raw || raw.some((tag) => typeof tag !== 'string'))
      throw new BadRequestException('Tags must be a list of words.');
    const tags = Array.from(
      new Set(
        (raw as string[])
          .filter((tag) => tag.trim())
          .map((tag) => this.cleanTag(tag)),
      ),
    );
    if (tags.length > LIMITS.tags)
      throw new BadRequestException(`Use at most ${LIMITS.tags} tags.`);
    return tags;
  }

  private summary(row: BlogRow): BlogPostSummary {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt || autoExcerpt(row.body),
      coverImageUrl: row.cover_image_url,
      authorName: row.author_name,
      tags: row.tags ?? [],
      readingMinutes: readingMinutes(row.body),
      isPublished: row.is_published,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
    };
  }

  private full(row: BlogRow): BlogPost {
    return { ...this.summary(row), body: row.body };
  }

  // The editor gets the excerpt exactly as saved (empty = auto), not the
  // generated fallback, so re-saving a post doesn't freeze an auto excerpt.
  private forEditor(row: BlogRow): BlogPost {
    return { ...this.full(row), excerpt: row.excerpt ?? '' };
  }
}
