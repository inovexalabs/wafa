-- Re-enable Row Level Security on every table in the public schema, reversing
-- 20261002000000_disable_rls_all_tables.sql.
--
-- The API (api/) is the only consumer of this database and always connects with
-- the service_role key, which bypasses RLS, so this has no effect on the app.
-- What it does change: with RLS off, anyone holding the project's anon key (a
-- publishable, non-secret value) could read and write every table directly
-- through PostgREST. With RLS on and no policies, those roles see nothing.
--
-- If the API ever starts failing with "new row violates row-level security
-- policy", the shared admin client has been downgraded to a user session — see
-- SupabaseService.createSessionClient() — fix that rather than disabling RLS.

do $$
declare
  t record;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end
$$;

-- Nothing uses the anon/authenticated roles, so drop their table, sequence and
-- function grants as well. RLS does not cover TRUNCATE, and this keeps a table
-- that is created later without RLS from being exposed by default.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;

-- Unpublished public documents were downloadable by anyone who knew (or guessed)
-- their timestamped storage key. Files are now served through the API, which
-- checks is_published and hands out a short-lived signed URL.
update storage.buckets set public = false where id = 'landing-documents';
