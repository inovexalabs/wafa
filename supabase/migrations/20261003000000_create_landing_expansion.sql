-- Landing page expansion: team/board, partners/investments/gallery, news & notices,
-- career openings, and public documents. Content lists use a discriminant "kind"/
-- "category" column (mirrors the existing media.media_type / documents.visibility
-- pattern) instead of one table per nav item.

create table public.landing_people (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('team', 'board')),
  name varchar(200) not null,
  title varchar(200),
  photo_url text,
  bio text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_landing_people_kind on public.landing_people(kind, sort_order);

create trigger trg_landing_people_updated_at
before update on public.landing_people
for each row execute function public.set_updated_at();

create table public.landing_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('partner', 'investment', 'gallery')),
  title varchar(200),
  description text,
  image_url text,
  link_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_landing_items_kind on public.landing_items(kind, sort_order);

create trigger trg_landing_items_updated_at
before update on public.landing_items
for each row execute function public.set_updated_at();

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('news', 'notice')),
  title varchar(200) not null,
  slug varchar(220) not null unique,
  body text not null,
  cover_image_url text,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_news_posts_category on public.news_posts(category, published_at desc);

create trigger trg_news_posts_updated_at
before update on public.news_posts
for each row execute function public.set_updated_at();

create table public.career_openings (
  id uuid primary key default gen_random_uuid(),
  title varchar(200) not null,
  description text,
  location varchar(200),
  employment_type varchar(100),
  apply_email text,
  apply_url text,
  is_open boolean not null default true,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_career_openings_open on public.career_openings(is_open, posted_at desc);

create trigger trg_career_openings_updated_at
before update on public.career_openings
for each row execute function public.set_updated_at();

create table public.public_documents (
  id uuid primary key default gen_random_uuid(),
  title varchar(200) not null,
  description text,
  file_key text not null,
  original_filename text not null,
  mime_type varchar(150) not null,
  file_size bigint not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_documents_file_size_positive check (file_size > 0)
);

create index idx_public_documents_published on public.public_documents(is_published, sort_order);

create trigger trg_public_documents_updated_at
before update on public.public_documents
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('landing-media', 'landing-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('landing-documents', 'landing-documents', true)
on conflict (id) do nothing;
