-- Staff (superadmin, admin, accountant) upload the same KYC documents as
-- members from their own profile. Staff have no `members` row, so a document
-- now belongs to either a member (member_id) or a staff profile (profile_id),
-- never both. The document types list is shared by everyone.

alter table public.member_documents
  alter column member_id drop not null,
  add column profile_id uuid
    references public.profiles(id)
    on delete cascade,
  add constraint member_documents_one_owner
    check (num_nonnulls(member_id, profile_id) = 1),
  add constraint member_documents_one_per_profile_type
    unique (profile_id, document_type_id);
