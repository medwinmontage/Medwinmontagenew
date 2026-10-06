-- Medwin Montage — one-time Supabase setup.
-- Run this in Supabase → SQL Editor AFTER the tables exist
-- (i.e. after `npx prisma migrate dev` or `npx prisma db push`).
-- It is safe to run again.

-- 1) Lock the tables.
-- Supabase exposes every table in the "public" schema through its auto-generated
-- API, readable with the public (anon) key unless Row Level Security is on.
-- The app never uses that API — it talks to Postgres through Prisma, which
-- connects as the table owner and is not affected by RLS. So: turn RLS on for
-- every table and add no policies. Result: the anon key can read nothing.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- 2) Storage buckets.
--    public-media  : banner images and the logo (anyone can view; only the server can upload)
--    private-files : resumes (nobody can view; the server hands admins a 60-second signed link)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 4194304, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('private-files', 'private-files', false, 5242880, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- No storage policies are added on purpose: uploads and signed links are made
-- by the server with the service-role key, which bypasses policies.

-- 3) Optional, only if this database has rows from before the upgrade:
--    rename the old statuses. (The app already reads them correctly without this.)
-- update "Booking" set status = 'Incomplete' where status = 'Pending';
-- update "Booking" set status = 'Processing' where status = 'Confirmed';
-- update "Lead"    set status = 'Incomplete' where status = 'Pending';
-- update "Lead"    set status = 'Processing' where status = 'Confirmed';

-- Realtime needs no SQL: the app uses Broadcast channels (a "something changed"
-- ping with no data in it), not database change streams.
