-- Certificates are now a PNG that an admin uploads for each recipient instead
-- of an HTML template rendered in the browser. The image lives in the private
-- `certificates` bucket and is served through short-lived signed URLs.
--
-- Certificates issued before this change keep their row (template_html is kept
-- but no longer written); they have no image until an admin deletes and
-- re-issues them.

alter table public.certificates
  alter column template_html drop not null,
  add column file_key text,
  add column original_filename text,
  add column mime_type varchar(150),
  add column file_size bigint,
  add constraint certificates_file_size_positive check (file_size is null or file_size > 0);

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;
