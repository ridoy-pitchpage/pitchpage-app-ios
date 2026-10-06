CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);

-- auth.uid() reads a session setting, as Supabase's does from the JWT.
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;

CREATE TABLE storage.objects (id bigserial PRIMARY KEY, name text);
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
$$ SELECT string_to_array(name, '/') $$;

-- Supabase Storage's guard, as its migration 0055 installs it: a DELETE on
-- storage.objects from SQL is refused unless the transaction has set
-- storage.allow_delete_query. Without it here, a function that trips the guard
-- would pass this test and fail on the real database.
CREATE FUNCTION storage.protect_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
    RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.';
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects
  FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TABLE public.pitch_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id), slug text);

-- Page-keyed tables. FKs deliberately have NO cascade, so if the function
-- deletes in the wrong order Postgres will refuse and the test fails.
CREATE TABLE public.pitch_page_views  (id bigserial PRIMARY KEY, pitch_page_id uuid NOT NULL REFERENCES public.pitch_pages(id));
CREATE TABLE public.pitch_page_links  (id bigserial PRIMARY KEY, pitch_page_id uuid NOT NULL REFERENCES public.pitch_pages(id));
CREATE TABLE public.outreach_enrollments (id bigserial PRIMARY KEY, pitch_page_id uuid NOT NULL REFERENCES public.pitch_pages(id));
CREATE TABLE public.pitch_page_chat_messages (id bigserial PRIMARY KEY, pitch_page_id uuid REFERENCES public.pitch_pages(id), user_id uuid);
CREATE TABLE public.org_outcomes    (id bigserial PRIMARY KEY, pitch_page_id uuid REFERENCES public.pitch_pages(id), user_id uuid);
CREATE TABLE public.org_sponsorships(id bigserial PRIMARY KEY, pitch_page_id uuid REFERENCES public.pitch_pages(id), user_id uuid);
CREATE TABLE public.credit_transactions (id bigserial PRIMARY KEY, pitch_page_id uuid REFERENCES public.pitch_pages(id), user_id uuid NOT NULL REFERENCES auth.users(id));

-- User-keyed tables.
CREATE TABLE public.profiles      (user_id uuid PRIMARY KEY REFERENCES auth.users(id));
CREATE TABLE public.user_credits  (user_id uuid PRIMARY KEY REFERENCES auth.users(id), balance int);
CREATE TABLE public.org_members   (id bigserial PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id), org_id uuid);
CREATE TABLE public.voice_sessions(id bigserial PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id));
CREATE TABLE public.push_subscriptions (id bigserial PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id));

-- As on the real table: NOT NULL, and no ON DELETE rule. The one reference to
-- auth.users that blocks the final delete unless it is cleared first.
CREATE TABLE public.org_nudges (id bigserial PRIMARY KEY, actor_id uuid NOT NULL REFERENCES auth.users(id));
-- Deliberately absent: email_sequence_log, internal_accounts, org_clients,
-- outreach_*, personal_invite_redemptions, platform_admins,
-- user_email_connections. The function must skip these without erroring.

CREATE ROLE anon; CREATE ROLE authenticated;
