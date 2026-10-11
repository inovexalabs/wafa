-- Each document type now says who uploads it: everyone, members only, or
-- staff (superadmin, admin, accountant) only. Existing types stay "everyone".

alter table public.member_document_types
  add column applies_to text not null default 'everyone',
  add constraint member_document_types_applies_to_check
    check (applies_to in ('everyone', 'members', 'staff'));
