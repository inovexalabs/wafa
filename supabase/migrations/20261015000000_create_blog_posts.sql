-- Long-form blog for the public site, managed by superadmins. Kept separate
-- from news_posts: posts have their own pages (/blog/[slug]) and blog-only
-- fields (excerpt, author byline, tags) that news and notices don't use.

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title varchar(200) not null,
  slug varchar(220) not null unique,
  excerpt varchar(300),
  body text not null,
  cover_image_url text,
  author_name varchar(120),
  tags text[] not null default '{}',
  -- New posts start as drafts so nothing goes public half-written.
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_body_length check (char_length(body) <= 50000),
  constraint blog_posts_tags_count check (cardinality(tags) <= 10)
);

create index idx_blog_posts_published on public.blog_posts(is_published, published_at desc);
create index idx_blog_posts_tags on public.blog_posts using gin(tags);

create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

-- Same lockdown as every other table (see 20261014000000): only the API's
-- service role reads or writes it.
alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from anon, authenticated;
