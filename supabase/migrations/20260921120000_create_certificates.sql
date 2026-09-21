-- Certificates: admins can award certificates to users (any profile role).
-- The design is stored as HTML and rendered inline; it can be exported to
-- PDF/PNG when viewed or downloaded.

create sequence public.certificate_number_seq
  as bigint
  start with 100001
  increment by 1;

create table public.certificates (
  id uuid primary key default gen_random_uuid(),

  certificate_number varchar(50) not null unique
    default (
      'CERT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.certificate_number_seq')::text, 6, '0')
    ),

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  title varchar(200) not null,
  description text,

  template_html text not null,

  issued_at timestamptz not null default now(),
  issued_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_certificates_profile
  on public.certificates(profile_id);

create index idx_certificates_issued
  on public.certificates(issued_at desc);

create trigger trg_certificates_updated_at
before update on public.certificates
for each row execute function public.set_updated_at();
