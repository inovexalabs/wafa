-- Group chat: every profile (any role) can post to and read a single shared room.
-- Accessed only through the NestJS API via the Supabase service-role key, so RLS
-- policies are intentionally omitted here, matching the rest of this schema.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),

  sender_id uuid not null
    references public.profiles(id)
    on delete cascade,

  content text not null,

  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_created_at
  on public.chat_messages (created_at);

alter table public.chat_messages enable row level security;
