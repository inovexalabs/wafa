-- Notifications can now target any profile (superadmin/admin/accountant/member),
-- not just members. Replace notifications.member_id (FK to members) with
-- profile_id (FK to profiles), backfilling from the existing member links.

alter table public.notifications
  add column profile_id uuid references public.profiles(id) on delete cascade;

update public.notifications n
set profile_id = m.auth_user_id
from public.members m
where n.member_id = m.id;

alter table public.notifications
  alter column profile_id set not null;

alter table public.notifications
  drop column member_id;

create index if not exists idx_notifications_profile_created
  on public.notifications (profile_id, created_at desc);

create index if not exists idx_notifications_profile_unread
  on public.notifications (profile_id, read_at);
