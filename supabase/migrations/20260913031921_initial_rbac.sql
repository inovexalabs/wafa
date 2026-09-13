create type public.app_role as enum ('superadmin', 'admin', 'member', 'accountant');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_id text not null unique check (char_length(user_id) between 3 and 64),
  email text not null unique,
  role public.app_role not null default 'member',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_one_superadmin_idx
  on public.profiles (role)
  where role = 'superadmin';

create index profiles_role_idx on public.profiles (role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

