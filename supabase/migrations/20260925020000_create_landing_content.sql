create table public.landing_content (
  id smallint primary key default 1,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint landing_content_singleton check (id = 1)
);

insert into public.landing_content (id, content)
values (1, '{}'::jsonb)
on conflict (id) do nothing;
