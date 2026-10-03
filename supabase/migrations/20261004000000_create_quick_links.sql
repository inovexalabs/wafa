-- Quick links replace the team chat: superadmins and admins share organisation
-- links (forms, drives, portals) with everyone or with selected people. A link
-- with no quick_link_recipients rows is visible to everyone, mirroring how
-- meeting_notifications scopes meetings.
--
-- public.chat_messages is intentionally left in place so existing chat history
-- is not lost; drop it separately once it is no longer needed.

create table public.quick_links (
  id uuid primary key default gen_random_uuid(),
  title varchar(200) not null,
  url text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quick_links_created_at on public.quick_links(created_at desc);

create trigger trg_quick_links_updated_at
before update on public.quick_links
for each row execute function public.set_updated_at();

create table public.quick_link_recipients (
  link_id uuid not null references public.quick_links(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (link_id, profile_id)
);

create index idx_quick_link_recipients_profile on public.quick_link_recipients(profile_id);
