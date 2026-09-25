alter table public.meetings
  add column if not exists join_link_notified_at timestamptz;
