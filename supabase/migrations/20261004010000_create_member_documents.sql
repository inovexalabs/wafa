-- Member KYC documents. The superadmin manages the list of document types
-- (add / rename / mark required / delete); each member uploads at most one file
-- per type from their profile. Citizenship is seeded as the one required type.

create table public.member_document_types (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  description text,
  is_required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_member_document_types_updated_at
before update on public.member_document_types
for each row execute function public.set_updated_at();

insert into public.member_document_types (name, description, is_required, sort_order)
values ('Citizenship', 'Nepali citizenship certificate, front and back in one PDF or image.', true, 0)
on conflict (name) do nothing;

create table public.member_documents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  document_type_id uuid not null references public.member_document_types(id) on delete cascade,
  document_number varchar(100),
  file_key text not null,
  original_filename text not null,
  mime_type varchar(150) not null,
  file_size bigint not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_documents_file_size_positive check (file_size > 0),
  constraint member_documents_one_per_type unique (member_id, document_type_id)
);

create index idx_member_documents_type on public.member_documents(document_type_id);

create trigger trg_member_documents_updated_at
before update on public.member_documents
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('member-documents', 'member-documents', false)
on conflict (id) do nothing;
