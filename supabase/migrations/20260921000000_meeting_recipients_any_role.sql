-- Meeting recipients can now be any profile (superadmin/admin/accountant/member),
-- not just members. Replace meeting_notifications.member_id (FK to members) with
-- profile_id (FK to profiles), backfilling from the existing member links.

alter table public.meeting_notifications
  add column profile_id uuid references public.profiles(id) on delete cascade;

update public.meeting_notifications mn
set profile_id = m.auth_user_id
from public.members m
where mn.member_id = m.id;

alter table public.meeting_notifications
  drop constraint meeting_notification_unique;

alter table public.meeting_notifications
  alter column profile_id set not null;

alter table public.meeting_notifications
  drop column member_id;

alter table public.meeting_notifications
  add constraint meeting_notification_unique unique (meeting_id, profile_id, notification_type);

create index if not exists meeting_notifications_profile_id_idx
  on public.meeting_notifications (profile_id);
